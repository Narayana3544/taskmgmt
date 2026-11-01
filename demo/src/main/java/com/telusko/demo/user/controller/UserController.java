package com.telusko.demo.user.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.user.dto.UserRequest;
import com.telusko.demo.user.dto.UserResponse;
import com.telusko.demo.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsersByOrg(
            @RequestParam Long orgId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByOrganization(orgId, pageable)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(org.springframework.security.core.Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(userId)));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserResponse>> updateAvatar(
            @RequestBody java.util.Map<String, String> body, org.springframework.security.core.Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Avatar updated", userService.updateAvatar(userId, body.get("profileImageUrl"))));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created", userService.createUser(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping("/hierarchy")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> getHierarchy(
            @RequestParam(required = false, defaultValue = "1") Long orgId) {
        return ResponseEntity.ok(ApiResponse.success(userService.getHierarchyByOrganization(orgId)));
    }

    @GetMapping("/{id}/reporting-chain")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getReportingChain(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserReportingChain(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated", userService.updateUser(id, request)));
    }
}
