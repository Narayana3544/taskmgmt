package com.telusko.demo.project.dto;

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
public class ProjectResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long statusId;
    private String statusName;
    private String statusCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer memberCount;
    private LocalDateTime createdAt;
}
