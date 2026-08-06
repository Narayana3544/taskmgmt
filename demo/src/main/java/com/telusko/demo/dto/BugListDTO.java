package com.telusko.demo.dto;

import java.time.LocalDateTime;

public record BugListDTO(
        Integer id,
        String title,
        String description,
        String projectName,
        String featureName,
        String sprintName,
        String status,
        Integer statusId,
        String priority,
        Integer priorityId,
        String assignedUser,
        Integer assignedUserId,
        String reporter,
        LocalDateTime createdAt
) {}
