package com.bank.freedob_bank.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TransferCompletedEvent(
    UUID transferId,
    Long sourceAccountId,
    Long targetAccountId,
    BigDecimal amount,
    String currency,
    String idempotencyKey,
    OffsetDateTime timestamp
) {}
