package com.telusko.demo.timesheet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTimesheetOverviewDto {
    private Long userId;
    private String userName;
    private Long daysFilled;
    private String email;
    private Long approvedDays;
    private Long pendingDays;
    private Double totalHours;

    // Constructor for rich JPQL query
    public UserTimesheetOverviewDto(Long userId, String userName, String email, Long daysFilled, Long approvedDays, Long pendingDays, Double totalHours) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.daysFilled = daysFilled;
        this.approvedDays = approvedDays != null ? approvedDays : 0L;
        this.pendingDays = pendingDays != null ? pendingDays : 0L;
        this.totalHours = totalHours != null ? totalHours : 0.0;
    }
}
