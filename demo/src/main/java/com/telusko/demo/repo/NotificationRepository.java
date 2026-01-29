package com.telusko.demo.repo;

import com.telusko.demo.Model.Notification;
import com.telusko.demo.Model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Notification entity.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all notifications for a user ordered by created date
     */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    /**
     * Find unread notifications for a user
     */
    List<Notification> findByUserAndReadFalseOrderByCreatedAtDesc(User user);
    
    /**
     * Count unread notifications
     */
    long countByUserAndReadFalse(User user);
    
    /**
     * Find notifications by user ID
     */
    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    Page<Notification> findByUserId(@Param("userId") int userId, Pageable pageable);
    
    /**
     * Count unread by user ID
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.read = false")
    long countUnreadByUserId(@Param("userId") int userId);
    
    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readAt = :now WHERE n.user = :user AND n.read = false")
    int markAllAsRead(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * Delete old notifications (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Find notifications by entity type and ID
     */
    List<Notification> findByEntityTypeAndEntityId(String entityType, Long entityId);
}
