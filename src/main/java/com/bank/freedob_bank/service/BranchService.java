package com.bank.freedob_bank.service;

import com.bank.freedob_bank.entity.Branch;
import com.bank.freedob_bank.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BranchService {

    @Autowired
    private BranchRepository branchRepository;

    public Branch createBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public Branch getById(Long id) {
        return branchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Branch not found: " + id));
    }

    public Branch updateBranch(Long id, Branch updated) {
        Branch existing = getById(id);
        existing.setBranchName(updated.getBranchName());
        existing.setCity(updated.getCity());
        existing.setAddress(updated.getAddress());
        existing.setPhone(updated.getPhone());
        return branchRepository.save(existing);
    }

    public void deleteBranch(Long id) {
        branchRepository.deleteById(id);
    }
}