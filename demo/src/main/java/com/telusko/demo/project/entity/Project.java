package com.telusko.demo.project.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Project entity representing a managed project within an organization.
 * Status is driven by MasterValue (PROJECT_STATUS type).
 */
@Entity
@Table(name = "project")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private MasterValue status;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "kanban_columns", columnDefinition = "TEXT")
    private String kanbanColumns;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
