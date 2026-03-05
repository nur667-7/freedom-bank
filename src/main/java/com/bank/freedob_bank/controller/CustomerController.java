package com.bank.freedob_bank.controller;

import com.bank.freedob_bank.entity.Customer;
import com.bank.freedob_bank.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @PostMapping("/register")
    public Customer createCustomer(@RequestBody Customer customer) {
        return customerService.registerCustomer(customer);
    }

    @GetMapping
    public List<Customer> getAll() {
        return customerService.getAllCustomers();
    }

    @GetMapping("/{id}")
    public Customer getById(@PathVariable Long id) {
        return customerService.getById(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        customerService.deleteCustomer(id);
    }
}