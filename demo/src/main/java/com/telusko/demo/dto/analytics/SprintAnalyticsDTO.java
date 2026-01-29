package com.telusko.demo.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sprint analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintAnalyticsDTO {
    
    private int sprintId;
    private String sprintName;
    
    // Points
    private int totalPoints;
    private int completedPoints;
    private int remainingPoints;
    private double completionPercentage;
    
    // Tasks
    private int totalTasks;
    private int completedTasks;
    
    // Velocity
    private double velocity;
    
    // Spillover (carried over from previous sprint)
    private int spilloverPoints;
    private double spilloverRate;
}
