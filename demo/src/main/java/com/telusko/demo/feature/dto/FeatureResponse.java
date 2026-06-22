package com.telusko.demo.feature.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureResponse {
    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private String projectName;
    private Long statusId;
    private String statusName;
    private String statusCode;
    private Integer sprintCount;
    private Boolean active;
    private LocalDateTime createdAt;
    private Long createdBy;
}
