package com.telusko.demo.dto.leave;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for leave request data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestDTO {
    private int id;
    private int userId;
    private String userName;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String status;
    private Integer managerId;
    private String managerName;
    private LocalDate requestedOn;
    private LocalDate approvedOn;
    private int days;
    private String rejectionReason;
}
