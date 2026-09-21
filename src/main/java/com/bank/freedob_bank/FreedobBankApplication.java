package com.bank.freedob_bank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class FreedobBankApplication {
	public static void main(String[] args) {
		SpringApplication.run(FreedobBankApplication.class, args);
	}
}