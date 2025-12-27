package com.xerox.rental;

import org.hibernate.validator.constraints.CodePointLength;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
@CodePointLength
@Configuration
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class XeroxRentalManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(XeroxRentalManagementApplication.class, args);
		
	}
	
}
