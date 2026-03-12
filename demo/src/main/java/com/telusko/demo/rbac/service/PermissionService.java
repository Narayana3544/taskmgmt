package com.telusko.demo.rbac.service;

import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.rbac.repository.RolePermissionRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Centralized RBAC permission checker.
 * Nothing is hardcoded — all permission checks go through the role_permission
 * table.
 * Backend ALWAYS enforces; frontend never decides.
 */
@Service
public class PermissionService {

    private static final Logger log = LoggerFactory.getLogger(PermissionService.class);

    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;

    public PermissionService(RolePermissionRepository rolePermissionRepository,
            UserRepository userRepository) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Check if a user has permission for a specific feature + action.
     * Returns true if allowed, false otherwise.
     */
    public boolean hasPermission(Long userId, String featureCode, String actionCode) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() == null) {
            log.warn("User {} has no role assigned", userId);
            return false;
        }

        boolean allowed = !rolePermissionRepository
                .findAllowedPermission(user.getRole().getId(), featureCode, actionCode)
                .isEmpty();

        log.debug("Permission check: userId={}, feature={}, action={}, allowed={}",
                userId, featureCode, actionCode, allowed);
        return allowed;
    }

    /**
     * Check permission and throw AccessDeniedException if denied.
     * Use this in service methods before any mutating operation.
     */
    public void requirePermission(Long userId, String featureCode, String actionCode) {
        if (!hasPermission(userId, featureCode, actionCode)) {
            log.error("Permission denied: userId={}, feature={}, action={}",
                    userId, featureCode, actionCode);
            throw new AccessDeniedException(
                    "You do not have permission to " + actionCode + " on " + featureCode);
        }
    }
}
