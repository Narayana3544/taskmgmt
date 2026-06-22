package com.telusko.demo.feature.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

/**
 * Feature entity representing a functional grouping within a project.
 * Hierarchy: Project → Feature → Sprint → WorkItem.
 * Status is driven by MasterValue (FEATURE_STATUS type).
 */
@Entity
@Table(name = "feature", indexes = {
        @Index(name = "idx_feature_project", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feature extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id")
    private MasterValue status;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
