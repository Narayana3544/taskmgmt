package com.telusko.demo.workitem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkItemResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String projectCode;
    private String title;
    private String description;

    // Type, Status, Priority — id + display name + code
    private Long typeId;
    private String typeName;
    private String typeCode;
    private Long statusId;
    private String statusName;
    private String statusCode;
    private Long priorityId;
    private String priorityName;
    private String priorityCode;

    // People
    private Long ownerId;
    private String ownerName;
    private Long assigneeId;
    private String assigneeName;
    private Long reportedById;
    private String reportedByName;

    private Integer storyPoints;
    private Long sprintId;
    private String sprintName;
    private LocalDate dueDate;
    private Boolean active;
    private LocalDateTime createdAt;
    private java.util.List<String> attachments;
}
