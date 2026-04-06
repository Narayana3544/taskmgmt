package com.telusko.demo.leave.service;

import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.leave.dto.CreateLeaveRequest;
import com.telusko.demo.leave.dto.LeaveBalanceResponse;
import com.telusko.demo.leave.dto.LeaveResponse;
import com.telusko.demo.leave.entity.LeaveApprovalHistory;
import com.telusko.demo.leave.entity.LeaveBalance;
import com.telusko.demo.leave.entity.LeaveRequest;
import com.telusko.demo.leave.repository.LeaveApprovalHistoryRepository;
import com.telusko.demo.leave.repository.LeaveBalanceRepository;
import com.telusko.demo.leave.repository.LeaveRequestRepository;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveApprovalHistoryRepository leaveApprovalHistoryRepository;
    private final UserRepository userRepository;
    private final MasterValueRepository masterValueRepository;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        LeaveBalanceRepository leaveBalanceRepository,
                        LeaveApprovalHistoryRepository leaveApprovalHistoryRepository,
                        UserRepository userRepository,
                        MasterValueRepository masterValueRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leaveApprovalHistoryRepository = leaveApprovalHistoryRepository;
        this.userRepository = userRepository;
        this.masterValueRepository = masterValueRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaveResponse> getMyLeaves(Long userId, Pageable pageable) {
        Page<LeaveRequest> page = leaveRequestRepository.findByUserIdAndActiveTrueOrderByStartDateDesc(userId, pageable);
        return buildPageResponse(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaveResponse> getTeamLeaves(Long managerId, Pageable pageable) {
        User manager = userRepository.findById(managerId).orElse(null);
        boolean isAdmin = manager != null && manager.getRole() != null && "ADMIN".equals(manager.getRole().getCode());

        Page<LeaveRequest> page = isAdmin
                ? leaveRequestRepository.findAllPendingLeaves(pageable)
                : leaveRequestRepository.findPendingTeamLeaves(managerId, pageable);

        return buildPageResponse(page);
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceResponse> getMyBalances(Long userId) {
        int currentYear = LocalDate.now().getYear();
        List<LeaveBalance> balances = leaveBalanceRepository.findByUserIdAndYearAndActiveTrue(userId, currentYear);
        return balances.stream().map(b -> LeaveBalanceResponse.builder()
                .id(b.getId())
                .leaveTypeId(b.getLeaveType().getId())
                .leaveTypeCode(b.getLeaveType().getCode())
                .leaveTypeName(b.getLeaveType().getDisplayName())
                .year(b.getYear())
                .total(b.getOpeningBalance())
                .used(b.getUsedBalance())
                .available(b.getRemainingBalance())
                .build()).toList();
    }

    @Transactional
    public LeaveResponse submitLeaveRequest(CreateLeaveRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        MasterValue leaveType = masterValueRepository.findById(request.getLeaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("LeaveType", "id", request.getLeaveTypeId()));

        MasterValue appliedStatus = masterValueRepository.findByMasterTypeCodeAndCode("LEAVE_STATUS", "APPLIED")
                .orElseThrow(() -> new BadRequestException("APPLIED status missing from master data"));

        // Check date logic
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }

        int year = request.getStartDate().getYear();
        
        // Auto-create balance if it doesn't exist
        LeaveBalance balance = leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYearAndActiveTrue(user.getId(), leaveType.getId(), year)
                .orElseGet(() -> {
                    LeaveBalance nb = LeaveBalance.builder()
                            .user(user)
                            .leaveType(leaveType)
                            .year(year)
                            .openingBalance(new BigDecimal("15")) // Sample default allocation
                            .usedBalance(BigDecimal.ZERO)
                            .remainingBalance(new BigDecimal("15"))
                            .build();
                    return leaveBalanceRepository.save(nb);
                });

        if (balance.getRemainingBalance().compareTo(request.getLeaveDays()) < 0) {
            throw new BadRequestException("Insufficient leave balance. You only have " + balance.getRemainingBalance() + " days left.");
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .user(user)
                .leaveType(leaveType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .leaveDays(request.getLeaveDays())
                .reason(request.getReason())
                .status(appliedStatus)
                .build();

        leaveRequest = leaveRequestRepository.save(leaveRequest);

        recordHistory(leaveRequest, null, appliedStatus, "Initial Application", user);

        return mapToResponse(leaveRequest);
    }

    @Transactional
    public LeaveResponse approveOrRejectLeave(Long leaveId, boolean approve, String comment, Long managerId) {
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", "id", leaveId));

        if (!"APPLIED".equals(leave.getStatus().getCode())) {
            throw new BadRequestException("Only APPLIED leaves can be modified");
        }

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", managerId));

        String newStatusCode = approve ? "APPROVED" : "REJECTED";
        MasterValue newStatus = masterValueRepository.findByMasterTypeCodeAndCode("LEAVE_STATUS", newStatusCode)
                .orElseThrow(() -> new BadRequestException(newStatusCode + " status missing from master data"));

        MasterValue oldStatus = leave.getStatus();
        leave.setStatus(newStatus);
        leave.setApprovedBy(manager);
        leave.setApprovedAt(LocalDateTime.now());
        leave.setUpdatedBy(managerId);

        // Deduct balance on approval
        if (approve) {
            int year = leave.getStartDate().getYear();
            LeaveBalance balance = leaveBalanceRepository.findByUserIdAndLeaveTypeIdAndYearAndActiveTrue(leave.getUser().getId(), leave.getLeaveType().getId(), year)
                    .orElseThrow(() -> new BadRequestException("Leave balance record not found"));

            balance.setUsedBalance(balance.getUsedBalance().add(leave.getLeaveDays()));
            balance.setRemainingBalance(balance.getOpeningBalance().subtract(balance.getUsedBalance()));
            leaveBalanceRepository.save(balance);
        }

        leave = leaveRequestRepository.save(leave);
        recordHistory(leave, oldStatus, newStatus, comment, manager);

        return mapToResponse(leave);
    }

    private void recordHistory(LeaveRequest leave, MasterValue oldStatus, MasterValue newStatus, String comment, User user) {
        LeaveApprovalHistory h = LeaveApprovalHistory.builder()
                .leaveRequest(leave)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .comment(comment)
                .actionBy(user)
                .build();
        leaveApprovalHistoryRepository.save(h);
    }

    private PageResponse<LeaveResponse> buildPageResponse(Page<LeaveRequest> page) {
        return PageResponse.<LeaveResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private LeaveResponse mapToResponse(LeaveRequest l) {
        return LeaveResponse.builder()
                .id(l.getId())
                .userId(l.getUser().getId())
                .userName(l.getUser().getFullName())
                .leaveTypeId(l.getLeaveType() != null ? l.getLeaveType().getId() : null)
                .leaveTypeCode(l.getLeaveType() != null ? l.getLeaveType().getCode() : null)
                .leaveTypeName(l.getLeaveType() != null ? l.getLeaveType().getDisplayName() : null)
                .startDate(l.getStartDate())
                .endDate(l.getEndDate())
                .leaveDays(l.getLeaveDays())
                .reason(l.getReason())
                .statusId(l.getStatus() != null ? l.getStatus().getId() : null)
                .statusCode(l.getStatus() != null ? l.getStatus().getCode() : null)
                .statusName(l.getStatus() != null ? l.getStatus().getDisplayName() : null)
                .approvedById(l.getApprovedBy() != null ? l.getApprovedBy().getId() : null)
                .approvedByName(l.getApprovedBy() != null ? l.getApprovedBy().getFullName() : null)
                .approvedAt(l.getApprovedAt())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
