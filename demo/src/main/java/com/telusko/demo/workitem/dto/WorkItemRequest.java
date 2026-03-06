package com.telusko.demo.workitem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkItemRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    private String description;
    private Long typeId;
    private Long statusId;
    private Long priorityId;
    private Long ownerId;
    private Long assigneeId;
    private Integer storyPoints;
    private LocalDate dueDate;
}
