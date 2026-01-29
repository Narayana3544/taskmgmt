package com.telusko.demo.service;

import com.telusko.demo.Model.PasswordResetToken;
import com.telusko.demo.Model.RefreshToken;
import com.telusko.demo.Model.User;
import com.telusko.demo.dto.auth.*;
import com.telusko.demo.exception.AuthenticationException;
import com.telusko.demo.exception.TokenException;
import com.telusko.demo.repo.PasswordResetTokenRepository;
import com.telusko.demo.repo.RefreshTokenRepository;
import com.telusko.demo.repo.userrepo;
import com.telusko.demo.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Service for authentication operations.
 * Handles login, token refresh, logout, and password reset.
 */
@Service
@Transactional
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    private final userrepo userRepo;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    
    public AuthService(
            userrepo userRepo,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepo = userRepo;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * Authenticate user and generate tokens
     */
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        logger.info("Login attempt for user: {}", request.getEmail());
        
        // Find user
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.warn("Login failed - user not found: {}", request.getEmail());
                    return new AuthenticationException("Invalid email or password");
                });
        
        // Check if user is active
        if (!user.isIs_active()) {
            logger.warn("Login failed - inactive user: {}", request.getEmail());
            throw new AuthenticationException("Account is deactivated. Please contact administrator.");
        }
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            logger.warn("Login failed - invalid password for user: {}", request.getEmail());
            throw new AuthenticationException("Invalid email or password");
        }
        
        // Get user role and permissions
        String roleName = user.getRole() != null ? user.getRole().getDescription() : "USER";
        List<String> permissions = getUserPermissions(user);
        
        // Generate tokens
        String accessToken = jwtService.generateAccessToken(
                user.getEmail(),
                user.getId(),
                roleName,
                permissions
        );
        
        String refreshToken = jwtService.generateRefreshToken(
                user.getEmail(),
                user.getId()
        );
        
        // Store refresh token
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiryDate(LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiration() / 1000))
                .deviceInfo(request.getDeviceInfo())
                .ipAddress(getClientIp(httpRequest))
                .build();
        
        refreshTokenRepository.save(refreshTokenEntity);
        
        logger.info("Login successful for user: {}", request.getEmail());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration() / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirst_name())
                .lastName(user.getLast_name())
                .role(roleName)
                .permissions(permissions)
                .build();
    }
    
    /**
     * Refresh access token using refresh token
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshTokenStr = request.getRefreshToken();
        
        // Validate refresh token structure
        if (!jwtService.isTokenStructureValid(refreshTokenStr)) {
            throw new TokenException("Invalid refresh token");
        }
        
        // Check token type
        String tokenType = jwtService.getTokenType(refreshTokenStr);
        if (!"refresh".equals(tokenType)) {
            throw new TokenException("Invalid token type");
        }
        
        // Find token in database
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new TokenException("Refresh token not found"));
        
        // Validate token
        if (!refreshToken.isValid()) {
            throw new TokenException("Refresh token is expired or revoked");
        }
        
        User user = refreshToken.getUser();
        
        // Check if user is still active
        if (!user.isIs_active()) {
            throw new TokenException("User account is deactivated");
        }
        
        // Get user role and permissions
        String roleName = user.getRole() != null ? user.getRole().getDescription() : "USER";
        List<String> permissions = getUserPermissions(user);
        
        // Generate new access token
        String newAccessToken = jwtService.generateAccessToken(
                user.getEmail(),
                user.getId(),
                roleName,
                permissions
        );
        
        logger.info("Token refreshed for user: {}", user.getEmail());
        
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshTokenStr) // Return same refresh token
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration() / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirst_name())
                .lastName(user.getLast_name())
                .role(roleName)
                .permissions(permissions)
                .build();
    }
    
    /**
     * Logout user by revoking refresh token
     */
    public void logout(String refreshToken) {
        refreshTokenRepository.revokeToken(refreshToken);
        logger.info("User logged out, token revoked");
    }
    
    /**
     * Logout from all devices
     */
    public void logoutAll(User user) {
        refreshTokenRepository.revokeAllTokensForUser(user);
        logger.info("User {} logged out from all devices", user.getEmail());
    }
    
    /**
     * Initiate forgot password flow
     */
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepo.findByEmail(request.getEmail()).orElse(null);
        
        // Always return success to prevent email enumeration
        if (user == null) {
            logger.info("Forgot password requested for non-existent email: {}", request.getEmail());
            return;
        }
        
        // Invalidate any existing tokens
        passwordResetTokenRepository.invalidateAllTokensForUser(user);
        
        // Generate reset token
        String token = UUID.randomUUID().toString();
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .build();
        
        passwordResetTokenRepository.save(resetToken);
        
        // Log reset link (in production, this would send an email)
        String resetLink = "http://localhost:3000/reset-password?token=" + token;
        logger.info("==============================================");
        logger.info("PASSWORD RESET LINK (dummy mail): {}", resetLink);
        logger.info("Token: {}", token);
        logger.info("==============================================");
    }
    
    /**
     * Reset password using token
     */
    public void resetPassword(ResetPasswordRequest request) {
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AuthenticationException("Passwords do not match");
        }
        
        // Find and validate token
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findValidToken(request.getToken(), LocalDateTime.now())
                .orElseThrow(() -> new TokenException("Invalid or expired reset token"));
        
        User user = resetToken.getUser();
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        
        // Revoke all refresh tokens (force re-login)
        refreshTokenRepository.revokeAllTokensForUser(user);
        
        logger.info("Password reset successful for user: {}", user.getEmail());
    }
    
    /**
     * Get user permissions from role
     * TODO: This will be enhanced when dynamic RBAC is implemented
     */
    private List<String> getUserPermissions(User user) {
        if (user.getRole() == null) {
            return Collections.emptyList();
        }
        
        // For now, return role-based permissions
        // This will be replaced with dynamic permissions from Role entity
        String roleName = user.getRole().getDescription();
        
        return switch (roleName.toUpperCase()) {
            case "ADMIN" -> List.of(
                    "CREATE_TASK", "EDIT_TASK", "DELETE_TASK", "ASSIGN_TASK",
                    "CREATE_SPRINT", "CLOSE_SPRINT", "MANAGE_SPRINTS",
                    "CREATE_PROJECT", "EDIT_PROJECT", "DELETE_PROJECT",
                    "MANAGE_USERS", "MANAGE_ROLES",
                    "APPROVE_LEAVE", "VIEW_ALL_TIMESHEETS",
                    "VIEW_TEAM_DASHBOARD", "VIEW_ANALYTICS"
            );
            case "MANAGER" -> List.of(
                    "CREATE_TASK", "EDIT_TASK", "ASSIGN_TASK",
                    "CREATE_SPRINT", "CLOSE_SPRINT", "MANAGE_SPRINTS",
                    "CREATE_PROJECT", "EDIT_PROJECT",
                    "APPROVE_LEAVE", "VIEW_TEAM_TIMESHEETS",
                    "VIEW_TEAM_DASHBOARD", "VIEW_ANALYTICS"
            );
            case "DEVELOPER", "TEAM_LEAD" -> List.of(
                    "CREATE_TASK", "EDIT_TASK",
                    "VIEW_SPRINT",
                    "VIEW_PROJECT",
                    "SUBMIT_TIMESHEET",
                    "VIEW_DASHBOARD"
            );
            default -> List.of(
                    "VIEW_TASK",
                    "VIEW_SPRINT",
                    "VIEW_PROJECT",
                    "SUBMIT_TIMESHEET",
                    "VIEW_DASHBOARD"
            );
        };
    }
    
    /**
     * Extract client IP from request
     */
    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // If multiple IPs, get the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
