package com.bank.freedob_bank.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "branch")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "branch_name", nullable = false)
    private String branchName;

    @Column(name = "city", nullable = false)
    private String city;

    private String address;
    private String phone;
}