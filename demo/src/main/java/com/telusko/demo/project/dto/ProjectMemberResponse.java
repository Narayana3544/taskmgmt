package com.telusko.demo.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long projectRoleId;
    private String projectRoleName;
    private Long managerId;
    private String managerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
}
