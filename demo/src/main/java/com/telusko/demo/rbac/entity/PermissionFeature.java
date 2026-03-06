package com.telusko.demo.rbac.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Defines a feature area that can be controlled by permissions.
 * Examples: WORK_ITEM, SPRINT, TIMESHEET, LEAVE, USER, MASTER_DATA, AUDIT.
 */
@Entity
@Table(name = "permission_feature")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(length = 150)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
