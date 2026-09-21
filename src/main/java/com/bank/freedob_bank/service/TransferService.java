package com.bank.freedob_bank.service;

import com.bank.freedob_bank.dto.TransferRequest;
import com.bank.freedob_bank.dto.TransferResponse;
import com.bank.freedob_bank.entity.Account;
import com.bank.freedob_bank.entity.Transaction;
import com.bank.freedob_bank.entity.Transfer;
import com.bank.freedob_bank.exception.AccountNotFoundException;
import com.bank.freedob_bank.exception.ConcurrentTransferException;
import com.bank.freedob_bank.exception.InsufficientFundsException;
import com.bank.freedob_bank.exception.InvalidTransferException;
import com.bank.freedob_bank.repository.AccountRepository;
import com.bank.freedob_bank.repository.OutboxEventRepository;
import com.bank.freedob_bank.repository.TransactionRepository;
import com.bank.freedob_bank.repository.TransferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferService {

    private final AccountRepository accountRepository;
    private final TransferRepository transferRepository;
    private final TransactionRepository transactionRepository;
    private final IdempotencyService idempotencyService;
    private final OutboxEventRepository outboxEventRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Выполняет межбанковский перевод с двухуровневой защитой:
     * 1. Скоростная In-Memory идемпотентность и распределенная блокировка (Redis SET NX).
     * 2. ACID транзакция и пессимистичная блокировка счетов (PostgreSQL SELECT FOR UPDATE).
     */
    @Transactional
    public TransferResponse executeTransfer(TransferRequest request) {
        String key = request.idempotencyKey();
        log.info("Initiating transfer of {} KZT from account {} to {}",
            request.amount(), request.sourceAccountId(), request.targetAccountId());

        // 1. Проверка инварианта: нельзя переводить самому себе
        if (request.sourceAccountId().equals(request.targetAccountId())) {
            throw new InvalidTransferException("Source and target accounts must be different");
        }

        // 2. УРОВЕНЬ 1 (REDIS): Проверка закешированного завершенного ответа
        Optional<TransferResponse> cachedResponse = idempotencyService.getResponse(key);
        if (cachedResponse.isPresent()) {
            log.info("Redis cache hit for key: {}. Returning cached result without DB hit.", key);
            return cachedResponse.get();
        }

        // 3. УРОВЕНЬ 1 (REDIS): Атомарный захват замка на 60 секунд (SET ... NX EX)
        boolean lockAcquired = idempotencyService.tryAcquire(key, 60);
        if (!lockAcquired) {
            log.warn("Concurrent transfer request detected for key: {}. Rejecting with 409 Conflict.", key);
            throw new ConcurrentTransferException("Transfer with key '" + key + "' is already in progress. Please wait.");
        }

        try {
            // 4. УРОВЕНЬ 2 (БД): Резервная проверка идемпотентности в PostgreSQL
            Optional<Transfer> existingTransfer = transferRepository.findByIdempotencyKey(key);
            if (existingTransfer.isPresent()) {
                Transfer t = existingTransfer.get();
                log.info("DB fallback match found for key: {}. Returning result.", key);
                TransferResponse response = toResponse(t, "Transfer already processed (Idempotent replay)");
                idempotencyService.saveResponse(key, response, 24);
                return response;
            }

            // 5. Защита от DEADLOCK: упорядоченный захват блокировок по ID счетов
            Long firstId = Math.min(request.sourceAccountId(), request.targetAccountId());
            Long secondId = Math.max(request.sourceAccountId(), request.targetAccountId());

            Account firstAccount = accountRepository.findByIdForUpdate(firstId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with ID: " + firstId));
            Account secondAccount = accountRepository.findByIdForUpdate(secondId)
                .orElseThrow(() -> new AccountNotFoundException("Account not found with ID: " + secondId));

            Account sourceAccount = request.sourceAccountId().equals(firstId) ? firstAccount : secondAccount;
            Account targetAccount = request.targetAccountId().equals(firstId) ? firstAccount : secondAccount;

            // 6. Проверка активности счетов
            if (!"ACTIVE".equalsIgnoreCase(sourceAccount.getStatus())) {
                throw new InvalidTransferException("Source account is not active: " + sourceAccount.getStatus());
            }
            if (!"ACTIVE".equalsIgnoreCase(targetAccount.getStatus())) {
                throw new InvalidTransferException("Target account is not active: " + targetAccount.getStatus());
            }

            // 7. Защита от DOUBLE SPENDING: проверка баланса под эксклюзивным замком
            if (sourceAccount.getBalance().compareTo(request.amount()) < 0) {
                log.warn("Transfer failed: Insufficient funds on account {}. Balance: {}, Requested: {}",
                    sourceAccount.getAccountId(), sourceAccount.getBalance(), request.amount());
                throw new InsufficientFundsException(String.format(
                    "Insufficient funds on account %d. Current balance: %s, Requested: %s",
                    sourceAccount.getAccountId(), sourceAccount.getBalance(), request.amount()
                ));
            }

            // 8. Атомарное обновление балансов
            sourceAccount.setBalance(sourceAccount.getBalance().subtract(request.amount()));
            targetAccount.setBalance(targetAccount.getBalance().add(request.amount()));

            accountRepository.save(sourceAccount);
            accountRepository.save(targetAccount);

            // 9. Сохранение перевода в БД
            Transfer transfer = Transfer.builder()
                .sourceAccount(sourceAccount)
                .targetAccount(targetAccount)
                .amount(request.amount())
                .currency("KZT")
                .status("COMPLETED")
                .idempotencyKey(key)
                .build();
            transfer = transferRepository.save(transfer);

            // 10. Аудит-проводки в Transaction (DEBIT / CREDIT)
            saveAuditTransactions(sourceAccount, targetAccount, request.amount(), transfer.getId());

            // 11. Transactional Outbox Pattern: сохранение события в той же транзакции БД
            saveOutboxEvent(transfer, sourceAccount, targetAccount, key);

            TransferResponse response = toResponse(transfer, "Transfer successfully processed");

            // 12. Сохранение готового ответа в Redis на 24 часа для мгновенных повторных ответов
            idempotencyService.saveResponse(key, response, 24);

            log.info("Transfer {} successfully completed and cached in Redis. Source balance: {}, Target: {}",
                transfer.getId(), sourceAccount.getBalance(), targetAccount.getBalance());

            return response;

        } catch (Exception ex) {
            // При ошибке освобождаем замок в Redis, чтобы клиент мог повторить с исправленными данными
            idempotencyService.release(key);
            throw ex;
        }
    }

    public TransferResponse getTransferById(UUID id) {
        Transfer t = transferRepository.findById(id)
            .orElseThrow(() -> new AccountNotFoundException("Transfer not found with ID: " + id));
        return toResponse(t, "Success");
    }

    private TransferResponse toResponse(Transfer t, String message) {
        return new TransferResponse(
            t.getId(),
            t.getSourceAccount().getAccountId(),
            t.getTargetAccount().getAccountId(),
            t.getAmount(),
            t.getCurrency(),
            t.getStatus(),
            t.getIdempotencyKey(),
            t.getCreatedAt(),
            message
        );
    }

    private void saveAuditTransactions(Account source, Account target, java.math.BigDecimal amount, UUID transferId) {
        Transaction debitTx = new Transaction();
        debitTx.setAccount(source);
        debitTx.setAmount(amount.negate());
        debitTx.setTransactionType("TRANSFER_DEBIT");
        debitTx.setTransactionDate(LocalDateTime.now());
        debitTx.setDescription("Transfer to " + target.getAccountNumber() + " (ID: " + transferId + ")");
        transactionRepository.save(debitTx);

        Transaction creditTx = new Transaction();
        creditTx.setAccount(target);
        creditTx.setAmount(amount);
        creditTx.setTransactionType("TRANSFER_CREDIT");
        creditTx.setTransactionDate(LocalDateTime.now());
        creditTx.setDescription("Transfer from " + source.getAccountNumber() + " (ID: " + transferId + ")");
        transactionRepository.save(creditTx);
    }

    private void saveOutboxEvent(Transfer transfer, Account source, Account target, String idempotencyKey) {
        try {
            com.bank.freedob_bank.dto.TransferCompletedEvent event = new com.bank.freedob_bank.dto.TransferCompletedEvent(
                transfer.getId(),
                source.getAccountId(),
                target.getAccountId(),
                transfer.getAmount(),
                transfer.getCurrency(),
                idempotencyKey,
                transfer.getCreatedAt()
            );

            String jsonPayload = objectMapper.writeValueAsString(event);

            com.bank.freedob_bank.entity.OutboxEvent outboxEvent = com.bank.freedob_bank.entity.OutboxEvent.builder()
                .aggregateType("TRANSFER")
                .aggregateId(transfer.getId().toString())
                .eventType("TRANSFER_COMPLETED")
                .payload(jsonPayload)
                .status("PENDING")
                .build();

            outboxEventRepository.save(outboxEvent);
            log.debug("Outbox event created for transfer {}", transfer.getId());
        } catch (Exception e) {
            log.error("Failed to serialize outbox event for transfer {}: {}", transfer.getId(), e.getMessage());
            throw new RuntimeException("Outbox event generation failed", e);
        }
    }
}
