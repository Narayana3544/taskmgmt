package com.telusko.demo.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardColumnRequest {

    @NotBlank(message = "Column name is required")
    @Size(max = 100, message = "Column name must not exceed 100 characters")
    private String name;

    private Integer position;

    @NotBlank(message = "Status category is required (TODO, IN_PROGRESS, DONE)")
    private String statusCategory;

    private Integer wipLimit;

    private Boolean isDefault;
}

