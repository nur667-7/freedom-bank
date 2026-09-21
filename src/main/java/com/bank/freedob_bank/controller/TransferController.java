package com.bank.freedob_bank.controller;

import com.bank.freedob_bank.dto.TransferRequest;
import com.bank.freedob_bank.dto.TransferResponse;
import com.bank.freedob_bank.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    public ResponseEntity<TransferResponse> createTransfer(@Valid @RequestBody TransferRequest request) {
        TransferResponse response = transferService.executeTransfer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferResponse> getTransfer(@PathVariable UUID id) {
        return ResponseEntity.ok(transferService.getTransferById(id));
    }
}
