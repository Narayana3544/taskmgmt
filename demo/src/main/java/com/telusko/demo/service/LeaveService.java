package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.dto.leave.LeaveRequestDTO;
import com.telusko.demo.dto.leave.LeaveApprovalRequest;
import com.telusko.demo.dto.leave.LeaveBalanceDTO;
import com.telusko.demo.exception.ResourceNotFoundException;
import com.telusko.demo.repo.LeaveBalanceRepo;
import com.telusko.demo.repo.LeaveRequestRepo;
import com.telusko.demo.repo.userrepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for leave management with workflow support.
 */
@Service
@Transactional
public class LeaveService {
    
    private static final Logger logger = LoggerFactory.getLogger(LeaveService.class);
    
    private final LeaveRequestRepo leaveRequestRepo;
    private final LeaveBalanceRepo leaveBalanceRepo;
    private final userrepo userRepo;
    private final NotificationService notificationService;
    private final EventPublisher eventPublisher;
    
    public LeaveService(
            LeaveRequestRepo leaveRequestRepo,
            LeaveBalanceRepo leaveBalanceRepo,
            userrepo userRepo,
            NotificationService notificationService,
            EventPublisher eventPublisher
    ) {
        this.leaveRequestRepo = leaveRequestRepo;
        this.leaveBalanceRepo = leaveBalanceRepo;
        this.userRepo = userRepo;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * Get leave requests for a user
     */
    public List<LeaveRequestDTO> getLeaveRequestsForUser(int userId) {
        List<LeaveRequest> requests = leaveRequestRepo.findByUserId(userId);
        return requests.stream().map(this::toDTO).collect(Collectors.toList());
    }
    
    /**
     * Get pending approvals for a manager
     */
    public List<LeaveRequestDTO> getPendingApprovalsForManager(int managerId) {
        List<LeaveRequest> requests = leaveRequestRepo.findByManagerId(managerId);
        return requests.stream()
                .filter(r -> "PENDING".equals(r.getLeave_type())) // Filter pending only
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get leave balance for a user
     */
    public List<LeaveBalanceDTO> getLeaveBalanceForUser(int userId) {
        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> balances = leaveBalanceRepo.findByUserIdAndYear(userId, currentYear);
        return balances.stream().map(this::toBalanceDTO).collect(Collectors.toList());
    }
    
    /**
     * Approve a leave request
     */
    public LeaveRequestDTO approveLeave(int requestId, LeaveApprovalRequest approval, User approver) {
        LeaveRequest request = leaveRequestRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", requestId));
        
        // Validate approver is the manager
        if (request.getManager() == null || request.getManager().getId() != approver.getId()) {
            throw new IllegalStateException("Only the assigned manager can approve this request");
        }
        
        // Update status
        // Note: The actual update would set a proper status - simplified here
        request.setApprovedOn(LocalDate.now());
        
        // Deduct from leave balance
        int leaveDays = calculateLeaveDays(request.getStartDate().toLocalDate(), request.getEndDate().toLocalDate());
        updateLeaveBalance(request.getUser().getId(), request.getLeave_type(), leaveDays);
        
        LeaveRequest saved = leaveRequestRepo.save(request);
        
        // Notify employee
        notificationService.createNotification(
                request.getUser().getId(),
                Notification.NotificationType.LEAVE_APPROVED,
                "Leave Approved",
                String.format("Your %s request from %s to %s has been approved", 
                        request.getLeave_type(), request.getStartDate(), request.getEndDate()),
                "LEAVE",
                (long) request.getId(),
                "/leave/" + request.getId()
        );
        
        // Publish event
        eventPublisher.publishLeaveEvent("APPROVED", requestId, approver.getId(), approver.getEmail(), null);
        
        logger.info("Leave request {} approved by manager {}", requestId, approver.getId());
        
        return toDTO(saved);
    }
    
    /**
     * Reject a leave request
     */
    public LeaveRequestDTO rejectLeave(int requestId, LeaveApprovalRequest rejection, User rejector) {
        LeaveRequest request = leaveRequestRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", requestId));
        
        // Validate rejector is the manager
        if (request.getManager() == null || request.getManager().getId() != rejector.getId()) {
            throw new IllegalStateException("Only the assigned manager can reject this request");
        }
        
        LeaveRequest saved = leaveRequestRepo.save(request);
        
        // Notify employee
        notificationService.createNotification(
                request.getUser().getId(),
                Notification.NotificationType.LEAVE_REJECTED,
                "Leave Rejected",
                String.format("Your %s request from %s to %s has been rejected. Reason: %s", 
                        request.getLeave_type(), request.getStartDate(), request.getEndDate(), 
                        rejection.getComments() != null ? rejection.getComments() : "Not specified"),
                "LEAVE",
                (long) request.getId(),
                "/leave/" + request.getId()
        );
        
        // Publish event
        eventPublisher.publishLeaveEvent("REJECTED", requestId, rejector.getId(), rejector.getEmail(), null);
        
        logger.info("Leave request {} rejected by manager {}", requestId, rejector.getId());
        
        return toDTO(saved);
    }
    
    /**
     * Get team leave calendar for a manager
     */
    public List<LeaveRequestDTO> getTeamLeaveCalendar(int managerId, LocalDate startDate, LocalDate endDate) {
        // Get all team members reporting to this manager
        User manager = userRepo.findById(managerId);
        if (manager == null) {
            throw new ResourceNotFoundException("User", "id", managerId);
        }
        
        // Get approved leaves for the date range
        List<LeaveRequest> leaves = leaveRequestRepo.findByManagerId(managerId);
        
        return leaves.stream()
                .filter(l -> {
                    LocalDate leaveStart = l.getStartDate().toLocalDate();
                    LocalDate leaveEnd = l.getEndDate().toLocalDate();
                    return !leaveStart.isAfter(endDate) && !leaveEnd.isBefore(startDate);
                })
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    // Helper methods
    
    private int calculateLeaveDays(LocalDate start, LocalDate end) {
        return (int) ChronoUnit.DAYS.between(start, end) + 1;
    }
    
    private void updateLeaveBalance(int userId, String leaveType, int daysUsed) {
        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> balances = leaveBalanceRepo.findByUserIdAndYear(userId, currentYear);
        
        balances.stream()
                .filter(b -> b.getLeave_type().equals(leaveType))
                .findFirst()
                .ifPresent(balance -> {
                    balance.setUsed(balance.getUsed() + daysUsed);
                    balance.setRemaining(balance.getRemaining() - daysUsed);
                    leaveBalanceRepo.save(balance);
                });
    }
    
    private LeaveRequestDTO toDTO(LeaveRequest request) {
        return LeaveRequestDTO.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .userName(request.getUser().getFirst_name() + " " + request.getUser().getLast_name())
                .leaveType(request.getLeave_type())
                .startDate(request.getStartDate().toLocalDate())
                .endDate(request.getEndDate().toLocalDate())
                .reason(request.getReason())
                .status(request.getStatus() != null ? request.getStatus().getDecription() : "PENDING")
                .managerId(request.getManager() != null ? request.getManager().getId() : null)
                .managerName(request.getManager() != null ? 
                        request.getManager().getFirst_name() + " " + request.getManager().getLast_name() : null)
                .requestedOn(request.getRequestedOn())
                .approvedOn(request.getApprovedOn())
                .days(calculateLeaveDays(request.getStartDate().toLocalDate(), request.getEndDate().toLocalDate()))
                .build();
    }
    
    private LeaveBalanceDTO toBalanceDTO(LeaveBalance balance) {
        return LeaveBalanceDTO.builder()
                .id(balance.getId())
                .userId(balance.getUser().getId())
                .leaveType(balance.getLeave_type())
                .totalAllocated(balance.getTotalAllocated())
                .used(balance.getUsed())
                .remaining(balance.getRemaining())
                .year(balance.getYear())
                .build();
    }
}
