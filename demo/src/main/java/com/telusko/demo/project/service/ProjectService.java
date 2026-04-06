package com.telusko.demo.project.service;

import com.telusko.demo.audit.service.AuditService;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import com.telusko.demo.project.dto.ProjectMemberRequest;
import com.telusko.demo.project.dto.ProjectMemberResponse;
import com.telusko.demo.project.dto.ProjectRequest;
import com.telusko.demo.project.dto.ProjectResponse;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.entity.ProjectMember;
import com.telusko.demo.project.repository.ProjectMemberRepository;
import com.telusko.demo.project.repository.ProjectRepository;
import com.telusko.demo.rbac.service.PermissionService;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Project lifecycle management.
 * Rules: project never deleted, CLOSED = read-only, one active membership per
 * user per project.
 */
@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final MasterValueRepository masterValueRepository;
    private final PermissionService permissionService;
    private final AuditService auditService;

    public ProjectService(ProjectRepository projectRepository,
            ProjectMemberRepository memberRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            MasterValueRepository masterValueRepository,
            PermissionService permissionService,
            AuditService auditService) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.masterValueRepository = masterValueRepository;
        this.permissionService = permissionService;
        this.auditService = auditService;
    }

    // ==================== PROJECT CRUD ====================

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, Long orgId, Long userId) {
        permissionService.requirePermission(userId, "PROJECT", "CREATE");

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        MasterValue activeStatus = masterValueRepository
                .findByMasterTypeCodeAndCode("PROJECT_STATUS", "ACTIVE")
                .orElse(null);

        Project project = Project.builder()
                .organization(org)
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .status(activeStatus)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(true)
                .build();
        project.setCreatedBy(userId);

        project = projectRepository.save(project);

        // Auto-add creator as project member
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(creator)
                .startDate(LocalDate.now())
                .build();
        member.setCreatedBy(userId);
        memberRepository.save(member);

        auditService.logAction("PROJECT", project.getId(), "CREATED", null, project.getName(), userId);

        log.info("Project created: id={}, code={}", project.getId(), project.getCode());
        return mapToResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, Long userId) {
        permissionService.requirePermission(userId, "PROJECT", "UPDATE");

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        // RULE: CLOSED project is read-only
        if (project.getStatus() != null && "CLOSED".equals(project.getStatus().getCode())) {
            throw new BadRequestException("Cannot update a CLOSED project");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setUpdatedBy(userId);

        if (request.getStatusId() != null) {
            MasterValue newStatus = masterValueRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Status", "id", request.getStatusId()));
            String oldCode = project.getStatus() != null ? project.getStatus().getCode() : "NONE";
            project.setStatus(newStatus);
            auditService.logAction("PROJECT", id, "STATUS_CHANGED", oldCode, newStatus.getCode(), userId);
        }

        project = projectRepository.save(project);
        return mapToResponse(project);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getProjects(Long orgId, String search, Pageable pageable) {
        Page<Project> page;
        if (search != null && !search.trim().isEmpty()) {
            page = projectRepository.findByOrganizationIdAndActiveTrueAndSearch(orgId, search.trim(), pageable);
        } else {
            page = projectRepository.findByOrganizationIdAndActiveTrue(orgId, pageable);
        }
        return PageResponse.<ProjectResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        return mapToResponse(project);
    }

    // ==================== PROJECT MEMBERS ====================

    @Transactional
    public ProjectMemberResponse addMember(ProjectMemberRequest request, Long userId) {
        permissionService.requirePermission(userId, "PROJECT", "UPDATE");

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        // RULE: One user can have only one active membership per project
        if (memberRepository.findActiveMembership(project.getId(), user.getId()).isPresent()) {
            throw new BadRequestException("User already has an active membership in this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .endDate(request.getEndDate())
                .build();
        member.setCreatedBy(userId);

        if (request.getProjectRoleId() != null) {
            member.setProjectRole(masterValueRepository.findById(request.getProjectRoleId()).orElse(null));
        }
        if (request.getManagerId() != null) {
            member.setManager(userRepository.findById(request.getManagerId()).orElse(null));
        }

        member = memberRepository.save(member);
        auditService.logAction("PROJECT_MEMBER", member.getId(), "ADDED",
                null, user.getFullName() + " added to " + project.getName(), userId);

        return mapMemberToResponse(member);
    }

    @Transactional
    public ProjectMemberResponse updateMember(Long memberId, ProjectMemberRequest request, Long userId) {
        permissionService.requirePermission(userId, "PROJECT", "UPDATE");

        ProjectMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectMember", "id", memberId));

        if (request.getProjectRoleId() != null) {
            member.setProjectRole(masterValueRepository.findById(request.getProjectRoleId()).orElse(null));
        }
        if (request.getManagerId() != null) {
            member.setManager(userRepository.findById(request.getManagerId()).orElse(null));
        }
        if (request.getEndDate() != null) {
            member.setEndDate(request.getEndDate());
        }
        member.setUpdatedBy(userId);

        member = memberRepository.save(member);
        return mapMemberToResponse(member);
    }

    // RULE: Membership is never deleted — end_date marks exit
    @Transactional
    public void removeMember(Long memberId, Long userId) {
        permissionService.requirePermission(userId, "PROJECT", "UPDATE");

        ProjectMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectMember", "id", memberId));

        member.setEndDate(LocalDate.now());
        member.setUpdatedBy(userId);
        memberRepository.save(member);

        auditService.logAction("PROJECT_MEMBER", memberId, "REMOVED",
                member.getUser().getFullName(), "end_date set", userId);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(Long projectId) {
        return memberRepository.findByProjectIdAndEndDateIsNull(projectId)
                .stream().map(this::mapMemberToResponse).toList();
    }

    // ==================== MAPPERS ====================
    private ProjectResponse mapToResponse(Project p) {
        long memberCount = memberRepository.countActiveMembers(p.getId());
        return ProjectResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .description(p.getDescription())
                .statusId(p.getStatus() != null ? p.getStatus().getId() : null)
                .statusName(p.getStatus() != null ? p.getStatus().getDisplayName() : null)
                .statusCode(p.getStatus() != null ? p.getStatus().getCode() : null)
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .memberCount((int) memberCount)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private ProjectMemberResponse mapMemberToResponse(ProjectMember m) {
        return ProjectMemberResponse.builder()
                .id(m.getId())
                .userId(m.getUser().getId())
                .userName(m.getUser().getFullName())
                .userEmail(m.getUser().getEmail())
                .projectRoleId(m.getProjectRole() != null ? m.getProjectRole().getId() : null)
                .projectRoleName(m.getProjectRole() != null ? m.getProjectRole().getDisplayName() : null)
                .managerId(m.getManager() != null ? m.getManager().getId() : null)
                .managerName(m.getManager() != null ? m.getManager().getFullName() : null)
                .startDate(m.getStartDate())
                .endDate(m.getEndDate())
                .active(m.getEndDate() == null)
                .build();
    }
}
