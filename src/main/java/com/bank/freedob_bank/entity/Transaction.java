package com.bank.freedob_bank.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "transaction_type")
    private String transactionType;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate;

    private String description;
}