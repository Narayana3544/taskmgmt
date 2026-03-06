package com.telusko.demo.notification.entity;

import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

/**
 * Per-user notification preferences.
 * Controls which event types trigger notifications for each user.
 */
@Entity
@Table(name = "notification_preference", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "event_type_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_type_id", nullable = false)
    private MasterValue eventType;

    @Column(nullable = false)
    private Boolean enabled;
}
