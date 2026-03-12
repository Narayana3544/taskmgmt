package com.telusko.demo.timesheet.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TimesheetResponse {
    private Long id;
    private Long userId;
    private String userName;
    private LocalDate workDate;
    private Long statusId;
    private String statusCode;
    private String statusName;
    private LocalDateTime submittedAt;
    private LocalDateTime approvedAt;
    private Long approvedById;
    private String approvedByName;
    private List<TimesheetEntryResponse> entries;
    private Integer entryCount;
    private String totalHours;
}
