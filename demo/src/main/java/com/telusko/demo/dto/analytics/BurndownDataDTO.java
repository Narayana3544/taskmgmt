package com.telusko.demo.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for burndown chart data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BurndownDataDTO {
    
    private int sprintId;
    private String sprintName;
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalPoints;
    
    // Ideal burndown line (one value per day)
    private List<Double> idealBurndown;
    
    // Daily actual data
    private List<DailyData> dailyData;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyData {
        private LocalDate date;
        private Integer remainingPoints;
        private Integer completedPoints;
        private Double idealRemaining;
        private Double dailyVelocity;
    }
}
