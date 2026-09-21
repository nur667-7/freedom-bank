package com.bank.freedob_bank.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TransferResponse(
    UUID transferId,
    Long sourceAccountId,
    Long targetAccountId,
    BigDecimal amount,
    String currency,
    String status,
    String idempotencyKey,
    OffsetDateTime createdAt,
    String message
) {}
