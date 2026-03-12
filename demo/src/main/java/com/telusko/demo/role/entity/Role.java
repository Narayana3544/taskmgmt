package com.telusko.demo.role.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;

/**
 * Role entity representing user roles within an organization.
 * Supports both system-defined (ADMIN, MANAGER) and custom roles.
 */
@Entity
@Table(name = "role")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "system_defined", nullable = false)
    @Builder.Default
    private Boolean systemDefined = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
