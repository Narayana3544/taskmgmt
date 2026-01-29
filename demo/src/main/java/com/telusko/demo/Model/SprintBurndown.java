package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity for storing daily sprint burndown data.
 * Used for burndown charts and velocity analytics.
 */
@Entity
@Table(name = "sprint_burndown", indexes = {
    @Index(name = "idx_burndown_sprint", columnList = "sprint_id"),
    @Index(name = "idx_burndown_date", columnList = "date")
}, uniqueConstraints = {
    @UniqueConstraint(columnNames = {"sprint_id", "date"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintBurndown {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id", nullable = false)
    private createsprint sprint;
    
    @Column(nullable = false)
    private LocalDate date;
    
    // Story Points
    @Column(name = "total_points")
    private Integer totalPoints;  // Total story points in sprint
    
    @Column(name = "completed_points")
    private Integer completedPoints;  // Points completed up to this date
    
    @Column(name = "remaining_points")
    private Integer remainingPoints;  // Points remaining
    
    @Column(name = "ideal_remaining")
    private Double idealRemaining;  // Ideal burndown line value
    
    // Task Counts
    @Column(name = "total_tasks")
    private Integer totalTasks;
    
    @Column(name = "completed_tasks")
    private Integer completedTasks;
    
    @Column(name = "in_progress_tasks")
    private Integer inProgressTasks;
    
    // Bug Counts (separate tracking)
    @Column(name = "total_bugs")
    private Integer totalBugs;
    
    @Column(name = "resolved_bugs")
    private Integer resolvedBugs;
    
    // Velocity metrics
    @Column(name = "daily_velocity")
    private Double dailyVelocity;  // Points completed on this day
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
