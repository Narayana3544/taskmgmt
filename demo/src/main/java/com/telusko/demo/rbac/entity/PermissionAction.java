package com.telusko.demo.rbac.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Defines an action that can be performed on features.
 * Examples: VIEW, CREATE, UPDATE, DELETE, ASSIGN, APPROVE, CONFIGURE.
 */
@Entity
@Table(name = "permission_action")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
