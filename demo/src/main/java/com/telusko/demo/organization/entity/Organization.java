package com.telusko.demo.organization.entity;

import com.telusko.demo.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Root organization entity. All data is scoped to an organization
 * to support multi-tenancy in future.
 */
@Entity
@Table(name = "organization")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(length = 50)
    private String timezone;

    @Column(name = "working_days", length = 20)
    private String workingDays;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
