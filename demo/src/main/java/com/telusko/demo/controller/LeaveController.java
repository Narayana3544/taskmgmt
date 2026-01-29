package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.dto.leave.LeaveApprovalRequest;
import com.telusko.demo.dto.leave.LeaveBalanceDTO;
import com.telusko.demo.dto.leave.LeaveRequestDTO;
import com.telusko.demo.service.LeaveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller for leave management with manager approval workflow.
 */
@RestController
@RequestMapping("/api/leave")
public class LeaveController {
    
    private static final Logger logger = LoggerFactory.getLogger(LeaveController.class);
    
    private final LeaveService leaveService;
    
    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }
    
    /**
     * Get leave requests for the current user
     */
    @GetMapping("/my-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LeaveRequestDTO>> getMyLeaveRequests(@AuthenticationPrincipal User user) {
        List<LeaveRequestDTO> requests = leaveService.getLeaveRequestsForUser(user.getId());
        return ResponseEntity.ok(requests);
    }
    
    /**
     * Get current user's leave balance
     */
    @GetMapping("/balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LeaveBalanceDTO>> getMyLeaveBalance(@AuthenticationPrincipal User user) {
        List<LeaveBalanceDTO> balances = leaveService.getLeaveBalanceForUser(user.getId());
        return ResponseEntity.ok(balances);
    }
    
    /**
     * Get leave balance for a specific user (manager or admin only)
     */
    @GetMapping("/balance/{userId}")
    @PreAuthorize("hasPermission(#userId, 'USER', 'MANAGE')")
    public ResponseEntity<List<LeaveBalanceDTO>> getUserLeaveBalance(@PathVariable int userId) {
        List<LeaveBalanceDTO> balances = leaveService.getLeaveBalanceForUser(userId);
        return ResponseEntity.ok(balances);
    }
    
    /**
     * Get pending leave approvals for manager
     */
    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveRequestDTO>> getPendingApprovals(@AuthenticationPrincipal User manager) {
        List<LeaveRequestDTO> requests = leaveService.getPendingApprovalsForManager(manager.getId());
        return ResponseEntity.ok(requests);
    }
    
    /**
     * Approve a leave request
     */
    @PostMapping("/{requestId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<LeaveRequestDTO> approveLeave(
            @PathVariable int requestId,
            @RequestBody LeaveApprovalRequest approval,
            @AuthenticationPrincipal User manager
    ) {
        logger.info("Manager {} approving leave request {}", manager.getId(), requestId);
        LeaveRequestDTO result = leaveService.approveLeave(requestId, approval, manager);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Reject a leave request
     */
    @PostMapping("/{requestId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<LeaveRequestDTO> rejectLeave(
            @PathVariable int requestId,
            @RequestBody LeaveApprovalRequest rejection,
            @AuthenticationPrincipal User manager
    ) {
        logger.info("Manager {} rejecting leave request {}", manager.getId(), requestId);
        LeaveRequestDTO result = leaveService.rejectLeave(requestId, rejection, manager);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get team leave calendar for a date range
     */
    @GetMapping("/team-calendar")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<LeaveRequestDTO>> getTeamLeaveCalendar(
            @AuthenticationPrincipal User manager,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<LeaveRequestDTO> leaves = leaveService.getTeamLeaveCalendar(manager.getId(), startDate, endDate);
        return ResponseEntity.ok(leaves);
    }
}
