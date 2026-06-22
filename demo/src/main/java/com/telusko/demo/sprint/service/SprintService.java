package com.telusko.demo.sprint.service;

import com.telusko.demo.audit.service.AuditService;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
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
        private final ProjectMemberRepository memberRepository;
        private final FeatureRepository featureRepository;

        public SprintService(SprintRepository sprintRepository,
                        SprintWorkItemRepository sprintWorkItemRepository,
                        ProjectRepository projectRepository,
                        WorkItemRepository workItemRepository,
                        WorkItemHistoryRepository historyRepository,
                        MasterValueRepository masterValueRepository,
                        UserRepository userRepository,
                        PermissionService permissionService,
                        AuditService auditService,
                        NotificationService notificationService,
                        ProjectMemberRepository memberRepository,
                        FeatureRepository featureRepository) {
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
                this.memberRepository = memberRepository;
                this.featureRepository = featureRepository;
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

                // RULE: Feature is required and must belong to the project
                Feature feature = featureRepository.findById(request.getFeatureId())
                                .orElseThrow(() -> new ResourceNotFoundException("Feature", "id",
                                                request.getFeatureId()));

                if (!feature.getProject().getId().equals(project.getId())) {
                        throw new BadRequestException("Feature does not belong to the selected project");
                }

                // RULE: Feature must not be CLOSED/INACTIVE
                if (feature.getStatus() != null && "CLOSED".equals(feature.getStatus().getCode())) {
                        throw new BadRequestException("Cannot create sprints under a CLOSED feature");
                }

                MasterValue plannedStatus = masterValueRepository
                                .findByMasterTypeCodeAndCode("SPRINT_STATUS", "PLANNED")
                                .orElseThrow(() -> new BadRequestException("PLANNED status not configured"));

                Sprint sprint = Sprint.builder()
                                .project(project)
                                .feature(feature)
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

                log.info("Sprint created: id={}, project={}, feature={}", sprint.getId(), project.getCode(), feature.getName());
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

                // RULE: If owner is not set and assignee exists, auto-promote assignee to owner
                if (workItem.getOwner() == null && workItem.getAssignee() != null) {
                        workItem.setOwner(workItem.getAssignee());
                        historyRepository.save(WorkItemHistory.builder()
                                        .workItem(workItem)
                                        .eventType("OWNER_SET")
                                        .toUser(workItem.getAssignee())
                                        .performedBy(addedBy)
                                        .performedAt(LocalDateTime.now())
                                        .build());
                        auditService.logAction("WORK_ITEM", workItemId, "OWNER_SET", null, workItem.getAssignee().getFullName(), userId);
                        log.info("Auto-promoted assignee {} to owner for work item {} during sprint add", workItem.getAssignee().getFullName(), workItemId);
                }

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
        public Page<SprintResponse> getSprintsByProject(Long projectId, Long featureId, String search, Pageable pageable) {
                // If featureId is provided, filter by feature
                if (featureId != null) {
                        if (search != null && !search.trim().isEmpty()) {
                                return sprintRepository.findByFeatureIdAndActiveTrueAndSearch(featureId, search.trim(), pageable)
                                                .map(this::mapToResponse);
                        } else {
                                return sprintRepository.findByFeatureIdAndActiveTrue(featureId, pageable)
                                                .map(this::mapToResponse);
                        }
                }
                // Otherwise filter by project only
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
        public com.telusko.demo.sprint.dto.SprintDashboardResponse getSprintDashboard(Long sprintId) {
                Sprint sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));

                List<SprintWorkItem> swiList = sprintWorkItemRepository.findBySprintIdWithWorkItemDetails(sprintId);
                List<WorkItem> workItems = swiList.stream()
                                .map(SprintWorkItem::getWorkItem).toList();

                // --- Status counts ---
                int totalItems = workItems.size();
                int completedItems = 0, inProgressItems = 0, openItems = 0, backlogItems = 0;
                int totalSP = 0, completedSP = 0;

                for (WorkItem wi : workItems) {
                        String sc = wi.getStatus() != null ? wi.getStatus().getCode() : "BACKLOG";
                        int sp = wi.getStoryPoints() != null ? wi.getStoryPoints() : 0;
                        totalSP += sp;
                        switch (sc) {
                                case "DONE": completedItems++; completedSP += sp; break;
                                case "IN_PROGRESS": inProgressItems++; break;
                                case "OPEN": openItems++; break;
                                default: backlogItems++; break;
                        }
                }

                double completionPct = totalItems > 0 ? Math.round((completedItems * 100.0) / totalItems * 10) / 10.0 : 0;

                // --- Burndown chart data ---
                java.time.LocalDate start = sprint.getStartDate() != null ? sprint.getStartDate() : sprint.getCreatedAt().toLocalDate();
                java.time.LocalDate end = sprint.getEndDate() != null ? sprint.getEndDate() : start.plusDays(14);
                java.time.LocalDate today = java.time.LocalDate.now();
                if (today.isAfter(end)) today = end;

                long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end);
                if (totalDays <= 0) totalDays = 1;

                List<com.telusko.demo.sprint.dto.SprintDashboardResponse.BurndownPoint> burndownPoints = new java.util.ArrayList<>();
                // Count items done per day from history
                java.util.Map<java.time.LocalDate, Integer> doneByDay = new java.util.HashMap<>();
                for (WorkItem wi : workItems) {
                        if (wi.getStatus() != null && "DONE".equals(wi.getStatus().getCode())) {
                                // Use updatedAt as the completion date
                                java.time.LocalDate doneDate = wi.getUpdatedAt() != null ?
                                        wi.getUpdatedAt().toLocalDate() : today;
                                if (doneDate.isBefore(start)) doneDate = start;
                                if (doneDate.isAfter(end)) doneDate = end;
                                doneByDay.merge(doneDate, wi.getStoryPoints() != null ? wi.getStoryPoints() : 1,
                                        Integer::sum);
                        }
                }

                int remaining = totalSP > 0 ? totalSP : totalItems;
                int cumulativeDone = 0;
                for (java.time.LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
                        long dayIndex = java.time.temporal.ChronoUnit.DAYS.between(start, d);
                        int ideal = (int) Math.round(remaining * (1.0 - (double) dayIndex / totalDays));

                        if (!d.isAfter(today)) {
                                cumulativeDone += doneByDay.getOrDefault(d, 0);
                        }
                        int actual = d.isAfter(today) ? -1 : remaining - cumulativeDone;
                        if (actual < 0 && d.isAfter(today)) actual = -1; // placeholder for future

                        burndownPoints.add(com.telusko.demo.sprint.dto.SprintDashboardResponse.BurndownPoint.builder()
                                .date(d.toString())
                                .ideal(ideal)
                                .actual(actual < 0 && !d.isAfter(today) ? 0 : actual)
                                .build());
                }

                // --- User performance (include ALL project members) ---
                java.util.Map<Long, com.telusko.demo.sprint.dto.SprintDashboardResponse.UserPerformance> userMap = new java.util.LinkedHashMap<>();

                // Pre-populate with all project members
                try {
                        List<ProjectMember> members = memberRepository.findByProjectIdAndEndDateIsNull(sprint.getProject().getId());
                        for (ProjectMember pm : members) {
                                User u = pm.getUser();
                                if (u != null && !userMap.containsKey(u.getId())) {
                                        userMap.put(u.getId(), com.telusko.demo.sprint.dto.SprintDashboardResponse.UserPerformance.builder()
                                                .userId(u.getId()).userName(u.getFullName())
                                                .totalTasks(0).completedTasks(0).inProgressTasks(0)
                                                .totalStoryPoints(0).completedStoryPoints(0).completionRate(0)
                                                .build());
                                }
                        }
                } catch (Exception e) {
                        log.warn("Failed to fetch project members: {}", e.getMessage());
                }

                for (WorkItem wi : workItems) {
                        User effectiveAssignee = wi.getAssignee() != null ? wi.getAssignee() : wi.getOwner();
                        Long uid = effectiveAssignee != null ? effectiveAssignee.getId() : 0L;
                        String uname = effectiveAssignee != null ? effectiveAssignee.getFullName() : "Unassigned";

                        userMap.computeIfAbsent(uid, k ->
                                com.telusko.demo.sprint.dto.SprintDashboardResponse.UserPerformance.builder()
                                        .userId(uid).userName(uname)
                                        .totalTasks(0).completedTasks(0).inProgressTasks(0)
                                        .totalStoryPoints(0).completedStoryPoints(0).completionRate(0)
                                        .build());

                        var up = userMap.get(uid);
                        up.setTotalTasks(up.getTotalTasks() + 1);
                        int sp = wi.getStoryPoints() != null ? wi.getStoryPoints() : 0;
                        up.setTotalStoryPoints(up.getTotalStoryPoints() + sp);

                        String sc = wi.getStatus() != null ? wi.getStatus().getCode() : "BACKLOG";
                        if ("DONE".equals(sc)) {
                                up.setCompletedTasks(up.getCompletedTasks() + 1);
                                up.setCompletedStoryPoints(up.getCompletedStoryPoints() + sp);
                        } else if ("IN_PROGRESS".equals(sc)) {
                                up.setInProgressTasks(up.getInProgressTasks() + 1);
                        }
                }
                for (var up : userMap.values()) {
                        up.setCompletionRate(up.getTotalTasks() > 0 ?
                                Math.round((up.getCompletedTasks() * 100.0) / up.getTotalTasks() * 10) / 10.0 : 0);
                }

                // --- Status distribution ---
                java.util.Map<String, int[]> statusMap = new java.util.LinkedHashMap<>();
                String[][] statusDefs = {{"BACKLOG", "Backlog", "#9CA3AF"}, {"OPEN", "Open", "#3B82F6"},
                        {"IN_PROGRESS", "In Progress", "#D97706"}, {"DONE", "Done", "#059669"}};
                for (String[] sd : statusDefs) statusMap.put(sd[0], new int[]{0});

                for (WorkItem wi : workItems) {
                        String sc = wi.getStatus() != null ? wi.getStatus().getCode() : "BACKLOG";
                        statusMap.computeIfAbsent(sc, k -> new int[]{0})[0]++;
                }

                List<com.telusko.demo.sprint.dto.SprintDashboardResponse.StatusDistribution> statusDist = new java.util.ArrayList<>();
                for (String[] sd : statusDefs) {
                        int count = statusMap.getOrDefault(sd[0], new int[]{0})[0];
                        if (count > 0 || true) { // always include all statuses
                                statusDist.add(com.telusko.demo.sprint.dto.SprintDashboardResponse.StatusDistribution.builder()
                                        .statusCode(sd[0]).statusName(sd[1]).count(count).color(sd[2]).build());
                        }
                }

                // --- Work item summaries ---
                List<com.telusko.demo.sprint.dto.SprintDashboardResponse.SprintWorkItemSummary> wiSummaries = workItems.stream()
                        .map(wi -> com.telusko.demo.sprint.dto.SprintDashboardResponse.SprintWorkItemSummary.builder()
                                .id(wi.getId())
                                .title(wi.getTitle())
                                .statusCode(wi.getStatus() != null ? wi.getStatus().getCode() : null)
                                .statusName(wi.getStatus() != null ? wi.getStatus().getDisplayName() : null)
                                .typeCode(wi.getType() != null ? wi.getType().getCode() : null)
                                .typeName(wi.getType() != null ? wi.getType().getDisplayName() : null)
                                .priorityCode(wi.getPriority() != null ? wi.getPriority().getCode() : null)
                                .priorityName(wi.getPriority() != null ? wi.getPriority().getDisplayName() : null)
                                .assigneeName(wi.getAssignee() != null ? wi.getAssignee().getFullName() : (wi.getOwner() != null ? wi.getOwner().getFullName() : null))
                                .assigneeId(wi.getAssignee() != null ? wi.getAssignee().getId() : (wi.getOwner() != null ? wi.getOwner().getId() : null))
                                .storyPoints(wi.getStoryPoints())
                                .projectCode(wi.getProject() != null ? wi.getProject().getCode() : null)
                                .build())
                        .toList();

                return com.telusko.demo.sprint.dto.SprintDashboardResponse.builder()
                        .sprintId(sprint.getId())
                        .sprintName(sprint.getName())
                        .sprintGoal(sprint.getGoal())
                        .statusCode(sprint.getStatus() != null ? sprint.getStatus().getCode() : null)
                        .statusName(sprint.getStatus() != null ? sprint.getStatus().getDisplayName() : null)
                        .startDate(sprint.getStartDate())
                        .endDate(sprint.getEndDate())
                        .projectName(sprint.getProject() != null ? sprint.getProject().getName() : null)
                        .totalItems(totalItems)
                        .completedItems(completedItems)
                        .inProgressItems(inProgressItems)
                        .openItems(openItems)
                        .backlogItems(backlogItems)
                        .totalStoryPoints(totalSP)
                        .completedStoryPoints(completedSP)
                        .completionPercentage(completionPct)
                        .burndownData(burndownPoints)
                        .userPerformance(new java.util.ArrayList<>(userMap.values()))
                        .statusDistribution(statusDist)
                        .workItems(wiSummaries)
                        .build();
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
                                .featureId(s.getFeature() != null ? s.getFeature().getId() : null)
                                .featureName(s.getFeature() != null ? s.getFeature().getName() : null)
                                .featureStatusCode(s.getFeature() != null && s.getFeature().getStatus() != null ? s.getFeature().getStatus().getCode() : null)
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
