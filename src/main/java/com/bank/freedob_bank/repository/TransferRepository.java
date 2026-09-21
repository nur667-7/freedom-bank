package com.bank.freedob_bank.repository;

import com.bank.freedob_bank.entity.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, UUID> {
    Optional<Transfer> findByIdempotencyKey(String idempotencyKey);
}
