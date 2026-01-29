package com.telusko.demo.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for successful authentication.
 * Contains access token, refresh token, and user details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn; // Access token expiry in seconds
    
    // User info
    private Integer userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private List<String> permissions;
    
    // Profile info
    private String profilePicture;
    private String department;
    private String designation;
}
