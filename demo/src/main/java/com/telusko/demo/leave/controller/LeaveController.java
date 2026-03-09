package com.telusko.demo.leave.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.leave.dto.CreateLeaveRequest;
import com.telusko.demo.leave.dto.LeaveApprovalRequest;
import com.telusko.demo.leave.dto.LeaveBalanceResponse;
import com.telusko.demo.leave.dto.LeaveResponse;
import com.telusko.demo.leave.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> getMyLeaves(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.valueOf(auth.getName());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(leaveService.getMyLeaves(userId, pageable)));
    }

    @GetMapping("/team")
    public ResponseEntity<ApiResponse<PageResponse<LeaveResponse>>> getTeamLeaves(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long managerId = Long.valueOf(auth.getName());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(leaveService.getTeamLeaves(managerId, pageable)));
    }

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<List<LeaveBalanceResponse>>> getMyBalances(Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(leaveService.getMyBalances(userId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LeaveResponse>> submitLeaveRequest(Authentication auth, @Valid @RequestBody CreateLeaveRequest request) {
        Long userId = Long.valueOf(auth.getName());
        request.setUserId(userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave applied successfully", leaveService.submitLeaveRequest(request)));
    }

    @PutMapping("/{id}/{action}")
    public ResponseEntity<ApiResponse<LeaveResponse>> processLeaveApproval(
            @PathVariable Long id,
            @PathVariable String action,
            Authentication auth,
            @RequestBody(required = false) LeaveApprovalRequest request) {

        Long managerId = Long.valueOf(auth.getName());
        boolean approve = "approve".equalsIgnoreCase(action);
        String comment = request != null ? request.getComment() : null;
        
        return ResponseEntity.ok(ApiResponse.success(
                "Leave " + (approve ? "approved" : "rejected") + " successfully",
                leaveService.approveOrRejectLeave(id, approve, comment, managerId)
        ));
    }
}
