package com.telusko.demo.feature.service;

import com.telusko.demo.audit.service.AuditService;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.feature.dto.FeatureRequest;
import com.telusko.demo.feature.dto.FeatureResponse;
import com.telusko.demo.feature.entity.Feature;
import com.telusko.demo.feature.repository.FeatureRepository;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.notification.service.NotificationService;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.entity.ProjectMember;
import com.telusko.demo.project.repository.ProjectMemberRepository;
import com.telusko.demo.project.repository.ProjectRepository;
import com.telusko.demo.rbac.service.PermissionService;
import com.telusko.demo.sprint.repository.SprintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Feature lifecycle management with RBAC, validation, audit, and notification.
 *
 * Rules:
 * - CLOSED project blocks feature creation
 * - Default status is PROPOSED on creation
 * - Status transitions are validated
 * - All changes are audit-logged
 * - Project members are notified on creation and status changes
 */
@Service
public class FeatureService {

    private static final Logger log = LoggerFactory.getLogger(FeatureService.class);

    private final FeatureRepository featureRepository;
    private final ProjectRepository projectRepository;
    private final MasterValueRepository masterValueRepository;
    private final PermissionService permissionService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final SprintRepository sprintRepository;
    private final ProjectMemberRepository memberRepository;

    public FeatureService(FeatureRepository featureRepository,
            ProjectRepository projectRepository,
            MasterValueRepository masterValueRepository,
            PermissionService permissionService,
            AuditService auditService,
            NotificationService notificationService,
            SprintRepository sprintRepository,
            ProjectMemberRepository memberRepository) {
        this.featureRepository = featureRepository;
        this.projectRepository = projectRepository;
        this.masterValueRepository = masterValueRepository;
        this.permissionService = permissionService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.sprintRepository = sprintRepository;
        this.memberRepository = memberRepository;
    }

    // ==================== CREATE ====================
    @Transactional
    public FeatureResponse createFeature(FeatureRequest request, Long userId) {
        permissionService.requirePermission(userId, "FEATURE", "CREATE");

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        // RULE: CLOSED project blocks feature creation
        if (project.getStatus() != null && "CLOSED".equals(project.getStatus().getCode())) {
            throw new BadRequestException("Cannot create features in a CLOSED project");
        }

        // RULE: Default status is PROPOSED
        MasterValue status;
        if (request.getStatusId() != null) {
            status = masterValueRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Status", "id", request.getStatusId()));
        } else {
            status = masterValueRepository
                    .findByMasterTypeCodeAndCode("FEATURE_STATUS", "PROPOSED")
                    .orElse(null);
        }

        Feature feature = Feature.builder()
                .name(request.getName())
                .description(request.getDescription())
                .project(project)
                .status(status)
                .active(true)
                .build();
        feature.setCreatedBy(userId);

        feature = featureRepository.save(feature);

        auditService.logAction("FEATURE", feature.getId(), "CREATED", null, feature.getName(), userId);

        // Notify project members about new feature
        notifyProjectMembers(project.getId(), userId,
                "New Feature Created",
                "Feature '" + feature.getName() + "' has been created in project '" + project.getName() + "'",
                "FEATURE", feature.getId());

        log.info("Feature created: id={}, project={}", feature.getId(), project.getCode());
        return mapToResponse(feature);
    }

    // ==================== UPDATE ====================
    @Transactional
    public FeatureResponse updateFeature(Long id, FeatureRequest request, Long userId) {
        permissionService.requirePermission(userId, "FEATURE", "UPDATE");

        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature", "id", id));

        feature.setName(request.getName());
        feature.setDescription(request.getDescription());
        feature.setUpdatedBy(userId);

        // Track status change
        if (request.getStatusId() != null) {
            MasterValue oldStatus = feature.getStatus();
            MasterValue newStatus = masterValueRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Status", "id", request.getStatusId()));

            if (oldStatus == null || !oldStatus.getId().equals(newStatus.getId())) {
                feature.setStatus(newStatus);
                String oldCode = oldStatus != null ? oldStatus.getCode() : "NONE";
                auditService.logAction("FEATURE", id, "STATUS_CHANGED", oldCode, newStatus.getCode(), userId);

                // Notify project members about status change
                notifyProjectMembers(feature.getProject().getId(), userId,
                        "Feature Status Updated",
                        "Feature '" + feature.getName() + "' status changed from " + oldCode + " to " + newStatus.getCode(),
                        "FEATURE", feature.getId());
            }
        }

        feature = featureRepository.save(feature);
        log.info("Feature updated: id={}", id);
        return mapToResponse(feature);
    }

    // ==================== READ ====================
    @Transactional(readOnly = true)
    public FeatureResponse getFeatureById(Long id, Long userId) {
        permissionService.requirePermission(userId, "FEATURE", "VIEW");

        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feature", "id", id));
        return mapToResponse(feature);
    }

    @Transactional(readOnly = true)
    public PageResponse<FeatureResponse> listFeaturesByProject(Long projectId, String search, Long statusId,
            Pageable pageable, Long userId) {
        permissionService.requirePermission(userId, "FEATURE", "VIEW");

        Page<Feature> page;
        boolean hasSearch = search != null && !search.trim().isEmpty();
        boolean hasStatus = statusId != null;

        if (hasSearch && hasStatus) {
            page = featureRepository.findByProjectIdAndStatusIdAndActiveTrueAndSearch(
                    projectId, statusId, search.trim(), pageable);
        } else if (hasStatus) {
            page = featureRepository.findByProjectIdAndStatusIdAndActiveTrue(projectId, statusId, pageable);
        } else if (hasSearch) {
            page = featureRepository.findByProjectIdAndActiveTrueAndSearch(projectId, search.trim(), pageable);
        } else {
            page = featureRepository.findByProjectIdAndActiveTrue(projectId, pageable);
        }

        return PageResponse.<FeatureResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<FeatureResponse> getActiveFeaturesForProject(Long projectId, Long userId) {
        permissionService.requirePermission(userId, "FEATURE", "VIEW");

        return featureRepository.findByProjectIdAndStatusCodeAndActiveTrue(projectId, "ACTIVE")
                .stream().map(this::mapToResponse).toList();
    }

    // ==================== HELPERS ====================
    private FeatureResponse mapToResponse(Feature f) {
        long sprintCount = sprintRepository.countByFeatureIdAndActiveTrue(f.getId());

        return FeatureResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .description(f.getDescription())
                .projectId(f.getProject().getId())
                .projectName(f.getProject().getName())
                .statusId(f.getStatus() != null ? f.getStatus().getId() : null)
                .statusName(f.getStatus() != null ? f.getStatus().getDisplayName() : null)
                .statusCode(f.getStatus() != null ? f.getStatus().getCode() : null)
                .sprintCount((int) sprintCount)
                .active(f.getActive())
                .createdAt(f.getCreatedAt())
                .createdBy(f.getCreatedBy())
                .build();
    }

    private void notifyProjectMembers(Long projectId, Long actorUserId,
            String title, String message, String entityType, Long entityId) {
        try {
            List<ProjectMember> members = memberRepository.findByProjectIdAndEndDateIsNull(projectId);
            for (ProjectMember member : members) {
                if (member.getUser() != null && !member.getUser().getId().equals(actorUserId)) {
                    notificationService.createNotification(
                            member.getUser().getId(),
                            entityType, entityId,
                            title, message,
                            actorUserId);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to notify project members: {}", e.getMessage());
        }
    }
}
