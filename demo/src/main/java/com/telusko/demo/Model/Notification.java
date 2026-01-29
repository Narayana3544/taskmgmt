package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for storing user notifications.
 * Supports real-time notifications via WebSocket and in-app bell icon.
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user", columnList = "user_id"),
    @Index(name = "idx_notification_read", columnList = "is_read"),
    @Index(name = "idx_notification_created", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private NotificationType type;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(length = 1000)
    private String message;
    
    @Column(name = "entity_type", length = 50)
    private String entityType;  // TASK, BUG, SPRINT, LEAVE, etc.
    
    @Column(name = "entity_id")
    private Long entityId;  // ID of the related entity
    
    @Column(name = "action_url", length = 500)
    private String actionUrl;  // URL to navigate to on click
    
    @Column(name = "is_read")
    private boolean read = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Notification types for categorization and icon display
     */
    public enum NotificationType {
        // Task notifications
        TASK_ASSIGNED,
        TASK_COMPLETED,
        TASK_COMMENT,
        TASK_STATUS_CHANGED,
        
        // Bug notifications
        BUG_REPORTED,
        BUG_ASSIGNED,
        BUG_FIXED,
        BUG_VERIFIED,
        
        // Sprint notifications
        SPRINT_STARTED,
        SPRINT_ENDING_SOON,
        SPRINT_COMPLETED,
        
        // Leave notifications
        LEAVE_APPLIED,
        LEAVE_APPROVED,
        LEAVE_REJECTED,
        
        // Timesheet notifications
        TIMESHEET_SUBMITTED,
        TIMESHEET_APPROVED,
        TIMESHEET_REJECTED,
        
        // System notifications
        SYSTEM_ANNOUNCEMENT,
        MENTION
    }
    
    /**
     * Mark notification as read
     */
    public void markAsRead() {
        this.read = true;
        this.readAt = LocalDateTime.now();
    }
}
