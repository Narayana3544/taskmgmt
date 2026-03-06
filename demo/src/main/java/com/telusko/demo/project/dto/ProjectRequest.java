package com.telusko.demo.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectRequest {
    @NotBlank(message = "Project code is required")
    @Size(max = 50)
    private String code;

    @NotBlank(message = "Project name is required")
    @Size(max = 150)
    private String name;

    private String description;
    private Long statusId;
    private LocalDate startDate;
    private LocalDate endDate;
}
