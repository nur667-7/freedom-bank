package com.bank.freedob_bank.service;

import com.bank.freedob_bank.entity.Account;
import com.bank.freedob_bank.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public Account createAccount(Account account) {
        return accountRepository.save(account);
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Account getById(Long id) {
        return accountRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Account not found: " + id));
    }

    public Account updateAccount(Long id, Account updated) {
        Account existing = getById(id);
        existing.setAccountType(updated.getAccountType());
        existing.setBalance(updated.getBalance());
        existing.setStatus(updated.getStatus());
        return accountRepository.save(existing);
    }

    public void deleteAccount(Long id) {
        accountRepository.deleteById(id);
    }
}