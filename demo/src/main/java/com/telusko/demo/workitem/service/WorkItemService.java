package com.telusko.demo.workitem.service;

import com.telusko.demo.audit.service.AuditService;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.notification.service.NotificationService;
import com.telusko.demo.project.entity.BoardColumn;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.repository.BoardColumnRepository;
import com.telusko.demo.project.repository.ProjectMemberRepository;
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
    private final BoardColumnRepository boardColumnRepository;
    private final ProjectMemberRepository projectMemberRepository;

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
            SprintRepository sprintRepository,
            BoardColumnRepository boardColumnRepository,
            ProjectMemberRepository projectMemberRepository) {
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
        this.boardColumnRepository = boardColumnRepository;
        this.projectMemberRepository = projectMemberRepository;
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

        if (request.getBoardColumnId() != null) {
            boardColumnRepository.findByIdAndActiveTrue(request.getBoardColumnId())
                    .ifPresent(workItem::setBoardColumn);
        }

        if (request.getBoardColumnId() != null) {
            boardColumnRepository.findByIdAndActiveTrue(request.getBoardColumnId())
                    .ifPresent(workItem::setBoardColumn);
        } else {
            boardColumnRepository.findFirstByProjectIdAndIsDefaultTrueAndActiveTrue(project.getId())
                    .ifPresent(workItem::setBoardColumn);
        }

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
        return workItemRepository.findBacklogItems(projectId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<WorkItemResponse> getWorkItemsBySprint(Long sprintId) {
        List<com.telusko.demo.sprint.entity.SprintWorkItem> swiList = sprintWorkItemRepository.findBySprintIdWithWorkItemDetails(sprintId);
        return swiList.stream().map(swi -> mapToResponse(swi.getWorkItem())).toList();
    }

    // ==================== UPDATE ====================
    @Transactional
    public WorkItemResponse updateWorkItem(Long id, WorkItemRequest request, Long userId) {
        permissionService.requirePermission(userId, "WORK_ITEM", "UPDATE");

        WorkItem workItem = workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", id));

        // RULE: Owner cannot be edited by Manager or Member; only Admin can edit the owner
        if (request.getOwnerId() != null && workItem.getOwner() != null
                && !workItem.getOwner().getId().equals(request.getOwnerId())) {
            boolean isAdmin = isUserAdmin(userId);
            if (!isAdmin) {
                throw new BadRequestException("Owner cannot be edited by a Manager or Member once set. Only an Administrator can change the owner.");
            }
            User newOwner = findUser(request.getOwnerId());
            workItem.setOwner(newOwner);
            recordHistory(workItem, "OWNER_CHANGED", workItem.getOwner(), newOwner, null, null, userId);
            auditService.logAction("WORK_ITEM", id, "OWNER_CHANGED", workItem.getOwner().getFullName(), newOwner.getFullName(), userId);
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

        if (request.getBoardColumnId() != null) {
            boardColumnRepository.findByIdAndActiveTrue(request.getBoardColumnId())
                    .ifPresent(workItem::setBoardColumn);
        }

        // Track status change
        if (request.getStatusId() != null) {
            MasterValue oldStatus = workItem.getStatus();
            MasterValue newStatus = masterValueRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Status", "id", request.getStatusId()));

            boolean isOwner = workItem.getOwner() != null && workItem.getOwner().getId().equals(userId);
            boolean isAssignee = workItem.getAssignee() != null && workItem.getAssignee().getId().equals(userId);
            boolean isAdmin = isUserAdmin(userId);

            if (oldStatus == null || !oldStatus.getId().equals(newStatus.getId())) {
                if ("DONE".equals(newStatus.getCode())) {
                    if (!isOwner && !isAdmin) {
                        throw new BadRequestException("Only the Owner can mark a work item as DONE");
                    }
                } else {
                    boolean isReopening = oldStatus != null && "DONE".equals(oldStatus.getCode());
                    if (isReopening) {
                        if (!isAssignee && !isOwner && !isAdmin) {
                            throw new BadRequestException("Only the assignee, owner, or admin can reopen this task");
                        }
                    } else {
                        if (!isAssignee && !isAdmin) {
                            if (workItem.getAssignee() == null) {
                                throw new BadRequestException("This task is unassigned. Only the assigned user can move it.");
                            } else {
                                throw new BadRequestException("Only the current assignee (" + workItem.getAssignee().getFullName() + ") can move this task forward or backward");
                            }
                        }
                    }
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
                User effectiveAssignee = workItem.getAssignee() != null ? workItem.getAssignee() : workItem.getOwner();
                boolean isOwner = workItem.getOwner() != null && workItem.getOwner().getId().equals(userId);
                boolean isAssignee = effectiveAssignee != null && effectiveAssignee.getId().equals(userId);
                boolean isAdmin = isUserAdmin(userId);
                boolean isManager = (effectiveAssignee != null && effectiveAssignee.getManager() != null && effectiveAssignee.getManager().getId().equals(userId))
                        || isUserAdminOrManager(userId);

                if (!isOwner && !isAssignee && !isManager && !isAdmin) {
                    throw new BadRequestException("Only the Owner, current Assignee, Manager of that member, or Admin can assign or transfer this task");
                }

                if (newAssignee != null && !isAdmin) {
                    boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndEndDateIsNull(
                            workItem.getProject().getId(), newAssignee.getId());
                    if (!isMember) {
                        throw new BadRequestException("Cannot assign: " + newAssignee.getFullName() + " is not an active member of project '" + workItem.getProject().getName() + "'");
                    }
                }
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

        User effectiveAssignee = workItem.getAssignee() != null ? workItem.getAssignee() : workItem.getOwner();
        boolean isOwner = workItem.getOwner() != null && workItem.getOwner().getId().equals(userId);
        boolean isAssignee = effectiveAssignee != null && effectiveAssignee.getId().equals(userId);
        boolean isAdmin = isUserAdmin(userId);
        boolean isManager = (effectiveAssignee != null && effectiveAssignee.getManager() != null && effectiveAssignee.getManager().getId().equals(userId))
                || isUserAdminOrManager(userId);

        if (!isOwner && !isAssignee && !isManager && !isAdmin) {
            throw new BadRequestException("Only the Owner, current Assignee, Manager of that member, or Admin can assign or transfer this task");
        }

        User oldAssignee = workItem.getAssignee();
        User newAssignee = assigneeId != null ? findUser(assigneeId) : null;

        // RULE: Owner, Assignee, and Manager can only assign to an active project member. Admin can assign to anyone.
        if (newAssignee != null && !isAdmin) {
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndEndDateIsNull(
                    workItem.getProject().getId(), newAssignee.getId());
            if (!isMember) {
                throw new BadRequestException("Cannot assign: " + newAssignee.getFullName() + " is not an active member of project '" + workItem.getProject().getName() + "'");
            }
        }

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
        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));

        MasterValue newStatus = masterValueRepository.findByMasterTypeCodeAndCode("WORK_ITEM_STATUS", statusCode)
                .orElseThrow(() -> new BadRequestException("Status not configured: " + statusCode));

        MasterValue oldStatus = workItem.getStatus();
        
        if (oldStatus == null || !oldStatus.getId().equals(newStatus.getId())) {
            
            User effectiveAssignee = workItem.getAssignee() != null ? workItem.getAssignee() : workItem.getOwner();
            boolean isOwner = workItem.getOwner() != null && workItem.getOwner().getId().equals(userId);
            boolean isAssignee = effectiveAssignee != null && effectiveAssignee.getId().equals(userId);
            boolean isAdmin = isUserAdmin(userId);

            // RULE: Movement authorization
            if ("DONE".equals(newStatus.getCode())) {
                if (!isOwner && !isAdmin) {
                    throw new BadRequestException("Only the Owner can mark a work item as DONE");
                }
            } else {
                boolean isReopening = oldStatus != null && "DONE".equals(oldStatus.getCode());
                if (isReopening) {
                    if (!isAssignee && !isOwner && !isAdmin) {
                        throw new BadRequestException("Only the assignee, owner, or admin can reopen this task");
                    }
                } else {
                    if (!isAssignee && !isAdmin) {
                        String assigneeName = effectiveAssignee != null ? effectiveAssignee.getFullName() : "the assigned user";
                        throw new BadRequestException("Only the current assignee (" + assigneeName + ") can move this task forward or backward");
                    }
                }
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

    // ==================== QUICK COLUMN UPDATE (KANBAN BOARD) ====================
    @Transactional
    public WorkItemResponse updateWorkItemColumn(Long workItemId, Long columnId, Long userId) {
        return updateWorkItemColumn(workItemId, columnId, null, userId);
    }

    @Transactional
    public WorkItemResponse updateWorkItemColumn(Long workItemId, Long columnId, String reopenReason, Long userId) {
        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", workItemId));

        BoardColumn newColumn = boardColumnRepository.findByIdAndActiveTrue(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", "id", columnId));

        if (!newColumn.getProject().getId().equals(workItem.getProject().getId())) {
            throw new BadRequestException("Column does not belong to the same project as the work item");
        }

        BoardColumn oldColumn = workItem.getBoardColumn();
        String oldColName = oldColumn != null ? oldColumn.getName() : "None";
        String oldCategory = oldColumn != null ? oldColumn.getStatusCategory() :
                (workItem.getStatus() != null && "DONE".equals(workItem.getStatus().getCode()) ? "DONE" :
                 (workItem.getStatus() != null && "IN_PROGRESS".equals(workItem.getStatus().getCode()) ? "IN_PROGRESS" : "TODO"));
        String newCategory = newColumn.getStatusCategory();

        // RULE: Phase transition progression: Work items cannot jump directly from TODO to DONE
        if ("TODO".equals(oldCategory) && "DONE".equals(newCategory)) {
            throw new BadRequestException("Work items must move through In Progress before being marked as Done");
        }

        // Map status category
        String targetStatusCode = switch (newCategory) {
            case "DONE" -> "DONE";
            case "IN_PROGRESS" -> "IN_PROGRESS";
            default -> "OPEN";
        };

        // RULE: Reopening closed task validation
        boolean isReopening = "DONE".equals(oldCategory) && !"DONE".equals(newCategory);
        if (isReopening) {
            if (reopenReason == null || reopenReason.trim().isEmpty()) {
                throw new BadRequestException("A reason is mandatory when reopening a closed task");
            }

            // Check if item belongs to the project's active sprint
            boolean isInActiveSprint = sprintWorkItemRepository.findActiveByWorkItemId(workItemId).stream()
                    .anyMatch(swi -> swi.getSprint() != null && swi.getSprint().getStatus() != null 
                            && "ACTIVE".equals(swi.getSprint().getStatus().getCode()));

            // If not in active sprint, it can only be reopened to the initial Open / Backlog state
            if (!isInActiveSprint && !"OPEN".equals(targetStatusCode)) {
                throw new BadRequestException("Closed tasks not belonging to the current active sprint can only be reopened to Open/Backlog to be planned.");
            }
        }

        // Check destination WIP limit
        if (newColumn.getWipLimit() != null && newColumn.getWipLimit() > 0) {
            long currentCount = workItemRepository.countByBoardColumnIdAndActiveTrue(newColumn.getId());
            if (oldColumn == null || !oldColumn.getId().equals(newColumn.getId())) {
                if (currentCount >= newColumn.getWipLimit()) {
                    throw new BadRequestException("WIP limit of " + newColumn.getWipLimit() + " reached for column '" + newColumn.getName() + "'");
                }
            }
        }

        User effectiveAssignee = workItem.getAssignee() != null ? workItem.getAssignee() : workItem.getOwner();
        boolean isOwner = workItem.getOwner() != null && workItem.getOwner().getId().equals(userId);
        boolean isAssignee = effectiveAssignee != null && effectiveAssignee.getId().equals(userId);
        boolean isAdmin = isUserAdmin(userId);

        if ("DONE".equals(targetStatusCode)) {
            if (!isOwner && !isAdmin) {
                throw new BadRequestException("Only the Owner can mark a work item as DONE");
            }
        } else if (isReopening) {
            if (!isAssignee && !isOwner && !isAdmin) {
                String assigneeName = effectiveAssignee != null ? effectiveAssignee.getFullName() : "owner";
                throw new BadRequestException("Only the current assignee (" + assigneeName + ") or owner can reopen this task");
            }
        } else {
            if (!isAssignee && !isAdmin) {
                String assigneeName = effectiveAssignee != null ? effectiveAssignee.getFullName() : "the assigned user";
                throw new BadRequestException("Only the current assignee (" + assigneeName + ") can move this task forward or backward");
            }
        }

        MasterValue oldStatus = workItem.getStatus();
        MasterValue newStatus = masterValueRepository.findByMasterTypeCodeAndCode("WORK_ITEM_STATUS", targetStatusCode)
                .orElse(oldStatus);

        workItem.setBoardColumn(newColumn);
        workItem.setStatus(newStatus);
        workItem.setUpdatedBy(userId);
        workItem = workItemRepository.save(workItem);

        if (isReopening) {
            recordHistory(workItem, "REOPENED", null, null, oldStatus, newStatus, reopenReason.trim(), userId);
            auditService.logAction("WORK_ITEM", workItemId, "REOPENED", oldColName, newColumn.getName() + " - Reason: " + reopenReason.trim(), userId);
        } else {
            recordHistory(workItem, "COLUMN_CHANGED", null, null, oldStatus, newStatus, null, userId);
            auditService.logAction("WORK_ITEM", workItemId, "COLUMN_CHANGED", oldColName, newColumn.getName(), userId);
        }

        log.info("Moved work item {} to column '{}' ({}) by user {}{}", 
                workItem.getId(), newColumn.getName(), targetStatusCode, userId,
                isReopening ? " (REOPENED: " + reopenReason.trim() + ")" : "");
        return mapToResponse(workItem);
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
        recordHistory(workItem, eventType, fromUser, toUser, oldStatus, newStatus, null, performedById);
    }

    private void recordHistory(WorkItem workItem, String eventType,
            User fromUser, User toUser,
            MasterValue oldStatus, MasterValue newStatus,
            String comment,
            Long performedById) {
        WorkItemHistory history = WorkItemHistory.builder()
                .workItem(workItem)
                .eventType(eventType)
                .fromUser(fromUser)
                .toUser(toUser)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .comment(comment)
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

    
    
    public boolean isUserAdminOrManager(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId)
                .map(User::getRole)
                .map(r -> {
                    String code = r.getCode();
                    return code != null && ("ADMIN".equalsIgnoreCase(code) || "SUPER_ADMIN".equalsIgnoreCase(code) || "MANAGER".equalsIgnoreCase(code));
                })
                .orElse(false);
    }

    public boolean isUserAdmin(Long userId) {
        if (userId == null) return false;
        return userRepository.findById(userId)
                .map(User::getRole)
                .map(r -> {
                    String code = r.getCode();
                    return code != null && ("ADMIN".equalsIgnoreCase(code) || "SUPER_ADMIN".equalsIgnoreCase(code));
                })
                .orElse(false);
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
                .boardColumnId(w.getBoardColumn() != null ? w.getBoardColumn().getId() : null)
                .boardColumnName(w.getBoardColumn() != null ? w.getBoardColumn().getName() : null)
                .boardColumnCategory(w.getBoardColumn() != null ? w.getBoardColumn().getStatusCategory() : null)
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
