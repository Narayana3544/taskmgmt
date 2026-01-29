package com.telusko.demo.dto.timesheet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for timesheet entry data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetDTO {
    private int id;
    private int userId;
    private String userName;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String workType;
    private Integer taskId;
    private String taskTitle;
    private String description;
    private boolean approved;
    private String status;
    private double hours;
}
