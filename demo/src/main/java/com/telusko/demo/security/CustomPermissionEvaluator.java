package com.telusko.demo.security;

import com.telusko.demo.Model.Permission;
import com.telusko.demo.Model.Role;
import com.telusko.demo.Model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Set;

/**
 * Custom Permission Evaluator for dynamic RBAC.
 * Used with @PreAuthorize("hasPermission(#resource, 'PERMISSION_NAME')")
 */
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomPermissionEvaluator.class);
    
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !(permission instanceof String)) {
            return false;
        }
        
        String permissionName = (String) permission;
        return hasAuthority(authentication, permissionName);
    }
    
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !(permission instanceof String)) {
            return false;
        }
        
        String permissionName = (String) permission;
        return hasAuthority(authentication, permissionName);
    }
    
    /**
     * Check if the authenticated user has the specified permission.
     * First checks Spring Security authorities, then falls back to role's permissions.
     */
    private boolean hasAuthority(Authentication authentication, String permissionName) {
        // Check if permission exists in authorities (from JWT)
        boolean hasAuthority = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(permissionName));
        
        if (hasAuthority) {
            logger.debug("Permission '{}' found in JWT authorities", permissionName);
            return true;
        }
        
        // Fallback: Check user's role permissions from database
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            Role role = user.getRole();
            if (role != null) {
                Set<Permission> permissions = role.getPermissions();
                boolean hasPermission = permissions.stream()
                        .anyMatch(p -> p.getName().equals(permissionName) && p.isActive());
                
                if (hasPermission) {
                    logger.debug("Permission '{}' found in role '{}'", permissionName, role.getName());
                    return true;
                }
            }
        }
        
        logger.debug("Permission '{}' denied for user", permissionName);
        return false;
    }
}
