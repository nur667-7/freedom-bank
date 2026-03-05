package com.bank.freedob_bank.service;

import com.bank.freedob_bank.entity.Employee;
import com.bank.freedob_bank.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public Employee registerEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Сотрудник не найден: " + id));
    }

    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }
}