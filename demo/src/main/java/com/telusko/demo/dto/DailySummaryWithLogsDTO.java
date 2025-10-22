package com.telusko.demo.dto;

import com.telusko.demo.Model.Timesheet;

import java.time.LocalDate;
import java.util.List;

public class DailySummaryWithLogsDTO extends DailySummaryDTO {
    private List<Timesheet> logs;

    public DailySummaryWithLogsDTO(LocalDate date, double totalHours, String status, List<Timesheet> logs) {
        super(date, totalHours, status);
        this.logs = logs;
    }

    public List<Timesheet> getLogs() {
        return logs;
    }

    public void setLogs(List<Timesheet> logs) {
        this.logs = logs;
    }
}