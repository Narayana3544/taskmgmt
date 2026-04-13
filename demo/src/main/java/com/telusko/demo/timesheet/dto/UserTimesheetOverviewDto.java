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
}
