package com.telusko.demo.holiday.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class HolidayRequest {
    @NotNull(message = "Organization ID is required")
    private Long orgId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotBlank(message = "Type is required")
    private String type; // PUBLIC, RESTRICTED, COMPANY_SPECIFIC

    private String description;
    
    // Optional flag sent by UI during updates
    private Boolean active;
}
