package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing types of leave available in the organization.
 * Defines allocation, carryover, and other policies per leave type.
 */
@Entity
@Table(name = "leave_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;  // e.g., "Annual Leave", "Sick Leave", "Maternity Leave"
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "default_days", nullable = false)
    private Integer defaultDays;  // Default allocation per year
    
    @Column(name = "max_carryover")
    private Integer maxCarryover;  // Maximum days that can be carried to next year
    
    @Column(name = "requires_approval")
    private boolean requiresApproval = true;
    
    @Column(name = "requires_document")
    private boolean requiresDocument = false;  // e.g., medical certificate for sick leave
    
    @Column(name = "min_days_advance")
    private Integer minDaysAdvance = 0;  // Minimum days in advance to apply
    
    @Column(name = "max_consecutive_days")
    private Integer maxConsecutiveDays;  // Maximum consecutive days allowed
    
    @Column(name = "is_paid")
    private boolean paid = true;
    
    @Column(name = "is_active")
    private boolean active = true;
    
    @Column(name = "color_code", length = 10)
    private String colorCode;  // For calendar display, e.g., "#4CAF50"
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
