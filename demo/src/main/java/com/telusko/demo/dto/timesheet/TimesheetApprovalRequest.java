package com.telusko.demo.dto.timesheet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for timesheet approval/rejection request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetApprovalRequest {
    private String comments;
    private boolean approved;
}
