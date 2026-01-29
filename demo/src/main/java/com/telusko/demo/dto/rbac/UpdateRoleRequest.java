package com.telusko.demo.dto.rbac;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Request DTO for updating a role.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {
    
    @Size(max = 255, message = "Description must not exceed 255 characters")
    private String description;
    
    private Set<Long> permissionIds;
}
