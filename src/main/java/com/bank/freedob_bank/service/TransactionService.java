package com.bank.freedob_bank.service;

import com.bank.freedob_bank.entity.Transaction;
import com.bank.freedob_bank.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getTransactionDate() == null) {
            transaction.setTransactionDate(LocalDateTime.now());
        }
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getByAccountId(Long accountId) {
        return transactionRepository.findByAccount_AccountId(accountId);
    }

    public Transaction getById(Long id) {
        return transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found: " + id));
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }
}