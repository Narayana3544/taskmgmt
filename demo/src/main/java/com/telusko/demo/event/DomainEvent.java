package com.telusko.demo.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Base class for all domain events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DomainEvent {
    private String eventId;
    private String eventType;
    private String entityType;
    private Long entityId;
    private String action; // CREATED, UPDATED, DELETED, STATUS_CHANGED, ASSIGNED
    private Integer userId; // Who triggered the event
    private String userEmail;
    private LocalDateTime timestamp;
    private Object payload; // Event-specific data
}
