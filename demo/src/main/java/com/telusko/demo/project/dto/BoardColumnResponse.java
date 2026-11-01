package com.telusko.demo.project.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardColumnResponse {

    private Long id;
    private Long projectId;
    private String name;
    private Integer position;
    private String statusCategory;
    private Integer wipLimit;
    private Boolean isDefault;
    private Boolean active;
    private Long itemCount;
}

