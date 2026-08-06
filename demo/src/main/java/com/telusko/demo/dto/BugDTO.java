package com.telusko.demo.dto;

import java.util.List;

public record BugDTO(
        Integer id,
        String title,
        String description,
        String status,
        String reporter,
        String assignee,
        String priority,
        List<AttachmentDTO> attachments,
        String projectName,
        String featureName,
        String sprintName,
        Integer taskId,
        String taskTitle,
        Integer statusId,
        Integer assigneeId,
        Integer priorityId
) {}