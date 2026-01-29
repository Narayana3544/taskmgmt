package com.telusko.demo.dto.rbac;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for Role entity with permissions.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    private int id;
    private String name;
    private String description;
    private boolean systemRole;
    private Set<PermissionDTO> permissions;
}
