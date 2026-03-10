package com.telusko.demo.timesheet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class CreateTimesheetEntryRequest {
    
    @NotBlank(message = "Entry type is required")
    private String entryType;
    
    private Long workItemId;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private String notes;
}
