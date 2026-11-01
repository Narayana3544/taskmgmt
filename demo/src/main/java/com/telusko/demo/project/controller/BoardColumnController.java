package com.telusko.demo.project.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.project.dto.BoardColumnRequest;
import com.telusko.demo.project.dto.BoardColumnResponse;
import com.telusko.demo.project.service.BoardColumnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/columns")
@RequiredArgsConstructor
@Slf4j
public class BoardColumnController {

    private final BoardColumnService boardColumnService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BoardColumnResponse>>> getColumns(@PathVariable Long projectId) {
        log.info("GET /api/projects/{}/columns", projectId);
        List<BoardColumnResponse> columns = boardColumnService.getColumnsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(columns));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BoardColumnResponse>> createColumn(
            @PathVariable Long projectId,
            @Valid @RequestBody BoardColumnRequest request) {
        log.info("POST /api/projects/{}/columns - name='{}'", projectId, request.getName());
        BoardColumnResponse column = boardColumnService.createColumn(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Column created", column));
    }

    @PutMapping("/{columnId}")
    public ResponseEntity<ApiResponse<BoardColumnResponse>> updateColumn(
            @PathVariable Long projectId,
            @PathVariable Long columnId,
            @Valid @RequestBody BoardColumnRequest request) {
        log.info("PUT /api/projects/{}/columns/{} - name='{}'", projectId, columnId, request.getName());
        BoardColumnResponse column = boardColumnService.updateColumn(projectId, columnId, request);
        return ResponseEntity.ok(ApiResponse.success("Column updated", column));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<List<BoardColumnResponse>>> reorderColumns(
            @PathVariable Long projectId,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> columnIds = body.get("columnIds");
        log.info("PUT /api/projects/{}/columns/reorder - count={}", projectId, columnIds != null ? columnIds.size() : 0);
        List<BoardColumnResponse> columns = boardColumnService.reorderColumns(projectId, columnIds);
        return ResponseEntity.ok(ApiResponse.success("Columns reordered", columns));
    }

    @DeleteMapping("/{columnId}")
    public ResponseEntity<ApiResponse<Void>> deleteColumn(
            @PathVariable Long projectId,
            @PathVariable Long columnId,
            @RequestParam(required = false) Long targetColumnId) {
        log.info("DELETE /api/projects/{}/columns/{} - targetColumnId={}", projectId, columnId, targetColumnId);
        boardColumnService.deleteColumn(projectId, columnId, targetColumnId);
        return ResponseEntity.ok(ApiResponse.success("Column deleted", null));
    }
}

