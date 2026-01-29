package com.telusko.demo.listener;

import com.telusko.demo.Model.Notification;
import com.telusko.demo.config.KafkaConfig;
import com.telusko.demo.event.DomainEvent;
import com.telusko.demo.event.NotificationEventPayload;
import com.telusko.demo.event.TaskEventPayload;
import com.telusko.demo.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Kafka event listeners for creating notifications based on domain events.
 */
@Component
public class NotificationEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);
    
    private final NotificationService notificationService;
    
    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    
    /**
     * Listen to task events and create notifications for assignees
     */
    @KafkaListener(
            topics = KafkaConfig.TOPIC_TASK_EVENTS,
            groupId = "notification-consumers",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleTaskEvent(@Payload DomainEvent event, Acknowledgment ack) {
        try {
            logger.info("Received task event: {} for entity {}", event.getAction(), event.getEntityId());
            
            if (event.getPayload() instanceof TaskEventPayload payload) {
                switch (event.getAction()) {
                    case "ASSIGNED" -> createTaskAssignedNotification(payload, event);
                    case "STATUS_CHANGED" -> createTaskStatusNotification(payload, event);
                    case "COMMENT_ADDED" -> createTaskCommentNotification(payload, event);
                }
            }
            
            ack.acknowledge();
        } catch (Exception e) {
            logger.error("Failed to process task event: {}", e.getMessage());
            // Don't acknowledge - will be redelivered
        }
    }
    
    /**
     * Listen to sprint events and create notifications for team members
     */
    @KafkaListener(
            topics = KafkaConfig.TOPIC_SPRINT_EVENTS,
            groupId = "notification-consumers",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleSprintEvent(@Payload DomainEvent event, Acknowledgment ack) {
        try {
            logger.info("Received sprint event: {} for entity {}", event.getAction(), event.getEntityId());
            
            switch (event.getAction()) {
                case "STARTED" -> logger.info("Sprint started: {}", event.getEntityId());
                case "COMPLETED" -> logger.info("Sprint completed: {}", event.getEntityId());
                case "ENDING_SOON" -> logger.info("Sprint ending soon: {}", event.getEntityId());
            }
            
            ack.acknowledge();
        } catch (Exception e) {
            logger.error("Failed to process sprint event: {}", e.getMessage());
        }
    }
    
    /**
     * Listen to notification events for real-time delivery
     */
    @KafkaListener(
            topics = KafkaConfig.TOPIC_NOTIFICATION_EVENTS,
            groupId = "realtime-notification-consumers",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleNotificationEvent(@Payload DomainEvent event, Acknowledgment ack) {
        try {
            logger.info("Received notification event for user: {}", event.getEntityId());
            
            // TODO: Send via WebSocket for real-time delivery
            if (event.getPayload() instanceof NotificationEventPayload payload) {
                logger.debug("Notification for user {}: {}", payload.getTargetUserId(), payload.getTitle());
            }
            
            ack.acknowledge();
        } catch (Exception e) {
            logger.error("Failed to process notification event: {}", e.getMessage());
        }
    }
    
    private void createTaskAssignedNotification(TaskEventPayload payload, DomainEvent event) {
        if (payload.getAssigneeId() != null) {
            notificationService.createNotification(
                    payload.getAssigneeId(),
                    Notification.NotificationType.TASK_ASSIGNED,
                    "Task Assigned",
                    String.format("You have been assigned to task: %s", payload.getTitle()),
                    "TASK",
                    payload.getTaskId().longValue(),
                    "/tasks/" + payload.getTaskId()
            );
        }
    }
    
    private void createTaskStatusNotification(TaskEventPayload payload, DomainEvent event) {
        if (payload.getAssigneeId() != null && event.getUserId() != null 
                && !event.getUserId().equals(payload.getAssigneeId())) {
            notificationService.createNotification(
                    payload.getAssigneeId(),
                    Notification.NotificationType.TASK_STATUS_CHANGED,
                    "Task Status Changed",
                    String.format("Task '%s' status changed from %s to %s", 
                            payload.getTitle(), payload.getOldStatus(), payload.getNewStatus()),
                    "TASK",
                    payload.getTaskId().longValue(),
                    "/tasks/" + payload.getTaskId()
            );
        }
    }
    
    private void createTaskCommentNotification(TaskEventPayload payload, DomainEvent event) {
        if (payload.getAssigneeId() != null && event.getUserId() != null 
                && !event.getUserId().equals(payload.getAssigneeId())) {
            notificationService.createNotification(
                    payload.getAssigneeId(),
                    Notification.NotificationType.MENTION,
                    "New Comment",
                    String.format("New comment on task: %s", payload.getTitle()),
                    "TASK",
                    payload.getTaskId().longValue(),
                    "/tasks/" + payload.getTaskId()
            );
        }
    }
}
