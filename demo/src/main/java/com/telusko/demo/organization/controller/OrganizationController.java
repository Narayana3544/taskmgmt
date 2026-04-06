package com.telusko.demo.organization.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.organization.dto.OrganizationRequest;
import com.telusko.demo.organization.dto.OrganizationResponse;
import com.telusko.demo.organization.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> getOrganization(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getOrganization(id)));
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationResponse>> updateOrganization(
            @PathVariable Long id, @Valid @RequestBody OrganizationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Organization updated sequentially", organizationService.updateOrganization(id, request)));
    }
}
