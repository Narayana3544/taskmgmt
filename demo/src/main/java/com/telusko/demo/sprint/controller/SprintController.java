package com.telusko.demo.sprint.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.sprint.dto.CloseSprintRequest;
import com.telusko.demo.sprint.dto.SprintRequest;
import com.telusko.demo.sprint.dto.SprintResponse;
import com.telusko.demo.sprint.service.SprintService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.telusko.demo.workitem.service.WorkItemService;
import com.telusko.demo.workitem.dto.WorkItemResponse;
import java.util.List;

@RestController
@RequestMapping("/api/sprints")
public class SprintController {

    private final SprintService sprintService;
    private final WorkItemService workItemService;

    public SprintController(SprintService sprintService, WorkItemService workItemService) {
        this.sprintService = sprintService;
        this.workItemService = workItemService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SprintResponse>>> getByProject(
            @RequestParam Long projectId,
            @RequestParam(required = false) Long featureId,
            @RequestParam(required = false) String search,
            @org.springframework.data.web.PageableDefault(sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprintsByProject(projectId, featureId, search, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SprintResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprintById(id)));
    }

    @GetMapping("/{id}/overview")
    public ResponseEntity<ApiResponse<com.telusko.demo.sprint.dto.SprintOverviewResponse>> getOverview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprintOverview(id)));
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<ApiResponse<com.telusko.demo.sprint.dto.SprintDashboardResponse>> getDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprintDashboard(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SprintResponse>> create(
            @Valid @RequestBody SprintRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sprint created", sprintService.createSprint(request, userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SprintResponse>> update(
            @PathVariable Long id, @Valid @RequestBody SprintRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(sprintService.updateSprint(id, request, userId)));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<ApiResponse<SprintResponse>> start(
            @PathVariable Long id, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Sprint started", sprintService.startSprint(id, userId)));
    }

    @GetMapping("/{id}/unfinished-items")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getUnfinishedItems(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sprintService.getUnfinishedItems(id)));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<SprintResponse>> close(
            @PathVariable Long id,
            @RequestBody(required = false) CloseSprintRequest request,
            Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Sprint closed", sprintService.closeSprint(id, request, userId)));
    }

    @PostMapping("/{id}/items/{workItemId}")
    public ResponseEntity<ApiResponse<Void>> addItem(
            @PathVariable Long id, @PathVariable Long workItemId, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        sprintService.addWorkItemToSprint(id, workItemId, userId);
        return ResponseEntity.ok(ApiResponse.success("Work item added to sprint", null));
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<ApiResponse<List<WorkItemResponse>>> getSprintItems(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workItemService.getWorkItemsBySprint(id)));
    }

    @DeleteMapping("/{id}/items/{workItemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @PathVariable Long id, @PathVariable Long workItemId, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        sprintService.removeWorkItemFromSprint(id, workItemId, userId);
        return ResponseEntity.ok(ApiResponse.success("Work item removed from sprint", null));
    }
}
