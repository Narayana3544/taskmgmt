package com.telusko.demo.holiday.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class HolidayResponse {
    private Long id;
    private Long orgId;
    private String name;
    private LocalDate date;
    private String type;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
