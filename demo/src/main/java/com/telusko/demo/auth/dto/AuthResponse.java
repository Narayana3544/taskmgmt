package com.telusko.demo.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String roleCode;
    private String roleName;
    private String designationName;
    private Long managerId;
    private String managerName;
    private Long organizationId;
    private String organizationName;
    private String organizationLogo;
    private String profileImageUrl;
    private String accessToken;
    private String refreshToken;
    private Boolean requiresPasswordChange;
}
