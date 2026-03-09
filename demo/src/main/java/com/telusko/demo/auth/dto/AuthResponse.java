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
    private Long organizationId;
    private String accessToken;
    private String refreshToken;
}
