package com.telusko.demo.organization.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganizationRequest {
    @NotBlank(message = "Organization name is required")
    private String name;
    
    @NotBlank(message = "Code is required")
    private String code;
    
    private String timezone;
    private String workingDays;
    private String logoUrl;
}
