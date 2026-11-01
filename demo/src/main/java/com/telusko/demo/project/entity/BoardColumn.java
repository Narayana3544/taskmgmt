package com.telusko.demo.project.entity;

import com.telusko.demo.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Dynamic, per-project Kanban board column entity.
 */
@Entity
@Table(name = "board_column", indexes = {
        @Index(name = "idx_bc_project", columnList = "project_id"),
        @Index(name = "idx_bc_position", columnList = "project_id, position")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardColumn extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer position;

    /**
     * Category: TODO, IN_PROGRESS, or DONE
     */
    @Column(name = "status_category", nullable = false, length = 30)
    private String statusCategory;

    @Column(name = "wip_limit")
    private Integer wipLimit;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}

