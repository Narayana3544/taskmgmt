package com.telusko.demo.dto;

import java.time.LocalDate;
import java.util.List;

public class TimesheetSummaryDTO {
    private int userId;
    private String username;
    private double totalHours;
    private int daysFilled;
    private int totalWorkingDays;
    private int missingDays;
    private double avgHoursPerDay;
    private List<LocalDate> missingDates;

    public TimesheetSummaryDTO(int userId, String username, double totalHours,
                               int daysFilled, int totalWorkingDays,
                               int missingDays, double avgHoursPerDay,
                               List<LocalDate> missingDates) {
        this.userId = userId;
        this.username = username;
        this.totalHours = totalHours;
        this.daysFilled = daysFilled;
        this.totalWorkingDays = totalWorkingDays;
        this.missingDays = missingDays;
        this.avgHoursPerDay = avgHoursPerDay;
        this.missingDates = missingDates;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public int getDaysFilled() {
        return daysFilled;
    }

    public void setDaysFilled(int daysFilled) {
        this.daysFilled = daysFilled;
    }

    public int getTotalWorkingDays() {
        return totalWorkingDays;
    }

    public void setTotalWorkingDays(int totalWorkingDays) {
        this.totalWorkingDays = totalWorkingDays;
    }

    public int getMissingDays() {
        return missingDays;
    }

    public void setMissingDays(int missingDays) {
        this.missingDays = missingDays;
    }

    public double getAvgHoursPerDay() {
        return avgHoursPerDay;
    }

    public void setAvgHoursPerDay(double avgHoursPerDay) {
        this.avgHoursPerDay = avgHoursPerDay;
    }

    public List<LocalDate> getMissingDates() {
        return missingDates;
    }

    public void setMissingDates(List<LocalDate> missingDates) {
        this.missingDates = missingDates;
    }
}