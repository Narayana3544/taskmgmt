package com.telusko.demo.sprint.entity;

import com.telusko.demo.user.entity.User;
import com.telusko.demo.workitem.entity.WorkItem;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Junction table linking work items to sprints.
 * Tracks when items are added/removed and removal reasons (manual vs
 * spillover).
 */
@Entity
@Table(name = "sprint_work_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintWorkItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id", nullable = false)
    private Sprint sprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_item_id", nullable = false)
    private WorkItem workItem;

    @Column(name = "added_at", nullable = false)
    @Builder.Default
    private LocalDateTime addedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by", nullable = false)
    private User addedBy;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "removed_by")
    private User removedBy;

    @Column(name = "removal_reason", length = 50)
    private String removalReason;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
