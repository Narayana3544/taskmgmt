package com.telusko.demo.dto;

import com.telusko.demo.Model.Timesheet;
import java.time.LocalDate;
import java.util.List;

public class DailySummaryWithLogsDTO extends DailySummaryDTO {
    private List<Timesheet> logs;

    // New constructor that accepts the formatted time string
    public DailySummaryWithLogsDTO(LocalDate date, double totalHours, String totalHoursAndMinutes, String status, List<Timesheet> logs) {
        super(date, totalHours, totalHoursAndMinutes, status);
        this.logs = logs;
    }

    // Keep old constructor for backward compatibility
    public DailySummaryWithLogsDTO(LocalDate date, double totalHours, String status, List<Timesheet> logs) {
        super(date, totalHours, status);
        this.logs = logs;
    }

    public List<Timesheet> getLogs() { return logs; }
    public void setLogs(List<Timesheet> logs) { this.logs = logs; }
}
