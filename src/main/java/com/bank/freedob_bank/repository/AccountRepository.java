package com.bank.freedob_bank.repository;

import com.bank.freedob_bank.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByStatus(String status);
    Optional<Account> findByAccountNumber(String accountNumber);

    /**
     * Захватывает эксклюзивную пессимистичную блокировку строки счета (SELECT ... FOR UPDATE).
     * Защищает от Race Condition и одновременного списания баланса в параллельных потоках.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.accountId = :id")
    Optional<Account> findByIdForUpdate(@Param("id") Long id);
}