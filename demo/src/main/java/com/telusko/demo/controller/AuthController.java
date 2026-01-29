package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.dto.auth.*;
import com.telusko.demo.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for authentication endpoints.
 * Handles login, token refresh, logout, and password reset.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    /**
     * Login endpoint - authenticates user and returns tokens
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        logger.info("Login request received for: {}", request.getEmail());
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Refresh token endpoint - exchanges refresh token for new access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        logger.debug("Token refresh request received");
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Logout endpoint - revokes the refresh token
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody RefreshTokenRequest request
    ) {
        logger.info("Logout request received");
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    /**
     * Logout from all devices - revokes all refresh tokens for the user
     */
    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, String>> logoutAll(
            @AuthenticationPrincipal User user
    ) {
        logger.info("Logout from all devices requested for user: {}", user.getEmail());
        authService.logoutAll(user);
        return ResponseEntity.ok(Map.of("message", "Logged out from all devices successfully"));
    }
    
    /**
     * Forgot password endpoint - initiates password reset flow
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        logger.info("Forgot password request for: {}", request.getEmail());
        authService.forgotPassword(request);
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(Map.of(
                "message", "If an account exists with this email, a password reset link has been sent."
        ));
    }
    
    /**
     * Reset password endpoint - resets password using token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        logger.info("Password reset request received");
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
    
    /**
     * Validate token endpoint - checks if access token is valid
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("valid", false));
        }
        
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "userId", user.getId(),
                "email", user.getEmail()
        ));
    }
    
    /**
     * Get current user info
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        String roleName = user.getRole() != null ? user.getRole().getDescription() : "USER";
        
        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirst_name())
                .lastName(user.getLast_name())
                .role(roleName)
                .build();
        
        return ResponseEntity.ok(response);
    }
}
