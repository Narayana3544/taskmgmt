package com.telusko.demo.sprint.service;

import com.telusko.demo.audit.service.AuditService;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.notification.service.NotificationService;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.repository.ProjectRepository;
import com.telusko.demo.rbac.service.PermissionService;
import com.telusko.demo.sprint.dto.SprintRequest;
import com.telusko.demo.sprint.dto.SprintResponse;
import com.telusko.demo.sprint.entity.Sprint;
import com.telusko.demo.sprint.entity.SprintWorkItem;
import com.telusko.demo.sprint.repository.SprintRepository;
import com.telusko.demo.sprint.repository.SprintWorkItemRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import com.telusko.demo.workitem.entity.WorkItem;
import com.telusko.demo.workitem.entity.WorkItemHistory;
import com.telusko.demo.workitem.repository.WorkItemHistoryRepository;
import com.telusko.demo.workitem.repository.WorkItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Sprint lifecycle management with WorkHub rule enforcement.
 *
 * Rules:
 * - CLOSED project cannot create sprints
 * - Only 1 ACTIVE sprint per project
 * - Sprint goal is mandatory
 * - Sprint CLOSED cannot be reopened
 * - On close: non-DONE items spillover to BACKLOG
 */
@Service
public class SprintService {

        private static final Logger log = LoggerFactory.getLogger(SprintService.class);

        private final SprintRepository sprintRepository;
        private final SprintWorkItemRepository sprintWorkItemRepository;
        private final ProjectRepository projectRepository;
        private final WorkItemRepository workItemRepository;
        private final WorkItemHistoryRepository historyRepository;
        private final MasterValueRepository masterValueRepository;
        private final UserRepository userRepository;
        private final PermissionService permissionService;
        private final AuditService auditService;
        private final NotificationService notificationService;

        public SprintService(SprintRepository sprintRepository,
                        SprintWorkItemRepository sprintWorkItemRepository,
                        ProjectRepository projectRepository,
                        WorkItemRepository workItemRepository,
                        WorkItemHistoryRepository historyRepository,
                        MasterValueRepository masterValueRepository,
                        UserRepository userRepository,
                        PermissionService permissionService,
                        AuditService auditService,
                        NotificationService notificationService) {
                this.sprintRepository = sprintRepository;
                this.sprintWorkItemRepository = sprintWorkItemRepository;
                this.projectRepository = projectRepository;
                this.workItemRepository = workItemRepository;
                this.historyRepository = historyRepository;
                this.masterValueRepository = masterValueRepository;
                this.userRepository = userRepository;
                this.permissionService = permissionService;
                this.auditService = auditService;
                this.notificationService = notificationService;
        }

        @Transactional
        public SprintResponse createSprint(SprintRequest request, Long userId) {
                permissionService.requirePermission(userId, "SPRINT", "CREATE");

                Project project = projectRepository.findById(request.getProjectId())
                                .orElseThrow(() -> new ResourceNotFoundException("Project", "id",
                                                request.getProjectId()));

                // RULE: CLOSED project cannot create sprints
                if (project.getStatus() != null && "CLOSED".equals(project.getStatus().getCode())) {
                        throw new BadRequestException("Cannot create sprints in a CLOSED project");
                }

                MasterValue plannedStatus = masterValueRepository
                                .findByMasterTypeCodeAndCode("SPRINT_STATUS", "PLANNED")
                                .orElseThrow(() -> new BadRequestException("PLANNED status not configured"));

                Sprint sprint = Sprint.builder()
                                .project(project)
                                .name(request.getName())
                                .goal(request.getGoal())
                                .status(plannedStatus)
                                .startDate(request.getStartDate())
                                .endDate(request.getEndDate())
                                .active(true)
                                .build();
                sprint.setCreatedBy(userId);

                sprint = sprintRepository.save(sprint);
                auditService.logAction("SPRINT", sprint.getId(), "CREATED", null, sprint.getName(), userId);

                log.info("Sprint created: id={}, project={}", sprint.getId(), project.getCode());
                return mapToResponse(sprint);
        }

        @Transactional
        public SprintResponse startSprint(Long sprintId, Long userId) {
                permissionService.requirePermission(userId, "SPRINT", "UPDATE");

                Sprint sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

                if (!"PLANNED".equals(sprint.getStatus().getCode())) {
                        throw new BadRequestException("Only PLANNED sprints can be started");
                }

                // RULE: Only 1 ACTIVE sprint per project
                if (sprintRepository.existsActiveSprintInProject(sprint.getProject().getId())) {
                        throw new BadRequestException("Project already has an ACTIVE sprint. Close it first.");
                }

                MasterValue activeStatus = masterValueRepository
                                .findByMasterTypeCodeAndCode("SPRINT_STATUS", "ACTIVE")
                                .orElseThrow(() -> new BadRequestException("ACTIVE status not configured"));

                sprint.setStatus(activeStatus);
                sprint.setUpdatedBy(userId);
                sprint = sprintRepository.save(sprint);

                auditService.logAction("SPRINT", sprintId, "STARTED", "PLANNED", "ACTIVE", userId);

                // Notify project members about sprint start
                log.info("Sprint started: id={}", sprintId);
                return mapToResponse(sprint);
        }

        /**
         * Close sprint with spillover logic.
         * Non-DONE items: removed from sprint, status → BACKLOG, history event
         * SPILLOVER.
         */
        @Transactional
        public SprintResponse closeSprint(Long sprintId, Long userId) {
                permissionService.requirePermission(userId, "SPRINT", "CLOSE");

                Sprint sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

                if (!"ACTIVE".equals(sprint.getStatus().getCode())) {
                        throw new BadRequestException("Only ACTIVE sprints can be closed");
                }

                MasterValue closedStatus = masterValueRepository
                                .findByMasterTypeCodeAndCode("SPRINT_STATUS", "CLOSED")
                                .orElseThrow(() -> new BadRequestException("CLOSED status not configured"));

                MasterValue backlogStatus = masterValueRepository
                                .findByMasterTypeCodeAndCode("WORK_ITEM_STATUS", "BACKLOG")
                                .orElseThrow(() -> new BadRequestException("BACKLOG status not configured"));

                // SPILLOVER: move non-DONE items back to BACKLOG
                List<WorkItem> nonDoneItems = workItemRepository.findNonDoneItemsInSprint(sprintId);
                User performer = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                for (WorkItem item : nonDoneItems) {
                        MasterValue oldStatus = item.getStatus();
                        item.setStatus(backlogStatus);
                        item.setUpdatedBy(userId);
                        workItemRepository.save(item);

                        // Record SPILLOVER history
                        historyRepository.save(WorkItemHistory.builder()
                                        .workItem(item)
                                        .eventType("SPILLOVER")
                                        .oldStatus(oldStatus)
                                        .newStatus(backlogStatus)
                                        .comment("Spilled over from sprint: " + sprint.getName())
                                        .performedBy(performer)
                                        .performedAt(LocalDateTime.now())
                                        .build());

                        // Mark sprint-work mapping as removed
                        sprintWorkItemRepository.findBySprintIdAndWorkItemIdAndRemovedAtIsNull(sprintId, item.getId())
                                        .ifPresent(swi -> {
                                                swi.setRemovedAt(LocalDateTime.now());
                                                swi.setRemovedBy(performer);
                                                sprintWorkItemRepository.save(swi);
                                        });

                        // Notify assignee about spillover
                        if (item.getAssignee() != null) {
                                notificationService.createNotification(
                                                item.getAssignee().getId(),
                                                "WORK_ITEM", item.getId(),
                                                "Sprint Spillover",
                                                "'" + item.getTitle() + "' was spilled over from sprint '"
                                                                + sprint.getName() + "'",
                                                userId);
                        }

                        auditService.logAction("WORK_ITEM", item.getId(), "SPILLOVER",
                                        oldStatus.getCode(), "BACKLOG", userId);
                }

                sprint.setStatus(closedStatus);
                sprint.setUpdatedBy(userId);
                sprint = sprintRepository.save(sprint);

                auditService.logAction("SPRINT", sprintId, "CLOSED", "ACTIVE", "CLOSED", userId);
                log.info("Sprint closed: id={}, spillover count={}", sprintId, nonDoneItems.size());

                return mapToResponse(sprint);
        }

        @Transactional
        public void addWorkItemToSprint(Long sprintId, Long workItemId, Long userId) {
                Sprint sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

                // RULE: Cannot add items to CLOSED sprint
                if ("CLOSED".equals(sprint.getStatus().getCode())) {
                        throw new BadRequestException("Cannot add work items to a CLOSED sprint");
                }

                WorkItem workItem = workItemRepository.findById(workItemId)
                                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));

                // Check not already in sprint
                if (sprintWorkItemRepository.findBySprintIdAndWorkItemIdAndRemovedAtIsNull(sprintId, workItemId)
                                .isPresent()) {
                        throw new BadRequestException("Work item is already in this sprint");
                }

                User addedBy = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                SprintWorkItem swi = SprintWorkItem.builder()
                                .sprint(sprint)
                                .workItem(workItem)
                                .addedBy(addedBy)
                                .addedAt(LocalDateTime.now())
                                .build();
                sprintWorkItemRepository.save(swi);

                // Change status from BACKLOG to OPEN
                if (workItem.getStatus() != null && "BACKLOG".equals(workItem.getStatus().getCode())) {
                        MasterValue oldStatus = workItem.getStatus();
                        MasterValue openStatus = masterValueRepository
                                        .findByMasterTypeCodeAndCode("WORK_ITEM_STATUS", "OPEN")
                                        .orElseThrow(() -> new BadRequestException("OPEN status not configured"));
                                        
                        workItem.setStatus(openStatus);
                        workItem.setUpdatedBy(userId);
                        workItemRepository.save(workItem);
                        
                        historyRepository.save(WorkItemHistory.builder()
                                        .workItem(workItem)
                                        .eventType("STATUS_CHANGED")
                                        .oldStatus(oldStatus)
                                        .newStatus(openStatus)
                                        .performedBy(addedBy)
                                        .performedAt(LocalDateTime.now())
                                        .build());
                                        
                        auditService.logAction("WORK_ITEM", workItemId, "STATUS_CHANGED", "BACKLOG", "OPEN", userId);
                }

                auditService.logAction("SPRINT", sprintId, "ITEM_ADDED", null, workItem.getTitle(), userId);
        }

        @Transactional
        public void removeWorkItemFromSprint(Long sprintId, Long workItemId, Long userId) {
                SprintWorkItem swi = sprintWorkItemRepository
                                .findBySprintIdAndWorkItemIdAndRemovedAtIsNull(sprintId, workItemId)
                                .orElseThrow(() -> new ResourceNotFoundException("SprintWorkItem",
                                                "sprintId+workItemId", sprintId));

                User removedBy = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

                swi.setRemovedAt(LocalDateTime.now());
                swi.setRemovedBy(removedBy);
                sprintWorkItemRepository.save(swi);

                auditService.logAction("SPRINT", sprintId, "ITEM_REMOVED", swi.getWorkItem().getTitle(), null, userId);
        }

        // ==================== READ ====================
        @Transactional(readOnly = true)
        public Page<SprintResponse> getSprintsByProject(Long projectId, String search, Pageable pageable) {
                if (search != null && !search.trim().isEmpty()) {
                        return sprintRepository.findByProjectIdAndActiveTrueAndSearch(projectId, search.trim(), pageable)
                                        .map(this::mapToResponse);
                } else {
                        return sprintRepository.findByProjectIdAndActiveTrue(projectId, pageable)
                                        .map(this::mapToResponse);
                }
        }

        @Transactional(readOnly = true)
        public com.telusko.demo.sprint.dto.SprintOverviewResponse getSprintOverview(Long sprintId) {
                return sprintWorkItemRepository.getSprintOverview(sprintId);
        }

        @Transactional(readOnly = true)
        public SprintResponse getSprintById(Long id) {
                Sprint sprint = sprintRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", id));
                return mapToResponse(sprint);
        }

        @Transactional
        public SprintResponse updateSprint(Long id, SprintRequest request, Long userId) {
                permissionService.requirePermission(userId, "SPRINT", "UPDATE");

                Sprint sprint = sprintRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", id));

                if ("CLOSED".equals(sprint.getStatus().getCode())) {
                        throw new BadRequestException("Cannot update a CLOSED sprint");
                }

                sprint.setName(request.getName());
                sprint.setGoal(request.getGoal());
                sprint.setStartDate(request.getStartDate());
                sprint.setEndDate(request.getEndDate());
                sprint.setUpdatedBy(userId);

                sprint = sprintRepository.save(sprint);
                return mapToResponse(sprint);
        }

        @Transactional(readOnly = true)
        public List<SprintWorkItem> getSprintItems(Long sprintId) {
                return sprintWorkItemRepository.findBySprintIdAndRemovedAtIsNull(sprintId);
        }

        private SprintResponse mapToResponse(Sprint s) {
                List<SprintWorkItem> items = sprintWorkItemRepository.findBySprintIdAndRemovedAtIsNull(s.getId());
                long doneCount = items.stream()
                                .filter(swi -> swi.getWorkItem().getStatus() != null
                                                && "DONE".equals(swi.getWorkItem().getStatus().getCode()))
                                .count();

                return SprintResponse.builder()
                                .id(s.getId())
                                .projectId(s.getProject().getId())
                                .projectName(s.getProject().getName())
                                .name(s.getName())
                                .goal(s.getGoal())
                                .statusId(s.getStatus() != null ? s.getStatus().getId() : null)
                                .statusName(s.getStatus() != null ? s.getStatus().getDisplayName() : null)
                                .statusCode(s.getStatus() != null ? s.getStatus().getCode() : null)
                                .startDate(s.getStartDate())
                                .endDate(s.getEndDate())
                                .totalItems(items.size())
                                .doneItems((int) doneCount)
                                .createdAt(s.getCreatedAt())
                                .build();
        }
}
