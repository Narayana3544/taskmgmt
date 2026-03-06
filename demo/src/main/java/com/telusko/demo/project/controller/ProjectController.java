package com.telusko.demo.project.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.project.dto.ProjectMemberRequest;
import com.telusko.demo.project.dto.ProjectMemberResponse;
import com.telusko.demo.project.dto.ProjectRequest;
import com.telusko.demo.project.dto.ProjectResponse;
import com.telusko.demo.project.service.ProjectService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private static final Logger log = LoggerFactory.getLogger(ProjectController.class);

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProjectResponse>>> getAll(
            @RequestParam Long orgId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjects(orgId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
            @RequestParam Long orgId, @Valid @RequestBody ProjectRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created", projectService.createProject(request, orgId, userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ProjectRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(projectService.updateProject(id, request, userId)));
    }

    // === Members ===
    @GetMapping("/{projectId}/members")
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectMembers(projectId)));
    }

    @PostMapping("/members")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addMember(
            @Valid @RequestBody ProjectMemberRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Member added", projectService.addMember(request, userId)));
    }

    @PutMapping("/members/{memberId}")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> updateMember(
            @PathVariable Long memberId, @RequestBody ProjectMemberRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(projectService.updateMember(memberId, request, userId)));
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long memberId, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        projectService.removeMember(memberId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed (end-dated)", null));
    }
}
