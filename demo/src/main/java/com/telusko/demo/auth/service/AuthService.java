package com.telusko.demo.auth.service;

import com.telusko.demo.auth.dto.AuthResponse;
import com.telusko.demo.auth.dto.LoginRequest;
import com.telusko.demo.auth.dto.RegisterRequest;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.UnauthorizedException;
import com.telusko.demo.common.security.JwtTokenProvider;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import com.telusko.demo.role.entity.Role;
import com.telusko.demo.role.repository.RoleRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.entity.UserAuth;
import com.telusko.demo.user.repository.UserAuthRepository;
import com.telusko.demo.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Handles user authentication — login, registration, and token generation.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
            UserAuthRepository userAuthRepository,
            RoleRepository roleRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.userAuthRepository = userAuthRepository;
        this.roleRepository = roleRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Authenticate a user and return JWT tokens.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        UserAuth auth = userAuthRepository.findByUserId(user.getId())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), auth.getPasswordHash())) {
            log.error("Authentication failed for email: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("Account is deactivated. Please contact your administrator.");
        }

        // Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String roleCode = user.getRole() != null ? user.getRole().getCode() : "USER";
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roleCode);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        log.info("User {} authenticated successfully", user.getEmail());

        String roleName = user.getRole() != null ? user.getRole().getName() : "Employee";

        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleCode)
                .roleCode(roleCode)
                .roleName(roleName)
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .organizationLogo(user.getOrganization() != null ? user.getOrganization().getLogoUrl() : null)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .requiresPasswordChange(user.getRequiresPasswordChange())
                .build();
    }

    /**
     * Register a new user. Creates Organization and default Role if needed.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        // Resolve or create organization
        Organization org;
        if (request.getOrganizationId() != null) {
            org = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new BadRequestException("Organization not found"));
        } else {
            // Auto-create a custom organization for new users
            String orgName = request.getOrganizationName() != null && !request.getOrganizationName().trim().isEmpty() 
                    ? request.getOrganizationName() 
                    : "Default Organization";
            org = organizationRepository.save(Organization.builder()
                    .name(orgName)
                    .code("ORG-" + System.currentTimeMillis())
                    .timezone("UTC")
                    .workingDays("MON-FRI")
                    .active(true)
                    .build());
            log.debug("Created default organization with id: {}", org.getId());
        }

        // Resolve or create default role
        Role role = roleRepository.findByOrganizationIdAndCode(org.getId(), "ADMIN")
                .orElseGet(() -> {
                    Role newRole = roleRepository.save(Role.builder()
                            .organization(org)
                            .code("ADMIN")
                            .name("Administrator")
                            .description("Full system access")
                            .systemDefined(true)
                            .active(true)
                            .build());
                    log.debug("Created default ADMIN role for org: {}", org.getId());
                    return newRole;
                });

        // Create user
        User user = User.builder()
                .organization(org)
                .role(role)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .status("ACTIVE")
                .active(true)
                .build();
        user = userRepository.save(user);
        log.debug("Created user with id: {}", user.getId());

        // Create auth credentials
        UserAuth auth = UserAuth.builder()
                .user(user)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .passwordUpdatedAt(LocalDateTime.now())
                .build();
        userAuthRepository.save(auth);

        // Generate tokens
        String roleCode = role.getCode();
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roleCode);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        log.info("User {} registered successfully", user.getEmail());

        String roleName = role.getName();

        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleCode)
                .roleCode(roleCode)
                .roleName(roleName)
                .organizationId(org.getId())
                .organizationName(org.getName())
                .organizationLogo(org.getLogoUrl())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * Change a user's password.
     */
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        UserAuth auth = userAuthRepository.findByUserId(userId)
                .orElseThrow(() -> new UnauthorizedException("User credentials not found"));

        if (!passwordEncoder.matches(oldPassword, auth.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Update password hash and reset flag
        auth.setPasswordHash(passwordEncoder.encode(newPassword));
        auth.setPasswordUpdatedAt(LocalDateTime.now());
        userAuthRepository.save(auth);

        user.setRequiresPasswordChange(false);
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getEmail());
    }
}
