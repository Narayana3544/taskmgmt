package com.telusko.demo.sprint.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintDashboardResponse {
    // Sprint info
    private Long sprintId;
    private String sprintName;
    private String sprintGoal;
    private String statusCode;
    private String statusName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String projectName;

    // Totals
    private int totalItems;
    private int completedItems;
    private int inProgressItems;
    private int openItems;
    private int backlogItems;
    private int totalStoryPoints;
    private int completedStoryPoints;
    private double completionPercentage;

    // Burndown chart data (day-by-day)
    private List<BurndownPoint> burndownData;

    // User performance
    private List<UserPerformance> userPerformance;

    // Status distribution
    private List<StatusDistribution> statusDistribution;

    // All work items in the sprint
    private List<SprintWorkItemSummary> workItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BurndownPoint {
        private String date;
        private int ideal;
        private int actual;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserPerformance {
        private Long userId;
        private String userName;
        private int totalTasks;
        private int completedTasks;
        private int inProgressTasks;
        private int totalStoryPoints;
        private int completedStoryPoints;
        private double completionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusDistribution {
        private String statusCode;
        private String statusName;
        private int count;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintWorkItemSummary {
        private Long id;
        private String title;
        private String statusCode;
        private String statusName;
        private String typeCode;
        private String typeName;
        private String priorityCode;
        private String priorityName;
        private String assigneeName;
        private Long assigneeId;
        private Integer storyPoints;
        private String projectCode;
    }
}
