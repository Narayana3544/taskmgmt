package com.telusko.demo.workitem.service;

import com.telusko.demo.audit.service.AuditService;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.notification.service.NotificationService;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.repository.ProjectRepository;
import com.telusko.demo.rbac.service.PermissionService;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import com.telusko.demo.workitem.dto.WorkItemRequest;
import com.telusko.demo.workitem.dto.WorkItemResponse;
import com.telusko.demo.workitem.entity.WorkItem;
import com.telusko.demo.workitem.entity.WorkItemComment;
import com.telusko.demo.workitem.entity.WorkItemHistory;
import com.telusko.demo.workitem.repository.WorkItemCommentRepository;
import com.telusko.demo.workitem.repository.WorkItemHistoryRepository;
import com.telusko.demo.workitem.repository.WorkItemRepository;
import com.telusko.demo.sprint.repository.SprintWorkItemRepository;
import com.telusko.demo.sprint.repository.SprintRepository;
import com.telusko.demo.sprint.entity.SprintWorkItem;
import com.telusko.demo.sprint.entity.Sprint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Work item lifecycle management with full WorkHub rule enforcement.
 *
 * Rules enforced:
 * - Initial status forced to BACKLOG
 * - Owner is immutable once set
 * - Only Owner can move status to DONE
 * - CLOSED project blocks creation
 * - HANDOFF_TO_OWNER requires mandatory comment
 * - All state changes recorded in history
 * - No hard deletes
 */
@Service
public class WorkItemService {

    private static final Logger log = LoggerFactory.getLogger(WorkItemService.class);

    private final WorkItemRepository workItemRepository;
    private final WorkItemCommentRepository commentRepository;
    private final WorkItemHistoryRepository historyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MasterValueRepository masterValueRepository;
    private final PermissionService permissionService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final SprintWorkItemRepository sprintWorkItemRepository;
    private final SprintRepository sprintRepository;

    public WorkItemService(WorkItemRepository workItemRepository,
            WorkItemCommentRepository commentRepository,
            WorkItemHistoryRepository historyRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            MasterValueRepository masterValueRepository,
            PermissionService permissionService,
            AuditService auditService,
            NotificationService notificationService,
            SprintWorkItemRepository sprintWorkItemRepository,
            SprintRepository sprintRepository) {
        this.workItemRepository = workItemRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.masterValueRepository = masterValueRepository;
        this.permissionService = permissionService;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.sprintWorkItemRepository = sprintWorkItemRepository;
        this.sprintRepository = sprintRepository;
    }

    // ==================== CREATE ====================
    @Transactional
    public WorkItemResponse createWorkItem(WorkItemRequest request, Long userId) {
        permissionService.requirePermission(userId, "WORK_ITEM", "CREATE");

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        // RULE: CLOSED project blocks work item creation
        if (project.getStatus() != null && "CLOSED".equals(project.getStatus().getCode())) {
            throw new BadRequestException("Cannot create work items in a CLOSED project");
        }

        // RULE: Initial status MUST be BACKLOG
        MasterValue backlogStatus = masterValueRepository
                .findByMasterTypeCodeAndCode("WORK_ITEM_STATUS", "BACKLOG")
                .orElseThrow(() -> new BadRequestException("BACKLOG status not configured"));

        WorkItem workItem = WorkItem.builder()
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .storyPoints(request.getStoryPoints())
                .dueDate(request.getDueDate())
                .attachments(request.getAttachments())
                .status(backlogStatus) // Forced to BACKLOG
                .active(true)
                .build();

        resolveType(workItem, request.getTypeId());
        resolvePriority(workItem, request.getPriorityId());

        // Owner can be set on creation (once set, it's immutable)
        if (request.getOwnerId() != null) {
            workItem.setOwner(findUser(request.getOwnerId()));
        }
        if (request.getAssigneeId() != null) {
            workItem.setAssignee(findUser(request.getAssigneeId()));
        }

        workItem.setReportedBy(findUser(userId));
        workItem.setCreatedBy(userId);

        workItem = workItemRepository.save(workItem);

        recordHistory(workItem, "CREATED", null, null, null, backlogStatus, userId);
        // Handle sprint assignment
        if (request.getSprintId() != null) {
            Sprint sprint = sprintRepository.findById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", request.getSprintId()));
            
            if ("CLOSED".equals(sprint.getStatus().getCode())) {
                throw new BadRequestException("Cannot add work items to a CLOSED sprint");
            }
            
            SprintWorkItem swi = SprintWorkItem.builder()
                    .sprint(sprint)
                    .workItem(workItem)
                    .addedBy(userRepository.findById(userId).orElse(null))
                    .addedAt(LocalDateTime.now())
                    .build();
            sprintWorkItemRepository.save(swi);
        }

        auditService.logAction("WORK_ITEM", workItem.getId(), "CREATED", null, workItem.getTitle(), userId);

        // Notify assignee
        if (workItem.getAssignee() != null) {
            notificationService.createNotification(
                    workItem.getAssignee().getId(),
                    "WORK_ITEM", workItem.getId(),
                    "Task Assigned",
                    "Work item '" + workItem.getTitle() + "' has been assigned to you",
                    userId);
        }

        log.info("Work item created: id={}, status=BACKLOG, project={}", workItem.getId(), project.getCode());
        return mapToResponse(workItem);
    }

    // ==================== READ ====================
    @Transactional(readOnly = true)
    public PageResponse<WorkItemResponse> getWorkItemsByProject(Long projectId, String search, Pageable pageable) {
        Page<WorkItem> page;
        if (search != null && !search.trim().isEmpty()) {
            page = workItemRepository.findByProjectIdAndActiveTrueAndSearch(projectId, search.trim(), pageable);
        } else {
            page = workItemRepository.findByProjectIdAndActiveTrue(projectId, pageable);
        }
        return buildPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<WorkItemResponse> getMyWorkItems(Long userId, Pageable pageable) {
        // RULE: "My items" = user is OWNER or ASSIGNEE
        Page<WorkItem> page = workItemRepository.findByOwnerIdOrAssigneeIdAndActiveTrue(userId, userId, pageable);
        return buildPageResponse(page);
    }

    @Transactional(readOnly = true)
    public WorkItemResponse getWorkItemById(Long id) {
        WorkItem workItem = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", id));
        return mapToResponse(workItem);
    }

    @Transactional(readOnly = true)
    public List<WorkItemResponse> getBacklogItems(Long projectId) {
        return workItemRepository.findByProjectIdAndStatusCodeAndActiveTrue(projectId, "BACKLOG")
                .stream().map(this::mapToResponse).toList();
    }

    // ==================== UPDATE ====================
    @Transactional
    public WorkItemResponse updateWorkItem(Long id, WorkItemRequest request, Long userId) {
        permissionService.requirePermission(userId, "WORK_ITEM", "UPDATE");

        WorkItem workItem = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", id));

        // RULE: Owner is immutable once set
        if (request.getOwnerId() != null && workItem.getOwner() != null
                && !workItem.getOwner().getId().equals(request.getOwnerId())) {
            throw new BadRequestException("Owner cannot be changed once set. Current owner: "
                    + workItem.getOwner().getFullName());
        }

        // Set owner only if not already set
        if (request.getOwnerId() != null && workItem.getOwner() == null) {
            User newOwner = findUser(request.getOwnerId());
            workItem.setOwner(newOwner);
            recordHistory(workItem, "OWNER_SET", null, newOwner, null, null, userId);
            auditService.logAction("WORK_ITEM", id, "OWNER_SET", null, newOwner.getFullName(), userId);
        }

        workItem.setTitle(request.getTitle());
        workItem.setDescription(request.getDescription());
        workItem.setStoryPoints(request.getStoryPoints());
        workItem.setDueDate(request.getDueDate());
        
        if (request.getAttachments() != null) {
            workItem.setAttachments(request.getAttachments());
        }

        workItem.setUpdatedBy(userId);

        resolveType(workItem, request.getTypeId());
        resolvePriority(workItem, request.getPriorityId());

        // Track status change
        if (request.getStatusId() != null) {
            MasterValue oldStatus = workItem.getStatus();
            MasterValue newStatus = masterValueRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Status", "id", request.getStatusId()));

            // RULE: Only Owner can move to DONE
            if ("DONE".equals(newStatus.getCode())) {
                if (workItem.getOwner() == null || !workItem.getOwner().getId().equals(userId)) {
                    throw new BadRequestException("Only the Owner can mark a work item as DONE");
                }
            }

            if (oldStatus == null || !oldStatus.getId().equals(newStatus.getId())) {
                workItem.setStatus(newStatus);
                String oldName = oldStatus != null ? oldStatus.getCode() : "NONE";
                recordHistory(workItem, "STATUS_CHANGED", null, null, oldStatus, newStatus, userId);
                auditService.logAction("WORK_ITEM", id, "STATUS_CHANGED", oldName, newStatus.getCode(), userId);
            }
        }

        // Track assignee change
        if (request.getAssigneeId() != null) {
            User oldAssignee = workItem.getAssignee();
            User newAssignee = findUser(request.getAssigneeId());
            if (oldAssignee == null || !oldAssignee.getId().equals(newAssignee.getId())) {
                workItem.setAssignee(newAssignee);
                recordHistory(workItem, "ASSIGNED", oldAssignee, newAssignee, null, null, userId);
                auditService.logAction("WORK_ITEM", id, "ASSIGNED",
                        oldAssignee != null ? oldAssignee.getFullName() : "Unassigned",
                        newAssignee.getFullName(), userId);

                notificationService.createNotification(
                        newAssignee.getId(),
                        "WORK_ITEM", workItem.getId(),
                        "Task Assigned",
                        "Work item '" + workItem.getTitle() + "' has been assigned to you",
                        userId);
            }
        }

        // Handle sprint changes
        handleSprintChange(workItem, request.getSprintId(), userId);

        workItem = workItemRepository.save(workItem);
        return mapToResponse(workItem);
    }

    // ==================== ASSIGN ====================
    @Transactional
    public void assignWorkItem(Long workItemId, Long assigneeId, Long userId) {
        permissionService.requirePermission(userId, "WORK_ITEM", "UPDATE");

        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));

        User oldAssignee = workItem.getAssignee();
        User newAssignee = assigneeId != null ? findUser(assigneeId) : null;

        if ((oldAssignee == null && newAssignee != null) ||
            (oldAssignee != null && (newAssignee == null || !oldAssignee.getId().equals(newAssignee.getId())))) {
            
            workItem.setAssignee(newAssignee);
            workItem.setUpdatedBy(userId);

            // RULE: If owner is not set, auto-promote assignee to owner
            if (workItem.getOwner() == null && newAssignee != null) {
                workItem.setOwner(newAssignee);
                recordHistory(workItem, "OWNER_SET", null, newAssignee, null, null, userId);
                auditService.logAction("WORK_ITEM", workItemId, "OWNER_SET", null, newAssignee.getFullName(), userId);
                log.info("Auto-promoted assignee {} to owner for work item {}", newAssignee.getFullName(), workItemId);
            }
            
            recordHistory(workItem, "ASSIGNED", oldAssignee, newAssignee, null, null, userId);
            
            String oldName = oldAssignee != null ? oldAssignee.getFullName() : "Unassigned";
            String newName = newAssignee != null ? newAssignee.getFullName() : "Unassigned";
            auditService.logAction("WORK_ITEM", workItemId, "ASSIGNED", oldName, newName, userId);

            if (newAssignee != null) {
                notificationService.createNotification(
                        newAssignee.getId(),
                        "WORK_ITEM", workItemId,
                        "Task Assigned",
                        "Work item '" + workItem.getTitle() + "' has been assigned to you",
                        userId);
            }
            
            workItemRepository.save(workItem);
        }
    }

    // ==================== QUICK STATUS UPDATE ====================
    @Transactional
    public void updateWorkItemStatus(Long workItemId, String statusCode, Long userId) {
        permissionService.requirePermission(userId, "WORK_ITEM", "UPDATE");

        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));

        MasterValue newStatus = masterValueRepository.findByMasterTypeCodeAndCode("WORK_ITEM_STATUS", statusCode)
                .orElseThrow(() -> new BadRequestException("Status not configured: " + statusCode));

        MasterValue oldStatus = workItem.getStatus();
        
        if (oldStatus == null || !oldStatus.getId().equals(newStatus.getId())) {
            
            // RULE: Only Assignee or Owner can change the status
            boolean isOwner = workItem.getOwner() != null && workItem.getOwner().getId().equals(userId);
            boolean isAssignee = workItem.getAssignee() != null && workItem.getAssignee().getId().equals(userId);
            
            if (!isOwner && !isAssignee) {
                throw new BadRequestException("Only the Assignee or Owner can change the status of this work item");
            }

            // RULE: Only Owner can move to DONE
            if ("DONE".equals(newStatus.getCode()) && !isOwner) {
                throw new BadRequestException("Only the Owner can mark a work item as DONE");
            }

            workItem.setStatus(newStatus);
            workItem.setUpdatedBy(userId);

            String oldName = oldStatus != null ? oldStatus.getCode() : "NONE";
            recordHistory(workItem, "STATUS_CHANGED", null, null, oldStatus, newStatus, userId);
            auditService.logAction("WORK_ITEM", workItemId, "STATUS_CHANGED", oldName, newStatus.getCode(), userId);
            
            // Notify owner and/or assignee about status change
            if ("DONE".equals(newStatus.getCode()) && workItem.getAssignee() != null 
                    && !workItem.getAssignee().getId().equals(userId)) {
                notificationService.createNotification(
                        workItem.getAssignee().getId(),
                        "WORK_ITEM", workItemId,
                        "Task Completed",
                        "Work item '" + workItem.getTitle() + "' has been marked as DONE",
                        userId);
            }
            // Notify the owner about status change (if not the one who changed it)
            if (workItem.getOwner() != null && !workItem.getOwner().getId().equals(userId)) {
                notificationService.createNotification(
                        workItem.getOwner().getId(),
                        "WORK_ITEM", workItemId,
                        "Status Updated",
                        "Work item '" + workItem.getTitle() + "' status changed from " + oldName + " to " + newStatus.getCode(),
                        userId);
            }
            // Notify assignee about status change (if not the one who changed it and not the owner)
            if (workItem.getAssignee() != null && !workItem.getAssignee().getId().equals(userId)
                    && (workItem.getOwner() == null || !workItem.getAssignee().getId().equals(workItem.getOwner().getId()))) {
                notificationService.createNotification(
                        workItem.getAssignee().getId(),
                        "WORK_ITEM", workItemId,
                        "Status Updated",
                        "Work item '" + workItem.getTitle() + "' status changed from " + oldName + " to " + newStatus.getCode(),
                        userId);
            }
            
            workItemRepository.save(workItem);
        }
    }

    // ==================== HANDOFF TO OWNER ====================
    @Transactional
    public WorkItemResponse handoffToOwner(Long workItemId, String comment, Long userId) {
        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));

        if (workItem.getOwner() == null) {
            throw new BadRequestException("Cannot handoff — no owner set on this work item");
        }

        // RULE: Comment is mandatory for handoff
        if (comment == null || comment.isBlank()) {
            throw new BadRequestException("Comment is mandatory for handoff to owner");
        }

        User fromUser = findUser(userId);
        User toUser = workItem.getOwner();

        // Reassign to owner
        workItem.setAssignee(toUser);
        workItem.setUpdatedBy(userId);

        // Record handoff with comment in history
        WorkItemHistory history = WorkItemHistory.builder()
                .workItem(workItem)
                .eventType("HANDOFF_TO_OWNER")
                .fromUser(fromUser)
                .toUser(toUser)
                .comment(comment)
                .performedBy(fromUser)
                .performedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);

        // Also add comment as a regular comment
        addComment(workItemId, "[Handoff] " + comment, userId);

        auditService.logAction("WORK_ITEM", workItemId, "HANDOFF_TO_OWNER",
                fromUser.getFullName(), toUser.getFullName(), userId);

        notificationService.createNotification(
                toUser.getId(),
                "WORK_ITEM", workItemId,
                "Task Handoff",
                fromUser.getFullName() + " handed off '" + workItem.getTitle() + "' to you: " + comment,
                userId);

        workItem = workItemRepository.save(workItem);
        return mapToResponse(workItem);
    }

    // ==================== COMMENTS ====================
    @Transactional
    public void addComment(Long workItemId, String commentText, Long userId) {
        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));
        User user = findUser(userId);

        WorkItemComment comment = WorkItemComment.builder()
                .workItem(workItem)
                .commentText(commentText)
                .commentedBy(user)
                .commentedAt(LocalDateTime.now())
                .isSystemGenerated(false)
                .active(true)
                .build();
        commentRepository.save(comment);

        // Notify owner about new comment (if not the commenter)
        if (workItem.getOwner() != null && !workItem.getOwner().getId().equals(userId)) {
            notificationService.createNotification(
                    workItem.getOwner().getId(),
                    "WORK_ITEM", workItemId,
                    "New Comment",
                    user.getFullName() + " commented on '" + workItem.getTitle() + "'",
                    userId);
        }
        // Notify assignee about new comment (if not the commenter and not already notified as owner)
        if (workItem.getAssignee() != null && !workItem.getAssignee().getId().equals(userId)
                && (workItem.getOwner() == null || !workItem.getAssignee().getId().equals(workItem.getOwner().getId()))) {
            notificationService.createNotification(
                    workItem.getAssignee().getId(),
                    "WORK_ITEM", workItemId,
                    "New Comment",
                    user.getFullName() + " commented on '" + workItem.getTitle() + "'",
                    userId);
        }
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getComments(Long workItemId) {
        return commentRepository.findByWorkItemIdAndActiveTrueOrderByCommentedAtDesc(workItemId).stream()
                .map(c -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", c.getId());
                    map.put("content", c.getCommentText());
                    map.put("authorName", c.getCommentedBy() != null ? c.getCommentedBy().getFullName() : "System");
                    map.put("createdAt", c.getCommentedAt());
                    return map;
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getHistory(Long workItemId) {
        return historyRepository.findByWorkItemIdOrderByPerformedAtDesc(workItemId).stream()
                .map(h -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", h.getId());
                    map.put("eventType", h.getEventType());
                    map.put("performedByName", h.getPerformedBy() != null ? h.getPerformedBy().getFullName() : "System");
                    map.put("performedAt", h.getPerformedAt());
                    map.put("comment", h.getComment());
                    
                    if (h.getOldStatus() != null) map.put("oldValue", h.getOldStatus().getDisplayName());
                    else if (h.getFromUser() != null) map.put("oldValue", h.getFromUser().getFullName());
                    
                    if (h.getNewStatus() != null) map.put("newValue", h.getNewStatus().getDisplayName());
                    else if (h.getToUser() != null) map.put("newValue", h.getToUser().getFullName());
                    
                    return map;
                }).toList();
    }

    // ==================== HELPERS ====================
    private void resolveType(WorkItem workItem, Long typeId) {
        if (typeId != null) {
            workItem.setType(masterValueRepository.findById(typeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Type", "id", typeId)));
        }
    }

    private void resolvePriority(WorkItem workItem, Long priorityId) {
        if (priorityId != null) {
            workItem.setPriority(masterValueRepository.findById(priorityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Priority", "id", priorityId)));
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private void recordHistory(WorkItem workItem, String eventType,
            User fromUser, User toUser,
            MasterValue oldStatus, MasterValue newStatus,
            Long performedById) {
        WorkItemHistory history = WorkItemHistory.builder()
                .workItem(workItem)
                .eventType(eventType)
                .fromUser(fromUser)
                .toUser(toUser)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .performedBy(findUser(performedById))
                .performedAt(LocalDateTime.now())
                .build();
        historyRepository.save(history);
    }

    private PageResponse<WorkItemResponse> buildPageResponse(Page<WorkItem> page) {
        return PageResponse.<WorkItemResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private WorkItemResponse mapToResponse(WorkItem w) {
        Long sprintId = null;
        String sprintName = null;
        try {
            List<SprintWorkItem> swiList = sprintWorkItemRepository.findActiveByWorkItemId(w.getId());
            if (!swiList.isEmpty()) {
                SprintWorkItem activeSwi = swiList.get(0);
                if (activeSwi.getSprint() != null) {
                    sprintId = activeSwi.getSprint().getId();
                    sprintName = activeSwi.getSprint().getName();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to map sprint for work item {}: {}", w.getId(), e.getMessage());
        }

        // Resolve createdBy / updatedBy user names
        String createdByName = null;
        if (w.getCreatedBy() != null) {
            try {
                createdByName = userRepository.findById(w.getCreatedBy())
                        .map(User::getFullName).orElse(null);
            } catch (Exception e) { /* ignore */ }
        }
        String updatedByName = null;
        if (w.getUpdatedBy() != null) {
            try {
                updatedByName = userRepository.findById(w.getUpdatedBy())
                        .map(User::getFullName).orElse(null);
            } catch (Exception e) { /* ignore */ }
        }

        return WorkItemResponse.builder()
                .id(w.getId())
                .projectId(w.getProject().getId())
                .projectName(w.getProject().getName())
                .projectCode(w.getProject().getCode())
                .title(w.getTitle())
                .description(w.getDescription())
                .typeId(w.getType() != null ? w.getType().getId() : null)
                .typeName(w.getType() != null ? w.getType().getDisplayName() : null)
                .typeCode(w.getType() != null ? w.getType().getCode() : null)
                .statusId(w.getStatus() != null ? w.getStatus().getId() : null)
                .statusName(w.getStatus() != null ? w.getStatus().getDisplayName() : null)
                .statusCode(w.getStatus() != null ? w.getStatus().getCode() : null)
                .priorityId(w.getPriority() != null ? w.getPriority().getId() : null)
                .priorityName(w.getPriority() != null ? w.getPriority().getDisplayName() : null)
                .priorityCode(w.getPriority() != null ? w.getPriority().getCode() : null)
                .ownerId(w.getOwner() != null ? w.getOwner().getId() : null)
                .ownerName(w.getOwner() != null ? w.getOwner().getFullName() : null)
                .assigneeId(w.getAssignee() != null ? w.getAssignee().getId() : (w.getOwner() != null ? w.getOwner().getId() : null))
                .assigneeName(w.getAssignee() != null ? w.getAssignee().getFullName() : (w.getOwner() != null ? w.getOwner().getFullName() : null))
                .reportedById(w.getReportedBy() != null ? w.getReportedBy().getId() : null)
                .reportedByName(w.getReportedBy() != null ? w.getReportedBy().getFullName() : null)
                .storyPoints(w.getStoryPoints())
                .sprintId(sprintId)
                .sprintName(sprintName)
                .dueDate(w.getDueDate())
                .attachments(w.getAttachments())
                .active(w.getActive())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .createdById(w.getCreatedBy())
                .createdByName(createdByName)
                .updatedById(w.getUpdatedBy())
                .updatedByName(updatedByName)
                .build();
    }

    private void handleSprintChange(WorkItem workItem, Long newSprintId, Long userId) {
        List<SprintWorkItem> swiList = sprintWorkItemRepository.findActiveByWorkItemId(workItem.getId());
        SprintWorkItem currentSwi = swiList.isEmpty() ? null : swiList.get(0);
        Long currentSprintId = currentSwi != null ? currentSwi.getSprint().getId() : null;

        // If no change, do nothing
        if (newSprintId == null && currentSprintId == null) return;
        if (newSprintId != null && newSprintId.equals(currentSprintId)) return;

        User performer = userRepository.findById(userId).orElse(null);

        // Remove from old sprint
        if (currentSwi != null) {
            currentSwi.setRemovedAt(LocalDateTime.now());
            currentSwi.setRemovedBy(performer);
            sprintWorkItemRepository.save(currentSwi);
            auditService.logAction("SPRINT", currentSwi.getSprint().getId(), "ITEM_REMOVED", workItem.getTitle(), null, userId);
        }

        // Add to new sprint
        if (newSprintId != null) {
            Sprint newSprint = sprintRepository.findById(newSprintId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", newSprintId));

            if ("CLOSED".equals(newSprint.getStatus().getCode())) {
                throw new BadRequestException("Cannot add work items to a CLOSED sprint");
            }

            SprintWorkItem newSwi = SprintWorkItem.builder()
                    .sprint(newSprint)
                    .workItem(workItem)
                    .addedBy(performer)
                    .addedAt(LocalDateTime.now())
                    .build();
            sprintWorkItemRepository.save(newSwi);
            auditService.logAction("SPRINT", newSprintId, "ITEM_ADDED", null, workItem.getTitle(), userId);
        }
    }
}
