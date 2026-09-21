package com.bank.freedob_bank.service;

import com.bank.freedob_bank.dto.TransferRequest;
import com.bank.freedob_bank.dto.TransferResponse;
import com.bank.freedob_bank.entity.Account;
import com.bank.freedob_bank.entity.Transfer;
import com.bank.freedob_bank.exception.ConcurrentTransferException;
import com.bank.freedob_bank.exception.InsufficientFundsException;
import com.bank.freedob_bank.exception.InvalidTransferException;
import com.bank.freedob_bank.repository.AccountRepository;
import com.bank.freedob_bank.repository.TransactionRepository;
import com.bank.freedob_bank.repository.TransferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransferRepository transferRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private com.bank.freedob_bank.repository.OutboxEventRepository outboxEventRepository;

    @Mock
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @InjectMocks
    private TransferService transferService;

    private Account sourceAccount;
    private Account targetAccount;

    @BeforeEach
    void setUp() {
        sourceAccount = new Account();
        sourceAccount.setAccountId(1L);
        sourceAccount.setAccountNumber("KZ1111111111");
        sourceAccount.setBalance(new BigDecimal("10000.00"));
        sourceAccount.setStatus("ACTIVE");

        targetAccount = new Account();
        targetAccount.setAccountId(2L);
        targetAccount.setAccountNumber("KZ2222222222");
        targetAccount.setBalance(new BigDecimal("5000.00"));
        targetAccount.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Успешный перевод: списание, начисление и сохранение в Redis")
    void executeTransfer_Success() {
        TransferRequest request = new TransferRequest(
            1L, 2L, new BigDecimal("3000.00"), "key-123", "Test transfer"
        );

        when(idempotencyService.getResponse("key-123")).thenReturn(Optional.empty());
        when(idempotencyService.tryAcquire("key-123", 60)).thenReturn(true);
        when(transferRepository.findByIdempotencyKey("key-123")).thenReturn(Optional.empty());
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetAccount));
        when(transferRepository.save(any(Transfer.class))).thenAnswer(invocation -> {
            Transfer t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        try {
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"event\":\"test\"}");
        } catch (Exception ignored) {}

        TransferResponse response = transferService.executeTransfer(request);

        assertNotNull(response);
        assertEquals("COMPLETED", response.status());
        assertEquals(new BigDecimal("3000.00"), response.amount());
        assertEquals(new BigDecimal("7000.00"), sourceAccount.getBalance());
        assertEquals(new BigDecimal("8000.00"), targetAccount.getBalance());

        verify(idempotencyService).saveResponse(eq("key-123"), any(), eq(24L));
        verify(accountRepository).save(sourceAccount);
        verify(accountRepository).save(targetAccount);
        verify(transactionRepository, times(2)).save(any());
        verify(outboxEventRepository).save(any(com.bank.freedob_bank.entity.OutboxEvent.class));
    }

    @Test
    @DisplayName("Redis In-Memory защита: отсечение параллельного запроса (409 Conflict) без обращения к БД")
    void executeTransfer_ConcurrentRequest_ThrowsConflict() {
        TransferRequest request = new TransferRequest(
            1L, 2L, new BigDecimal("1000.00"), "key-concurrent", "Fast click"
        );

        when(idempotencyService.getResponse("key-concurrent")).thenReturn(Optional.empty());
        // Redis говорит: замок уже занят параллельным запросом!
        when(idempotencyService.tryAcquire("key-concurrent", 60)).thenReturn(false);

        ConcurrentTransferException ex = assertThrows(ConcurrentTransferException.class,
            () -> transferService.executeTransfer(request));

        assertTrue(ex.getMessage().contains("already in progress"));

        // PostgreSQL вообще не нагружался!
        verifyNoInteractions(accountRepository);
        verifyNoInteractions(transferRepository);
    }

    @Test
    @DisplayName("Redis Cache Hit: мгновенный возврат ранее сохраненного ответа без нагрузки на БД")
    void executeTransfer_RedisCacheHit_ReturnsInstantly() {
        TransferRequest request = new TransferRequest(
            1L, 2L, new BigDecimal("2000.00"), "key-cached", "Replay"
        );

        TransferResponse cached = new TransferResponse(
            UUID.randomUUID(), 1L, 2L, new BigDecimal("2000.00"), "KZT",
            "COMPLETED", "key-cached", OffsetDateTime.now(), "Cached"
        );

        when(idempotencyService.getResponse("key-cached")).thenReturn(Optional.of(cached));

        TransferResponse result = transferService.executeTransfer(request);

        assertSame(cached, result);
        verify(idempotencyService, never()).tryAcquire(any(), anyLong());
        verifyNoInteractions(accountRepository);
    }

    @Test
    @DisplayName("Недостаток средств: сбой перевода и обязательное освобождение замка в Redis")
    void executeTransfer_InsufficientFunds_ReleasesLock() {
        TransferRequest request = new TransferRequest(
            1L, 2L, new BigDecimal("15000.00"), "key-overdraft", "Overdraft test"
        );

        when(idempotencyService.getResponse("key-overdraft")).thenReturn(Optional.empty());
        when(idempotencyService.tryAcquire("key-overdraft", 60)).thenReturn(true);
        when(transferRepository.findByIdempotencyKey("key-overdraft")).thenReturn(Optional.empty());
        when(accountRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(targetAccount));

        assertThrows(InsufficientFundsException.class, () -> transferService.executeTransfer(request));

        // Замок в Redis освобожден, чтобы клиент мог повторить запрос
        verify(idempotencyService).release("key-overdraft");
        verify(accountRepository, never()).save(any());
    }
}
