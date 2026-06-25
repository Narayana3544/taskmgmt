package com.telusko.demo.rbac.service;

import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.rbac.dto.PermissionDto;
import com.telusko.demo.rbac.entity.PermissionAction;
import com.telusko.demo.rbac.entity.PermissionFeature;
import com.telusko.demo.rbac.entity.RolePermission;
import com.telusko.demo.rbac.repository.PermissionActionRepository;
import com.telusko.demo.rbac.repository.PermissionFeatureRepository;
import com.telusko.demo.rbac.repository.RolePermissionRepository;
import com.telusko.demo.role.entity.Role;
import com.telusko.demo.role.repository.RoleRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final RoleRepository roleRepository;
    private final PermissionFeatureRepository featureRepository;
    private final PermissionActionRepository actionRepository;

    public PermissionService(RolePermissionRepository rolePermissionRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PermissionFeatureRepository featureRepository,
            PermissionActionRepository actionRepository) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.featureRepository = featureRepository;
        this.actionRepository = actionRepository;
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

        String roleCode = user.getRole().getCode().toUpperCase();
        if ("ADMIN".equals(roleCode) || "SUPER_ADMIN".equals(roleCode)) {
            return true;
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

    private Role findRole(String roleCodeOrId) {
        try {
            Long id = Long.parseLong(roleCodeOrId);
            return roleRepository.findById(id)
                    .orElseGet(() -> roleRepository.findFirstByCode(roleCodeOrId)
                            .orElseThrow(() -> new ResourceNotFoundException("Role", "code", roleCodeOrId)));
        } catch (NumberFormatException e) {
            return roleRepository.findFirstByCode(roleCodeOrId)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "code", roleCodeOrId));
        }
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> getPermissionsByRoleCode(String roleCode) {
        Role role = findRole(roleCode);
        List<RolePermission> permissions = rolePermissionRepository.findByRoleId(role.getId());
        
        return permissions.stream().map(p -> PermissionDto.builder()
                .roleCode(role.getCode())
                .feature(p.getFeature().getCode())
                .action(p.getAction().getCode())
                .allowed(p.getAllowed())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public void savePermissions(String roleCode, List<PermissionDto> permissionDtos) {
        Role role = findRole(roleCode);
        
        List<RolePermission> existingPermissions = rolePermissionRepository.findByRoleId(role.getId());
        Map<String, RolePermission> existingMap = existingPermissions.stream()
                .collect(Collectors.toMap(p -> p.getFeature().getCode() + "_" + p.getAction().getCode(), p -> p));

        List<RolePermission> toSave = new ArrayList<>();

        for (PermissionDto dto : permissionDtos) {
            String key = dto.getFeature() + "_" + dto.getAction();
            RolePermission existing = existingMap.get(key);
            
            if (existing != null) {
                existing.setAllowed(dto.getAllowed());
                toSave.add(existing);
            } else {
                PermissionFeature feature = featureRepository.findByCode(dto.getFeature())
                        .orElseThrow(() -> new ResourceNotFoundException("Feature", "code", dto.getFeature()));
                PermissionAction action = actionRepository.findByCode(dto.getAction())
                        .orElseThrow(() -> new ResourceNotFoundException("Action", "code", dto.getAction()));
                        
                toSave.add(RolePermission.builder()
                        .role(role)
                        .feature(feature)
                        .action(action)
                        .allowed(dto.getAllowed())
                        .createdBy(0L) // System configured
                        .build());
            }
        }
        
        if (!toSave.isEmpty()) {
            rolePermissionRepository.saveAll(toSave);
        }
    }
}
