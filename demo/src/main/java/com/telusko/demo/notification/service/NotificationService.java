package com.telusko.demo.notification.service;

import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.notification.entity.Notification;
import com.telusko.demo.notification.repository.NotificationRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Service for managing in-app notifications.
 * Replaces the Kafka-based notification system with database-backed
 * notifications.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /** Create a new notification for a user. */
    @Transactional
    public void createNotification(Long recipientUserId, String entityType, Long entityId,
            String title, String message, Long createdBy) {
        log.debug("Creating notification for user: {} - {}", recipientUserId, title);

        User recipient = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", recipientUserId));

        Notification notification = Notification.builder()
                .user(recipient)
                .entityType(entityType)
                .entityId(entityId)
                .title(title)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();

        notificationRepository.save(notification);
        log.info("Notification created for user: {}", recipientUserId);
    }

    /** Get paginated notifications for a user. */
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> getNotifications(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        var content = page.getContent().stream().map(n -> Map.<String, Object>of(
                "id", n.getId(),
                "entityType", n.getEntityType(),
                "entityId", n.getEntityId(),
                "title", n.getTitle(),
                "message", n.getMessage(),
                "isRead", n.getIsRead(),
                "createdAt", n.getCreatedAt().toString())).toList();

        return PageResponse.<Map<String, Object>>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /** Get unread notification count. */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /** Mark a single notification as read. */
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }
}
