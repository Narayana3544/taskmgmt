package com.telusko.demo.timesheet.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TimesheetEntryResponse {
    private Long id;
    private Long timesheetId;
    private String entryType;
    private Long workItemId;
    private String workItemTitle;
    private String startTime; // "HH:mm"
    private String endTime;   // "HH:mm"
    private Integer durationMinutes;
    private String approvalStatusCode;
    private String approvalStatusName;
    private String description;
    private String notes; // mapped to description
    private LocalDateTime createdAt;
}
