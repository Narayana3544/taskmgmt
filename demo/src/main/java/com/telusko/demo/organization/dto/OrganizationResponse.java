package com.telusko.demo.organization.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrganizationResponse {
    private Long id;
    private String name;
    private String code;
    private String timezone;
    private String workingDays;
    private String logoUrl;
    private Boolean active;
}
