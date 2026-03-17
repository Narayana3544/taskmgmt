package com.telusko.demo.project.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Represents a user's membership in a project with a specific responsibility.
 * Supports project-level reporting manager assignment.
 */
@Entity
@Table(name = "project_member", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "project_id", "user_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMember extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsibility_id")
    private MasterValue responsibility;

    /** Alias for responsibility — used as project-level role */
    public MasterValue getProjectRole() {
        return this.responsibility;
    }

    public void setProjectRole(MasterValue role) {
        this.responsibility = role;
    }

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
