package com.telusko.demo.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateLeaveRequest {

    @NotNull(message = "Leave Type is required")
    private Long leaveTypeId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Leave days is required")
    private BigDecimal leaveDays;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotNull(message = "User ID is required")
    private Long userId;

    private Long organizationId;
}
