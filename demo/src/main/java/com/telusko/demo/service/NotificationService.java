package com.telusko.demo.service;

import com.telusko.demo.Model.Notification;
import com.telusko.demo.Model.User;
import com.telusko.demo.dto.notification.NotificationDTO;
import com.telusko.demo.exception.ResourceNotFoundException;
import com.telusko.demo.repo.NotificationRepository;
import com.telusko.demo.repo.userrepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for notification management.
 */
@Service
@Transactional
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    private final NotificationRepository notificationRepository;
    private final userrepo userRepo;
    
    public NotificationService(
            NotificationRepository notificationRepository,
            userrepo userRepo
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepo = userRepo;
    }
    
    /**
     * Get notifications for a user with pagination
     */
    public Page<NotificationDTO> getNotifications(int userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);
        return notifications.map(this::toDTO);
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<NotificationDTO> getUnreadNotifications(int userId) {
        User user = userRepo.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get unread count for a user
     */
    public long getUnreadCount(int userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
    
    /**
     * Mark a notification as read
     */
    public NotificationDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        
        notification.markAsRead();
        Notification saved = notificationRepository.save(notification);
        
        return toDTO(saved);
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(int userId) {
        User user = userRepo.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        int count = notificationRepository.markAllAsRead(user, LocalDateTime.now());
        logger.info("Marked {} notifications as read for user {}", count, userId);
    }
    
    /**
     * Create a notification
     */
    public NotificationDTO createNotification(
            int userId,
            Notification.NotificationType type,
            String title,
            String message,
            String entityType,
            Long entityId,
            String actionUrl
    ) {
        User user = userRepo.findById(userId);
        if (user == null) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .actionUrl(actionUrl)
                .read(false)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        logger.info("Created notification for user {}: {}", userId, title);
        
        return toDTO(saved);
    }
    
    /**
     * Send notification to multiple users
     */
    public void notifyUsers(
            List<Integer> userIds,
            Notification.NotificationType type,
            String title,
            String message,
            String entityType,
            Long entityId,
            String actionUrl
    ) {
        for (Integer userId : userIds) {
            try {
                createNotification(userId, type, title, message, entityType, entityId, actionUrl);
            } catch (Exception e) {
                logger.error("Failed to create notification for user {}: {}", userId, e.getMessage());
            }
        }
    }
    
    /**
     * Delete a notification
     */
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    /**
     * Clean up old notifications (older than 30 days)
     */
    public int cleanupOldNotifications() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        int count = notificationRepository.deleteOldNotifications(cutoffDate);
        logger.info("Deleted {} old notifications", count);
        return count;
    }
    
    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .actionUrl(notification.getActionUrl())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
