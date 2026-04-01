package com.telusko.demo.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleRequest {
    @NotNull
    private Long organizationId;

    @NotBlank
    private String code;

    private String name;
    private String displayName;
    private String description;
}
