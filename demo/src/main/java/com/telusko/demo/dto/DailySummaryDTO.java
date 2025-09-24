package com.telusko.demo.dto;

import java.time.LocalDate;

public class DailySummaryDTO {
    private LocalDate date;
    private double totalHours;   // e.g. 7.5 for 7h30m
    private String status;       // Worked | Leave | Official | Time Off

    public DailySummaryDTO(LocalDate date, double totalHours, String status) {
        this.date = date;
        this.totalHours = totalHours;
        this.status = status;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
