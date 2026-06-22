package com.telusko.demo.feature.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.feature.dto.FeatureRequest;
import com.telusko.demo.feature.dto.FeatureResponse;
import com.telusko.demo.feature.service.FeatureService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/features")
public class FeatureController {

    private final FeatureService featureService;

    public FeatureController(FeatureService featureService) {
        this.featureService = featureService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeatureResponse>> create(
            @Valid @RequestBody FeatureRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feature created", featureService.createFeature(request, userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureResponse>> update(
            @PathVariable Long id, @Valid @RequestBody FeatureRequest request, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(featureService.updateFeature(id, request, userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FeatureResponse>> getById(
            @PathVariable Long id, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(featureService.getFeatureById(id, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<FeatureResponse>>> listByProject(
            @RequestParam Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long statusId,
            @org.springframework.data.web.PageableDefault(sort = "createdAt",
                    direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable,
            Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(
                featureService.listFeaturesByProject(projectId, search, statusId, pageable, userId)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<FeatureResponse>>> getActive(
            @RequestParam Long projectId, Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(
                featureService.getActiveFeaturesForProject(projectId, userId)));
    }
}
