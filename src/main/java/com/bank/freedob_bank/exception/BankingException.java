package com.bank.freedob_bank.exception;

public abstract class BankingException extends RuntimeException {
    public BankingException(String message) {
        super(message);
    }
}
