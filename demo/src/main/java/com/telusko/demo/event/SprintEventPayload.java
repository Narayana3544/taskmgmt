package com.telusko.demo.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Event payload for sprint-related events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintEventPayload {
    private Integer sprintId;
    private String sprintName;
    private Integer featureId;
    private String featureName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String oldStatus;
    private String newStatus;
    private Integer totalPoints;
    private Integer completedPoints;
    private Integer taskCount;
}
