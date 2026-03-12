package com.telusko.demo.leave.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LeaveApprovalRequest {
    private String comment;
}
