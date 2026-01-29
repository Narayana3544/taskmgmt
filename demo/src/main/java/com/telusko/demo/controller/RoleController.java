package com.telusko.demo.controller;

import com.telusko.demo.dto.rbac.*;
import com.telusko.demo.service.RolePermissionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Role and Permission management.
 * Admin-only endpoints for dynamic RBAC configuration.
 */
@RestController
@RequestMapping("/api/admin/rbac")
public class RoleController {
    
    private static final Logger logger = LoggerFactory.getLogger(RoleController.class);
    
    private final RolePermissionService rolePermissionService;
    
    public RoleController(RolePermissionService rolePermissionService) {
        this.rolePermissionService = rolePermissionService;
    }
    
    // ==================== ROLE ENDPOINTS ====================
    
    /**
     * Get all roles
     */
    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('MANAGE_ROLES') or hasAuthority('VIEW_ROLES')")
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        logger.info("Fetching all roles");
        List<RoleDTO> roles = rolePermissionService.getAllRoles();
        return ResponseEntity.ok(roles);
    }
    
    /**
     * Get role by ID
     */
    @GetMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('MANAGE_ROLES') or hasAuthority('VIEW_ROLES')")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable int id) {
        logger.info("Fetching role with ID: {}", id);
        RoleDTO role = rolePermissionService.getRoleById(id);
        return ResponseEntity.ok(role);
    }
    
    /**
     * Create a new role
     */
    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<RoleDTO> createRole(@Valid @RequestBody CreateRoleRequest request) {
        logger.info("Creating new role: {}", request.getName());
        RoleDTO role = rolePermissionService.createRole(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }
    
    /**
     * Update role
     */
    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<RoleDTO> updateRole(
            @PathVariable int id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        logger.info("Updating role with ID: {}", id);
        RoleDTO role = rolePermissionService.updateRole(id, request);
        return ResponseEntity.ok(role);
    }
    
    /**
     * Delete role
     */
    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<Map<String, String>> deleteRole(@PathVariable int id) {
        logger.info("Deleting role with ID: {}", id);
        rolePermissionService.deleteRole(id);
        return ResponseEntity.ok(Map.of("message", "Role deleted successfully"));
    }
    
    /**
     * Add permission to role
     */
    @PostMapping("/roles/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<RoleDTO> addPermissionToRole(
            @PathVariable int roleId,
            @PathVariable Long permissionId
    ) {
        logger.info("Adding permission {} to role {}", permissionId, roleId);
        RoleDTO role = rolePermissionService.addPermissionToRole(roleId, permissionId);
        return ResponseEntity.ok(role);
    }
    
    /**
     * Remove permission from role
     */
    @DeleteMapping("/roles/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<RoleDTO> removePermissionFromRole(
            @PathVariable int roleId,
            @PathVariable Long permissionId
    ) {
        logger.info("Removing permission {} from role {}", permissionId, roleId);
        RoleDTO role = rolePermissionService.removePermissionFromRole(roleId, permissionId);
        return ResponseEntity.ok(role);
    }
    
    // ==================== PERMISSION ENDPOINTS ====================
    
    /**
     * Get all permissions
     */
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('MANAGE_ROLES') or hasAuthority('VIEW_ROLES')")
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        logger.info("Fetching all permissions");
        List<PermissionDTO> permissions = rolePermissionService.getAllPermissions();
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * Get permissions by category
     */
    @GetMapping("/permissions/category/{category}")
    @PreAuthorize("hasAuthority('MANAGE_ROLES') or hasAuthority('VIEW_ROLES')")
    public ResponseEntity<List<PermissionDTO>> getPermissionsByCategory(@PathVariable String category) {
        logger.info("Fetching permissions for category: {}", category);
        List<PermissionDTO> permissions = rolePermissionService.getPermissionsByCategory(category);
        return ResponseEntity.ok(permissions);
    }
    
    /**
     * Get all permission categories
     */
    @GetMapping("/permissions/categories")
    @PreAuthorize("hasAuthority('MANAGE_ROLES') or hasAuthority('VIEW_ROLES')")
    public ResponseEntity<List<String>> getPermissionCategories() {
        logger.info("Fetching permission categories");
        List<String> categories = rolePermissionService.getPermissionCategories();
        return ResponseEntity.ok(categories);
    }
    
    /**
     * Create a new permission
     */
    @PostMapping("/permissions")
    @PreAuthorize("hasAuthority('MANAGE_ROLES')")
    public ResponseEntity<PermissionDTO> createPermission(@Valid @RequestBody CreatePermissionRequest request) {
        logger.info("Creating new permission: {}", request.getName());
        PermissionDTO permission = rolePermissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(permission);
    }
}
