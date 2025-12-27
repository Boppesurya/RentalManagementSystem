package com.xerox.rental.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.xerox.rental.entity.User;
import com.xerox.rental.service.UserService;

import jakarta.annotation.PostConstruct;

@Component
public class DataInitializer {
    @Autowired
    private UserService userService;
    
    @PostConstruct
    public void initializeData() {
        // Check if admin exists, if not create one
        if (!userService.findByEmail("boppesuryap@gmail.com").isPresent()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("boppesuryap@gmail.com");
            admin.setPassword("Admin@12");
            admin.setRole(User.Role.ADMIN);
            admin.setContactNumber("+91 9963434484");
            admin.setAddress("AP MIG-11 159");
            admin.setOwner(null);
            userService.createUser(admin);
        }
    }
}
