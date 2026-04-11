package com.bank.freedob_bank.service;

import com.bank.freedob_bank.entity.Loan;
import com.bank.freedob_bank.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    public Loan createLoan(Loan loan) {
        return loanRepository.save(loan);
    }

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public Loan getById(Long id) {
        return loanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Loan not found: " + id));
    }

    public Loan updateLoan(Long id, Loan updated) {
        Loan existing = getById(id);
        existing.setStatus(updated.getStatus());
        existing.setLoanAmount(updated.getLoanAmount());
        existing.setInterestRate(updated.getInterestRate());
        existing.setStartDate(updated.getStartDate());
        existing.setEndDate(updated.getEndDate());
        return loanRepository.save(existing);
    }

    public void deleteLoan(Long id) {
        loanRepository.deleteById(id);
    }
}