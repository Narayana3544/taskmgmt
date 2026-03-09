package com.telusko.demo.workitem.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.workitem.dto.WorkItemRequest;
import com.telusko.demo.workitem.dto.WorkItemResponse;
import com.telusko.demo.workitem.entity.WorkItemComment;
import com.telusko.demo.workitem.entity.WorkItemHistory;
import com.telusko.demo.workitem.service.WorkItemService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/work-items")
public class WorkItemController {

    private static final Logger log = LoggerFactory.getLogger(WorkItemController.class);

    private final WorkItemService workItemService;

    public WorkItemController(WorkItemService workItemService) {
        this.workItemService = workItemService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkItemResponse>> create(
            @Valid @RequestBody WorkItemRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        log.info("POST /api/work-items - title: {}", request.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Work item created", workItemService.createWorkItem(request, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<WorkItemResponse>>> getByProject(
            @RequestParam Long projectId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(workItemService.getWorkItemsByProject(projectId, pageable)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<WorkItemResponse>>> getMyItems(
            Authentication auth, Pageable pageable) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(workItemService.getMyWorkItems(userId, pageable)));
    }

    @GetMapping("/backlog")
    public ResponseEntity<ApiResponse<List<WorkItemResponse>>> getBacklog(@RequestParam Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(workItemService.getBacklogItems(projectId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkItemResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workItemService.getWorkItemById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkItemResponse>> update(
            @PathVariable Long id, @Valid @RequestBody WorkItemRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(workItemService.updateWorkItem(id, request, userId)));
    }

    // Quick Assign
    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Void>> assign(
            @PathVariable Long id, @RequestBody Map<String, Long> body, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        workItemService.assignWorkItem(id, body.get("assigneeId"), userId);
        return ResponseEntity.ok(ApiResponse.success("Assigned successfully", null));
    }

    // Quick Status Update
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        workItemService.updateWorkItemStatus(id, body.get("statusCode"), userId);
        return ResponseEntity.ok(ApiResponse.success("Status updated", null));
    }

    // Handoff to Owner — mandatory comment
    @PostMapping("/{id}/handoff")
    public ResponseEntity<ApiResponse<WorkItemResponse>> handoff(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        String comment = body.get("comment");
        return ResponseEntity.ok(ApiResponse.success("Handed off to owner",
                workItemService.handoffToOwner(id, comment, userId)));
    }

    // Comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<Void>> addComment(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        workItemService.addComment(id, body.get("content"), userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", null));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workItemService.getComments(id)));
    }

    // History
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workItemService.getHistory(id)));
    }
}
