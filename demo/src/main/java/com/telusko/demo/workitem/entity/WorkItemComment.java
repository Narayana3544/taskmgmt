package com.telusko.demo.workitem.entity;

import com.telusko.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Comment on a work item. Supports both user comments
 * and system-generated audit comments.
 */
@Entity
@Table(name = "work_item_comment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkItemComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_item_id", nullable = false)
    private WorkItem workItem;

    @Column(name = "comment_text", columnDefinition = "TEXT", nullable = false)
    private String commentText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commented_by", nullable = false)
    private User commentedBy;

    @Column(name = "commented_at", nullable = false)
    @Builder.Default
    private LocalDateTime commentedAt = LocalDateTime.now();

    @Column(name = "is_system_generated", nullable = false)
    @Builder.Default
    private Boolean isSystemGenerated = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
