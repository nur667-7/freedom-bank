package com.bank.freedob_bank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record TransferRequest(
    @NotNull(message = "Source account ID is required")
    Long sourceAccountId,

    @NotNull(message = "Target account ID is required")
    Long targetAccountId,

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be strictly positive")
    BigDecimal amount,

    @NotBlank(message = "Idempotency key is required")
    String idempotencyKey,

    String description
) {}
