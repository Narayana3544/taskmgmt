package com.telusko.demo.user.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private Long roleId;
    private String roleName;
    
    private Long managerId;
    private String managerName;
    private String status;
    private String phoneNumber;
    private Long organizationId;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
