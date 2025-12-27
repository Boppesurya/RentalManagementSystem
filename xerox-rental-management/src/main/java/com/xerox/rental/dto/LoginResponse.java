package com.xerox.rental.dto;

import com.xerox.rental.entity.User;
import lombok.Data;

@Data
public class LoginResponse {
    private boolean success;
    private String message;
    private User user;
    private String token;
    private boolean requiresTwoFactor;
    private Long tempUserId;

    public LoginResponse(boolean success, String message, User user) {
        this.success = success;
        this.message = message;
        this.user = user;
        this.requiresTwoFactor = false;
    }

    public LoginResponse(boolean success, String message, User user, String token) {
        this.success = success;
        this.message = message;
        this.user = user;
        this.token = token;
        this.requiresTwoFactor = false;
    }

    public LoginResponse(boolean success, String message, boolean requiresTwoFactor, Long tempUserId) {
        this.success = success;
        this.message = message;
        this.requiresTwoFactor = requiresTwoFactor;
        this.tempUserId = tempUserId;
    }
}