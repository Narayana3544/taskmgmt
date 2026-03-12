package com.telusko.demo.sprint.dto;

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
public class SprintResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String name;
    private String goal;
    private Long statusId;
    private String statusName;
    private String statusCode;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalItems;
    private Integer doneItems;
    private LocalDateTime createdAt;
}
