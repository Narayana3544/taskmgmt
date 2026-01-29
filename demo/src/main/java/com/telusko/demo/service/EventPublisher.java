package com.telusko.demo.service;

import com.telusko.demo.config.KafkaConfig;
import com.telusko.demo.event.DomainEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service for publishing domain events to Kafka.
 */
@Service
public class EventPublisher {
    
    private static final Logger logger = LoggerFactory.getLogger(EventPublisher.class);
    
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public EventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
    
    /**
     * Publish a task event
     */
    public void publishTaskEvent(String action, Integer taskId, Integer userId, String userEmail, Object payload) {
        DomainEvent event = buildEvent("TASK", action, taskId.longValue(), userId, userEmail, payload);
        publish(KafkaConfig.TOPIC_TASK_EVENTS, String.valueOf(taskId), event);
    }
    
    /**
     * Publish a sprint event
     */
    public void publishSprintEvent(String action, Integer sprintId, Integer userId, String userEmail, Object payload) {
        DomainEvent event = buildEvent("SPRINT", action, sprintId.longValue(), userId, userEmail, payload);
        publish(KafkaConfig.TOPIC_SPRINT_EVENTS, String.valueOf(sprintId), event);
    }
    
    /**
     * Publish a bug event
     */
    public void publishBugEvent(String action, Integer bugId, Integer userId, String userEmail, Object payload) {
        DomainEvent event = buildEvent("BUG", action, bugId.longValue(), userId, userEmail, payload);
        publish(KafkaConfig.TOPIC_BUG_EVENTS, String.valueOf(bugId), event);
    }
    
    /**
     * Publish a leave event
     */
    public void publishLeaveEvent(String action, Integer leaveRequestId, Integer userId, String userEmail, Object payload) {
        DomainEvent event = buildEvent("LEAVE", action, leaveRequestId.longValue(), userId, userEmail, payload);
        publish(KafkaConfig.TOPIC_LEAVE_EVENTS, String.valueOf(leaveRequestId), event);
    }
    
    /**
     * Publish a timesheet event
     */
    public void publishTimesheetEvent(String action, Integer timesheetId, Integer userId, String userEmail, Object payload) {
        DomainEvent event = buildEvent("TIMESHEET", action, timesheetId.longValue(), userId, userEmail, payload);
        publish(KafkaConfig.TOPIC_TIMESHEET_EVENTS, String.valueOf(timesheetId), event);
    }
    
    /**
     * Publish a notification event
     */
    public void publishNotificationEvent(Long notificationId, Integer targetUserId, Object payload) {
        DomainEvent event = buildEvent("NOTIFICATION", "CREATED", notificationId, null, null, payload);
        publish(KafkaConfig.TOPIC_NOTIFICATION_EVENTS, String.valueOf(targetUserId), event);
    }
    
    private DomainEvent buildEvent(String entityType, String action, Long entityId, 
                                    Integer userId, String userEmail, Object payload) {
        return DomainEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(entityType + "_" + action)
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .userId(userId)
                .userEmail(userEmail)
                .timestamp(LocalDateTime.now())
                .payload(payload)
                .build();
    }
    
    private void publish(String topic, String key, DomainEvent event) {
        logger.info("Publishing event to topic {}: {}", topic, event.getEventType());
        
        CompletableFuture<SendResult<String, Object>> future = 
                kafkaTemplate.send(topic, key, event);
        
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                logger.debug("Event sent successfully to topic {}: partition={}, offset={}", 
                        topic, 
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                logger.error("Failed to send event to topic {}: {}", topic, ex.getMessage());
            }
        });
    }
}
