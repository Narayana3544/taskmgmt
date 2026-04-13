package com.telusko.demo.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetEntryReportResponse {
    private Long entryId;
    private Long userId;
    private String userName;
    private String userEmail;
    private LocalDate workDate;
    private String entryType;
    private Long workItemId;
    private String workItemTitle;
    private Long projectId;
    private String projectName;
    private String startTime;
    private String endTime;
    private Integer durationMinutes;
    private String approvalStatusCode;
    private String approvalStatusName;
    private String description;
}
