package com.telusko.demo.project.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectMemberRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long projectRoleId; // MasterValue for project-level role
    private Long managerId; // Project-specific reporting manager
    private LocalDate startDate;
    private LocalDate endDate;
}
