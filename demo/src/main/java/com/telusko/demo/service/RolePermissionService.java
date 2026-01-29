package com.telusko.demo.service;

import com.telusko.demo.Model.Permission;
import com.telusko.demo.Model.Role;
import com.telusko.demo.dto.rbac.*;
import com.telusko.demo.exception.ResourceNotFoundException;
import com.telusko.demo.repo.PermissionRepository;
import com.telusko.demo.repo.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for Role and Permission management.
 * Enables dynamic RBAC without hardcoded role checks.
 */
@Service
@Transactional
public class RolePermissionService {
    
    private static final Logger logger = LoggerFactory.getLogger(RolePermissionService.class);
    
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    
    public RolePermissionService(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository
    ) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }
    
    // ==================== ROLE OPERATIONS ====================
    
    /**
     * Get all active roles
     */
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findByActiveTrue().stream()
                .map(this::toRoleDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get role by ID
     */
    public RoleDTO getRoleById(int id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return toRoleDTO(role);
    }
    
    /**
     * Create a new role
     */
    public RoleDTO createRole(CreateRoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Role with name '" + request.getName() + "' already exists");
        }
        
        Role role = Role.builder()
                .name(request.getName().toUpperCase())
                .description(request.getDescription())
                .systemRole(false)
                .active(true)
                .build();
        
        // Add permissions if specified
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            Set<Permission> permissions = request.getPermissionIds().stream()
                    .map(id -> permissionRepository.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id)))
                    .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }
        
        Role saved = roleRepository.save(role);
        logger.info("Created new role: {}", saved.getName());
        
        return toRoleDTO(saved);
    }
    
    /**
     * Update role
     */
    public RoleDTO updateRole(int id, UpdateRoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("Cannot modify system role: " + role.getName());
        }
        
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        
        if (request.getPermissionIds() != null) {
            Set<Permission> permissions = request.getPermissionIds().stream()
                    .map(permId -> permissionRepository.findById(permId)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", permId)))
                    .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }
        
        Role saved = roleRepository.save(role);
        logger.info("Updated role: {}", saved.getName());
        
        return toRoleDTO(saved);
    }
    
    /**
     * Delete role (soft delete)
     */
    public void deleteRole(int id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("Cannot delete system role: " + role.getName());
        }
        
        // Check if any users have this role
        long userCount = roleRepository.countUsersWithRole(id);
        if (userCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete role '" + role.getName() + "' - " + userCount + " users have this role assigned"
            );
        }
        
        role.setActive(false);
        roleRepository.save(role);
        logger.info("Deleted role: {}", role.getName());
    }
    
    /**
     * Add permission to role
     */
    public RoleDTO addPermissionToRole(int roleId, Long permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));
        
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", permissionId));
        
        role.addPermission(permission);
        Role saved = roleRepository.save(role);
        
        logger.info("Added permission '{}' to role '{}'", permission.getName(), role.getName());
        return toRoleDTO(saved);
    }
    
    /**
     * Remove permission from role
     */
    public RoleDTO removePermissionFromRole(int roleId, Long permissionId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", roleId));
        
        Permission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", permissionId));
        
        role.removePermission(permission);
        Role saved = roleRepository.save(role);
        
        logger.info("Removed permission '{}' from role '{}'", permission.getName(), role.getName());
        return toRoleDTO(saved);
    }
    
    // ==================== PERMISSION OPERATIONS ====================
    
    /**
     * Get all permissions
     */
    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findByActiveTrue().stream()
                .map(this::toPermissionDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get permissions by category
     */
    public List<PermissionDTO> getPermissionsByCategory(String category) {
        return permissionRepository.findByCategoryAndActiveTrue(category).stream()
                .map(this::toPermissionDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all permission categories
     */
    public List<String> getPermissionCategories() {
        return permissionRepository.findAllCategories();
    }
    
    /**
     * Create a new permission
     */
    public PermissionDTO createPermission(CreatePermissionRequest request) {
        if (permissionRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Permission with name '" + request.getName() + "' already exists");
        }
        
        Permission permission = Permission.builder()
                .name(request.getName().toUpperCase())
                .description(request.getDescription())
                .category(request.getCategory().toUpperCase())
                .active(true)
                .build();
        
        Permission saved = permissionRepository.save(permission);
        logger.info("Created new permission: {}", saved.getName());
        
        return toPermissionDTO(saved);
    }
    
    // ==================== DTO CONVERSIONS ====================
    
    private RoleDTO toRoleDTO(Role role) {
        return RoleDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .systemRole(role.isSystemRole())
                .permissions(role.getPermissions().stream()
                        .map(this::toPermissionDTO)
                        .collect(Collectors.toSet()))
                .build();
    }
    
    private PermissionDTO toPermissionDTO(Permission permission) {
        return PermissionDTO.builder()
                .id(permission.getId())
                .name(permission.getName())
                .description(permission.getDescription())
                .category(permission.getCategory())
                .build();
    }
}
