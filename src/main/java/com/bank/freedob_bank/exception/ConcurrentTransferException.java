package com.bank.freedob_bank.exception;

public class ConcurrentTransferException extends BankingException {
    public ConcurrentTransferException(String message) {
        super(message);
    }
}
