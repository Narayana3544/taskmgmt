package com.telusko.demo.timesheet.service;

import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.timesheet.dto.CreateTimesheetEntryRequest;
import com.telusko.demo.timesheet.dto.CreateTimesheetRequest;
import com.telusko.demo.timesheet.dto.TimesheetEntryResponse;
import com.telusko.demo.timesheet.dto.TimesheetResponse;
import com.telusko.demo.timesheet.entity.Timesheet;
import com.telusko.demo.timesheet.entity.TimesheetEntry;
import com.telusko.demo.timesheet.repository.TimesheetEntryRepository;
import com.telusko.demo.timesheet.repository.TimesheetRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import com.telusko.demo.workitem.entity.WorkItem;
import com.telusko.demo.workitem.repository.WorkItemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TimesheetService {

    private final TimesheetRepository timesheetRepository;
    private final TimesheetEntryRepository timesheetEntryRepository;
    private final UserRepository userRepository;
    private final MasterValueRepository masterValueRepository;
    private final WorkItemRepository workItemRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public TimesheetService(TimesheetRepository timesheetRepository,
                            TimesheetEntryRepository timesheetEntryRepository,
                            UserRepository userRepository,
                            MasterValueRepository masterValueRepository,
                            WorkItemRepository workItemRepository) {
        this.timesheetRepository = timesheetRepository;
        this.timesheetEntryRepository = timesheetEntryRepository;
        this.userRepository = userRepository;
        this.masterValueRepository = masterValueRepository;
        this.workItemRepository = workItemRepository;
    }

    @Transactional(readOnly = true)
    public TimesheetResponse getTimesheetByDate(Long userId, LocalDate date) {
        return timesheetRepository.findByUserIdAndWorkDateAndActiveTrue(userId, date)
                .map(this::mapToResponse)
                .orElse(null);
    }
    
    @Transactional(readOnly = true)
    public TimesheetResponse getTimesheetById(Long id) {
        return timesheetRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet", "id", id));
    }

    @Transactional
    public TimesheetResponse createTimesheet(CreateTimesheetRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getWorkDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("Cannot create timesheets for future dates");
        }
        if (request.getWorkDate().isBefore(LocalDate.now().minusDays(2))) {
            throw new BadRequestException("Timesheet is locked. You can only create or edit timesheets up to 2 days old.");
        }

        MasterValue draftStatus = getMasterValue("TIMESHEET_STATUS", "DRAFT");

        Timesheet timesheet = timesheetRepository.findByUserIdAndWorkDateAndActiveTrue(userId, request.getWorkDate())
                .orElseGet(() -> {
                    Timesheet ts = Timesheet.builder()
                            .user(user)
                            .workDate(request.getWorkDate())
                            .status(draftStatus)
                            .build();
                    return timesheetRepository.save(ts);
                });

        return mapToResponse(timesheet);
    }

    @Transactional
    public TimesheetResponse addEntry(Long timesheetId, CreateTimesheetEntryRequest request, Long userId) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet", "id", timesheetId));

        if (!timesheet.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only add entries to your own timesheet");
        }

        if (!"DRAFT".equals(timesheet.getStatus().getCode()) && !"REJECTED".equals(timesheet.getStatus().getCode())) {
            throw new BadRequestException("Entries can only be added to DRAFT or REJECTED timesheets");
        }

        LocalDate workDate = timesheet.getWorkDate();
        if (workDate.isAfter(LocalDate.now())) {
            throw new BadRequestException("Cannot add entries for future dates");
        }
        if (workDate.isBefore(LocalDate.now().minusDays(2))) {
            throw new BadRequestException("Timesheet is locked. You can only edit timesheets up to 2 days old.");
        }

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new BadRequestException("End time cannot be before start time");
        }

        int durationMinutes = (int) ChronoUnit.MINUTES.between(request.getStartTime(), request.getEndTime());

        WorkItem workItem = null;
        if ("WORK".equals(request.getEntryType()) && request.getWorkItemId() != null) {
            workItem = workItemRepository.findById(request.getWorkItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkItem", "id", request.getWorkItemId()));
        }

        TimesheetEntry entry = TimesheetEntry.builder()
                .timesheet(timesheet)
                .entryType(request.getEntryType())
                .workItem(workItem)
                .startTime(request.getStartTime().atDate(timesheet.getWorkDate()))
                .endTime(request.getEndTime().atDate(timesheet.getWorkDate()))
                .durationMinutes(durationMinutes)
                .description(request.getNotes())
                .createdBy(userId)
                .build();

        timesheetEntryRepository.save(entry);
        
        // If it was rejected, adding an entry flips it back to draft
        if ("REJECTED".equals(timesheet.getStatus().getCode())) {
            timesheet.setStatus(getMasterValue("TIMESHEET_STATUS", "DRAFT"));
            timesheetRepository.save(timesheet);
        }

        return mapToResponse(timesheet);
    }

    @Transactional
    public TimesheetResponse submitTimesheet(Long timesheetId, Long userId) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet", "id", timesheetId));

        if (!timesheet.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only submit your own timesheet");
        }

        if (timesheet.getWorkDate().isBefore(LocalDate.now().minusDays(2))) {
            throw new BadRequestException("Timesheet is locked and can no longer be submitted.");
        }

        timesheet.setStatus(getMasterValue("TIMESHEET_STATUS", "SUBMITTED"));
        timesheet.setSubmittedAt(LocalDateTime.now());
        
        return mapToResponse(timesheetRepository.save(timesheet));
    }

    @Transactional(readOnly = true)
    public PageResponse<TimesheetResponse> getPendingApprovals(Long managerId, Pageable pageable) {
        User manager = userRepository.findById(managerId).orElse(null);
        boolean isAdmin = manager != null && manager.getRole() != null && "ADMIN".equals(manager.getRole().getCode());

        Page<Timesheet> page = isAdmin
                ? timesheetRepository.findAllPendingApprovals(pageable)
                : timesheetRepository.findPendingApprovalsByManager(managerId, pageable);

        return PageResponse.<TimesheetResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<com.telusko.demo.timesheet.dto.UserTimesheetOverviewDto> getTimesheetOverview(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<com.telusko.demo.timesheet.dto.UserTimesheetOverviewDto> page = timesheetRepository.findUserTimesheetOverview(startDate, endDate, pageable);
        return PageResponse.<com.telusko.demo.timesheet.dto.UserTimesheetOverviewDto>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<TimesheetResponse> getUserTimesheetsReport(Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<Timesheet> page = timesheetRepository.findTimesheetsByUserAndDateRange(userId, startDate, endDate, pageable);
        return PageResponse.<TimesheetResponse>builder()
                .content(page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<com.telusko.demo.timesheet.dto.TimesheetEntryReportResponse> getTimesheetEntriesReport(
            LocalDate startDate, LocalDate endDate, Long projectId, Long targetUserId, String userName, Pageable pageable) {
        
        String safeUserName = userName == null ? "" : userName;

        Page<TimesheetEntry> page = timesheetEntryRepository.findTimesheetEntriesReport(
                startDate, endDate, projectId, targetUserId, safeUserName, pageable);

        return PageResponse.<com.telusko.demo.timesheet.dto.TimesheetEntryReportResponse>builder()
                .content(page.getContent().stream().map(e -> com.telusko.demo.timesheet.dto.TimesheetEntryReportResponse.builder()
                        .entryId(e.getId())
                        .userId(e.getTimesheet().getUser().getId())
                        .userName(e.getTimesheet().getUser().getFullName())
                        .userEmail(e.getTimesheet().getUser().getEmail())
                        .workDate(e.getTimesheet().getWorkDate())
                        .entryType(e.getEntryType())
                        .workItemId(e.getWorkItem() != null ? e.getWorkItem().getId() : null)
                        .workItemTitle(e.getWorkItem() != null ? e.getWorkItem().getTitle() : null)
                        .projectId(e.getWorkItem() != null && e.getWorkItem().getProject() != null ? e.getWorkItem().getProject().getId() : null)
                        .projectName(e.getWorkItem() != null && e.getWorkItem().getProject() != null ? e.getWorkItem().getProject().getName() : null)
                        .startTime(e.getStartTime().format(TIME_FORMATTER))
                        .endTime(e.getEndTime() != null ? e.getEndTime().format(TIME_FORMATTER) : null)
                        .durationMinutes(e.getDurationMinutes())
                        .approvalStatusCode(e.getApprovalStatus() != null ? e.getApprovalStatus().getCode() : null)
                        .approvalStatusName(e.getApprovalStatus() != null ? e.getApprovalStatus().getDisplayName() : null)
                        .description(e.getDescription())
                        .build()).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional
    public TimesheetResponse processApproval(Long timesheetId, boolean approve, String comment, Long managerId) {
        Timesheet timesheet = timesheetRepository.findById(timesheetId)
                .orElseThrow(() -> new ResourceNotFoundException("Timesheet", "id", timesheetId));

        if (!"SUBMITTED".equals(timesheet.getStatus().getCode())) {
            throw new BadRequestException("Only SUBMITTED timesheets can be processed");
        }

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", managerId));

        String newStatusCode = approve ? "APPROVED" : "REJECTED";
        timesheet.setStatus(getMasterValue("TIMESHEET_STATUS", newStatusCode));
        timesheet.setApprovedBy(manager);
        timesheet.setApprovedAt(LocalDateTime.now());
        // For actual enterprise systems, saving the comment in a history table is preferred.
        // Doing minimal impact update.
        
        return mapToResponse(timesheetRepository.save(timesheet));
    }

    private MasterValue getMasterValue(String typeCode, String code) {
        return masterValueRepository.findByMasterTypeCodeAndCode(typeCode, code)
                .orElseThrow(() -> new BadRequestException("Master value " + code + " not found for type " + typeCode));
    }

    private TimesheetResponse mapToResponse(Timesheet t) {
        List<TimesheetEntry> entries = timesheetEntryRepository.findByTimesheetIdOrderByStartTimeAsc(t.getId());
        
        int totalMin = entries.stream().mapToInt(TimesheetEntry::getDurationMinutes).sum();
        double hours = totalMin / 60.0;

        List<TimesheetEntryResponse> entryResponses = entries.stream().map(e -> TimesheetEntryResponse.builder()
                .id(e.getId())
                .timesheetId(t.getId())
                .entryType(e.getEntryType())
                .workItemId(e.getWorkItem() != null ? e.getWorkItem().getId() : null)
                .workItemTitle(e.getWorkItem() != null ? e.getWorkItem().getTitle() : null)
                .startTime(e.getStartTime().format(TIME_FORMATTER))
                .endTime(e.getEndTime() != null ? e.getEndTime().format(TIME_FORMATTER) : null)
                .durationMinutes(e.getDurationMinutes())
                .approvalStatusCode(e.getApprovalStatus() != null ? e.getApprovalStatus().getCode() : null)
                .approvalStatusName(e.getApprovalStatus() != null ? e.getApprovalStatus().getDisplayName() : null)
                .description(e.getDescription())
                .notes(e.getDescription())
                .createdAt(e.getCreatedAt())
                .build()).collect(Collectors.toList());

        return TimesheetResponse.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .userName(t.getUser().getFullName())
                .workDate(t.getWorkDate())
                .statusId(t.getStatus().getId())
                .statusCode(t.getStatus().getCode())
                .statusName(t.getStatus().getDisplayName())
                .submittedAt(t.getSubmittedAt())
                .approvedAt(t.getApprovedAt())
                .approvedById(t.getApprovedBy() != null ? t.getApprovedBy().getId() : null)
                .approvedByName(t.getApprovedBy() != null ? t.getApprovedBy().getFullName() : null)
                .entries(entryResponses)
                .entryCount(entryResponses.size())
                .totalHours(String.format("%.1f", hours))
                .build();
    }
}
