package com.bank.freedob_bank.repository;

import com.bank.freedob_bank.entity.Employee; // Исправлено на правильный путь
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}