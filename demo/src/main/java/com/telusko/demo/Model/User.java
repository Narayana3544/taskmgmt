package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * User entity representing employees in the organization.
 * Supports manager hierarchy, department structure, and enterprise profile management.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_department", columnList = "department"),
    @Index(name = "idx_user_manager", columnList = "reporting_manager_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    
    // Basic Information
    @Column(name = "first_name", nullable = false, length = 100)
    private String first_name;
    
    @Column(name = "last_name", nullable = false, length = 100)
    private String last_name;
    
    @Column(name = "preferred_name", length = 100)
    private String preffered_name;
    
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    // Role and Permissions
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
    
    // Current Sprint Assignment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;
    
    // Enterprise Profile Fields
    @Column(length = 100)
    private String department;
    
    @Column(length = 100)
    private String designation;
    
    @Column(name = "employment_type", length = 50)
    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType;
    
    @Column(name = "profile_picture_path", length = 500)
    private String profilePicturePath;
    
    @Column(name = "joining_date")
    private LocalDate joiningDate;
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    // Manager Hierarchy - Self-referencing relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporting_manager_id")
    private User reportingManager;
    
    // Status
    @Column(name = "is_active")
    private boolean is_active = true;
    
    // Audit Fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private Integer createdBy;
    
    @Column(name = "updated_by")
    private Integer updatedBy;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    // Employment Type Enum
    public enum EmploymentType {
        FULL_TIME,
        PART_TIME,
        CONTRACT,
        INTERN,
        CONSULTANT
    }
    
    // Preserve existing getter/setter names for backward compatibility
    public boolean isIs_active() {
        return is_active;
    }

    public void setIs_active(boolean is_active) {
        this.is_active = is_active;
    }

    public Sprint getSprint() {
        return sprint;
    }

    public void setSprint(Sprint sprint) {
        this.sprint = sprint;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPreffered_name() {
        return preffered_name;
    }

    public void setPreffered_name(String preffered_name) {
        this.preffered_name = preffered_name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
    /**
     * Get full name of the user
     */
    public String getFullName() {
        return first_name + " " + last_name;
    }
    
    /**
     * Get display name - preferred name if set, otherwise first name
     */
    public String getDisplayName() {
        return preffered_name != null && !preffered_name.isEmpty() 
                ? preffered_name 
                : first_name;
    }
}
