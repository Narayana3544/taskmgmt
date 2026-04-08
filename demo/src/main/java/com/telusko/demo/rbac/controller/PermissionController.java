package com.telusko.demo.rbac.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.rbac.dto.PermissionDto;
import com.telusko.demo.rbac.dto.PermissionRequest;
import com.telusko.demo.rbac.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PermissionDto>>> getPermissionsByRoleCode(
            @RequestParam String roleCode) {
        return ResponseEntity.ok(ApiResponse.success(permissionService.getPermissionsByRoleCode(roleCode)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> savePermissions(@RequestBody PermissionRequest request) {
        permissionService.savePermissions(request.getRoleCode(), request.getPermissions());
        return ResponseEntity.ok(ApiResponse.success("Permissions updated successfully", null));
    }
}
