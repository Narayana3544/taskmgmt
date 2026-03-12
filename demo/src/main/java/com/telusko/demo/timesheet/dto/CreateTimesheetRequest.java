package com.telusko.demo.timesheet.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTimesheetRequest {
    @NotNull(message = "Work date is required")
    private LocalDate workDate;
}
