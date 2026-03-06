package com.telusko.demo.sprint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class SprintRequest {
    @NotBlank(message = "Sprint name is required")
    private String name;

    @NotBlank(message = "Sprint goal is mandatory")
    private String goal;

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private LocalDate startDate;
    private LocalDate endDate;
}
