package com.bank.freedob_bank.service;

import com.bank.freedob_bank.entity.Customer;
import com.bank.freedob_bank.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public Customer registerCustomer(Customer customer) {
        // ✅ убрали setRegistrationDate — дата ставится автоматически БД
        return customerRepository.save(customer);
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Клиент не найден: " + id));
    }

    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }
}