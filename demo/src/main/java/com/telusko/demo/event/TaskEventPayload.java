package com.telusko.demo.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event payload for task-related events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEventPayload {
    private Integer taskId;
    private String title;
    private String description;
    private Integer sprintId;
    private String sprintName;
    private Integer projectId;
    private String projectName;
    private Integer assigneeId;
    private String assigneeEmail;
    private String oldStatus;
    private String newStatus;
    private Integer storyPoints;
    private String priority;
    private String taskType;
}
