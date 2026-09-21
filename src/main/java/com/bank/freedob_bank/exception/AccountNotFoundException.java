package com.bank.freedob_bank.exception;

public class AccountNotFoundException extends BankingException {
    public AccountNotFoundException(String message) {
        super(message);
    }
}
