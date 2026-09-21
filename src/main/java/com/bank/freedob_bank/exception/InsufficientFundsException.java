package com.bank.freedob_bank.exception;

public class InsufficientFundsException extends BankingException {
    public InsufficientFundsException(String message) {
        super(message);
    }
}
