package com.bank.freedob_bank.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loan")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_id")
    private Long loanId;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "loan_amount", nullable = false)
    private BigDecimal loanAmount;

    @Column(name = "interest_rate")
    private BigDecimal interestRate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String status;
}