package com.bank.freedob_bank.exception;

public class InvalidTransferException extends BankingException {
    public InvalidTransferException(String message) {
        super(message);
    }
}
