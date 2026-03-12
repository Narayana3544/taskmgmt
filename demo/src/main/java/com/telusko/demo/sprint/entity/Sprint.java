package com.telusko.demo.sprint.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Sprint entity representing a time-boxed iteration within a project.
 * Status is driven by MasterValue (SPRINT_STATUS type).
 */
@Entity
@Table(name = "sprint")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sprint extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String goal;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private MasterValue status;

    @Column(name = "auto_close")
    @Builder.Default
    private Boolean autoClose = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
