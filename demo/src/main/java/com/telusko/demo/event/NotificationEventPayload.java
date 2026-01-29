package com.telusko.demo.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event payload for notification-related events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEventPayload {
    private Long notificationId;
    private Integer targetUserId;
    private String targetUserEmail;
    private String notificationType;
    private String title;
    private String message;
    private String entityType;
    private Long entityId;
    private String actionUrl;
}
