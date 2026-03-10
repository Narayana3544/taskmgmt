package com.telusko.demo.timesheet.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.dto.PageResponse;
import com.telusko.demo.timesheet.dto.CreateTimesheetEntryRequest;
import com.telusko.demo.timesheet.dto.CreateTimesheetRequest;
import com.telusko.demo.timesheet.dto.TimesheetApprovalRequest;
import com.telusko.demo.timesheet.dto.TimesheetResponse;
import com.telusko.demo.timesheet.service.TimesheetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/timesheets")
public class TimesheetController {

    private final TimesheetService timesheetService;

    public TimesheetController(TimesheetService timesheetService) {
        this.timesheetService = timesheetService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<TimesheetResponse>> getTimesheetByDate(
            Authentication auth,
            @RequestParam LocalDate date) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success(timesheetService.getTimesheetByDate(userId, date)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimesheetResponse>> getTimesheetById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(timesheetService.getTimesheetById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimesheetResponse>> createTimesheet(
            Authentication auth,
            @Valid @RequestBody CreateTimesheetRequest request) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Timesheet created", timesheetService.createTimesheet(request, userId)));
    }

    @PostMapping("/{id}/entries")
    public ResponseEntity<ApiResponse<TimesheetResponse>> addEntry(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody CreateTimesheetEntryRequest request) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Entry added", timesheetService.addEntry(id, request, userId)));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<TimesheetResponse>> submitTimesheet(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = Long.valueOf(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Timesheet submitted", timesheetService.submitTimesheet(id, userId)));
    }

    @GetMapping("/pending-approvals")
    public ResponseEntity<ApiResponse<PageResponse<TimesheetResponse>>> getPendingApprovals(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long managerId = Long.valueOf(auth.getName());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(timesheetService.getPendingApprovals(managerId, pageable)));
    }

    @PostMapping("/{id}/{action}")
    public ResponseEntity<ApiResponse<TimesheetResponse>> processApproval(
            @PathVariable Long id,
            @PathVariable String action,
            Authentication auth,
            @RequestBody(required = false) TimesheetApprovalRequest request) {
        
        Long managerId = Long.valueOf(auth.getName());
        boolean approve = "approve".equalsIgnoreCase(action);
        String comment = request != null ? request.getComment() : null;

        String resultMsg = approve ? "Timesheet approved" : "Timesheet rejected";
        return ResponseEntity.ok(ApiResponse.success(resultMsg, timesheetService.processApproval(id, approve, comment, managerId)));
    }
}
