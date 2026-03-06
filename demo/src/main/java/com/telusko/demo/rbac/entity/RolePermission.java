package com.telusko.demo.rbac.entity;

import com.telusko.demo.role.entity.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Maps a role to specific feature+action combinations.
 * The 'allowed' flag enables fine-grained permission control.
 */
@Entity
@Table(name = "role_permission", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "role_id", "feature_id", "action_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", nullable = false)
    private PermissionFeature feature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_id", nullable = false)
    private PermissionAction action;

    @Column(nullable = false)
    private Boolean allowed;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by", nullable = false)
    private Long createdBy;
}
