package com.bank.freedob_bank.repository;

import com.bank.freedob_bank.entity.Customer; // Добавлено подчеркивание
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Здесь магия Spring: методы save(), findAll(), findById() уже готовы!
}