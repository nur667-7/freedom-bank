package com.bank.freedob_bank.controller;

import com.bank.freedob_bank.entity.Employee;
import com.bank.freedob_bank.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @PostMapping("/register")
    public Employee register(@RequestBody Employee employee) {
        return employeeService.registerEmployee(employee);
    }

    @GetMapping
    public List<Employee> getAll() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/{id}")
    public Employee getById(@PathVariable Long id) {
        return employeeService.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
    }
}