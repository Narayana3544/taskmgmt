package com.telusko.demo.feature.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeatureRequest {
    @NotBlank(message = "Feature name is required")
    private String name;

    private String description;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long statusId;
}
