package com.telusko.demo.sprint.dto;

import lombok.*;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloseSprintRequest {

    /**
     * Target sprint to move unfinished items to (must be PLANNED or ACTIVE).
     */
    private Long targetSprintId;

    /**
     * Default destination if not specified per item: "NEXT_SPRINT" or "BACKLOG".
     */
    private String defaultDestination;

    /**
     * Per-item destination: item ID -> "NEXT_SPRINT" or "BACKLOG"
     */
    private Map<Long, String> itemActions;
}

