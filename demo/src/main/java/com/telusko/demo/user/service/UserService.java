package com.telusko.demo.user.service;

import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import com.telusko.demo.role.entity.Role;
import com.telusko.demo.role.repository.RoleRepository;
import com.telusko.demo.user.dto.UserRequest;
import com.telusko.demo.user.dto.UserResponse;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.entity.UserAuth;
import com.telusko.demo.user.repository.UserAuthRepository;
import com.telusko.demo.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserAuthRepository userAuthRepository,
                       RoleRepository roleRepository, OrganizationRepository organizationRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userAuthRepository = userAuthRepository;
        this.roleRepository = roleRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsersByOrganization(Long orgId, Pageable pageable) {
        Page<User> users = userRepository.findByOrganizationId(orgId, pageable);
        Page<UserResponse> mapped = users.map(this::mapToResponse);
        return PageResponse.<UserResponse>builder()
                .content(mapped.getContent())
                .page(mapped.getNumber())
                .size(mapped.getSize())
                .totalElements(mapped.getTotalElements())
                .totalPages(mapped.getTotalPages())
                .last(mapped.isLast())
                .build();
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        Organization org = organizationRepository.findById(request.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.getOrganizationId()));

        Role role = null;
        if (request.getRoleId() != null) {
            role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "id", request.getRoleId()));
        } else {
            role = roleRepository.findByOrganizationIdAndCode(org.getId(), "EMPLOYEE").orElse(null);
        }

        User manager = null;
        if (request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager User", "id", request.getManagerId()));
        }

        User user = User.builder()
                .organization(org)
                .role(role)
                .manager(manager)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .status("ACTIVE")
                .active(true)
                .build();
        user = userRepository.save(user);

        String rawPassword = request.getPassword();
        boolean generated = false;
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = java.util.UUID.randomUUID().toString().substring(0, 10);
            generated = true;
        }

        UserAuth auth = UserAuth.builder()
                .user(user)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .passwordUpdatedAt(LocalDateTime.now())
                .build();
        userAuthRepository.save(auth);

        UserResponse response = mapToResponse(user);
        if (generated) {
            response.setTempPassword(rawPassword);
        }
        return response;
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateAvatar(Long id, String profileImageUrl) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setProfileImageUrl(profileImageUrl);
        user = userRepository.save(user);
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use by another account");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }

        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
            user.setActive("ACTIVE".equalsIgnoreCase(request.getStatus()));
        }

        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "id", request.getRoleId()));
            user.setRole(role);
        }

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager User", "id", request.getManagerId()));
            user.setManager(manager);
        } else {
            user.setManager(null);
        }

        user = userRepository.save(user);

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            UserAuth auth = userAuthRepository.findByUserId(id)
                    .orElse(UserAuth.builder().user(user).build());
            auth.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            auth.setPasswordUpdatedAt(LocalDateTime.now());
            userAuthRepository.save(auth);
        }

        return mapToResponse(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleId(user.getRole() != null ? user.getRole().getId() : null)
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .status(user.getStatus())
                .phoneNumber(user.getPhoneNumber())
                .organizationId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : null)
                .organizationLogo(user.getOrganization() != null ? user.getOrganization().getLogoUrl() : null)
                .profileImageUrl(user.getProfileImageUrl())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .managerId(user.getManager() != null ? user.getManager().getId() : null)
                .managerName(user.getManager() != null ? user.getManager().getFullName() : null)
                .build();
    }
}
