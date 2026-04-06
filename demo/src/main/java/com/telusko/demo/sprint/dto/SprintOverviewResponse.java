package com.telusko.demo.sprint.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SprintOverviewResponse {
    private Long totalItems;
    private Long completedItems;
    private Long pendingItems;
    private Long blockedItems;
    private Long spilloverItems;
}
