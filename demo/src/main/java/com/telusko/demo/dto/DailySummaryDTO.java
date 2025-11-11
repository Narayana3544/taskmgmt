package com.telusko.demo.dto;

import java.time.LocalDate;

public class DailySummaryDTO {
    private LocalDate date;
    private double totalHours;   // e.g. 7.5 for 7h30m
    private String totalHoursAndMinutes; // new: human-friendly string e.g. "7h 30m"
    private String status;       // Worked | Leave | Official | Time Off

    // New constructor (preferred)
    public DailySummaryDTO(LocalDate date, double totalHours, String totalHoursAndMinutes, String status) {
        this.date = date;
        this.totalHours = totalHours;
        this.totalHoursAndMinutes = totalHoursAndMinutes;
        this.status = status;
    }

    // Keep old constructor for backward compatibility
    public DailySummaryDTO(LocalDate date, double totalHours, String status) {
        this(date, totalHours,
                // derive human-friendly string from decimal hours (best-effort)
                String.format("%dh %02dm",
                        (int) totalHours,
                        (int) Math.round((totalHours - (int) totalHours) * 60.0)),
                status);
    }

    // getters / setters
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }

    public String getTotalHoursAndMinutes() { return totalHoursAndMinutes; }
    public void setTotalHoursAndMinutes(String totalHoursAndMinutes) { this.totalHoursAndMinutes = totalHoursAndMinutes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
