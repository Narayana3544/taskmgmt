package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Role entity for dynamic RBAC.
 * Roles are collections of permissions that can be assigned to users.
 * Admins can create/modify roles dynamically through the admin panel.
 */
@Entity
@Table(name = "roles", indexes = {
    @Index(name = "idx_role_name", columnList = "name", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String name;  // e.g., ADMIN, MANAGER, DEVELOPER
    
    @Column(length = 255)
    private String description;
    
    // Many-to-Many relationship with Permission
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();
    
    @Column(name = "is_system_role")
    private boolean systemRole = false;  // System roles cannot be deleted
    
    @Column(name = "is_active")
    private boolean active = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Preserve compatibility with existing getDescription method
    public String getDescription() {
        return description != null ? description : name;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Add permission to role
     */
    public void addPermission(Permission permission) {
        this.permissions.add(permission);
    }
    
    /**
     * Remove permission from role
     */
    public void removePermission(Permission permission) {
        this.permissions.remove(permission);
    }
    
    /**
     * Check if role has a specific permission
     */
    public boolean hasPermission(String permissionName) {
        return permissions.stream()
                .anyMatch(p -> p.getName().equals(permissionName));
    }
}
