package com.telusko.demo.dto.leave;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for leave balance information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceDTO {
    private int id;
    private int userId;
    private String leaveType;
    private int totalAllocated;
    private int used;
    private int remaining;
    private int year;
}
