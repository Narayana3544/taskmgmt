package com.telusko.demo.role.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoleResponse {
    private Long id;
    private String code;
    private String name;
    private String displayName;
    private String description;
    private Boolean systemDefined;
    private Boolean active;
    private Long organizationId;
}
