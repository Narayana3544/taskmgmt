package com.telusko.demo.controller;


import com.telusko.demo.Model.Timesheet;
import com.telusko.demo.Model.User;
import com.telusko.demo.Model.WorkType;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.dto.DailySummaryDTO;
import com.telusko.demo.dto.DailySummaryWithLogsDTO;
import com.telusko.demo.repo.WorkTypeRepo;
import com.telusko.demo.service.TimeSheetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
public class TimeSheetController {

    @Autowired
    public TimeSheetService service;

    @Autowired
    private WorkTypeRepo workTypeRepository;

    @PostMapping("/timesheets")
    public ResponseEntity<Timesheet> createEntry(@RequestBody Timesheet entry, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();
        entry.setUser(user);
        Timesheet saved = service.saveEntry(entry);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/timesheets/day/{date}")
    public ResponseEntity<List<Timesheet>> getEntriesForDay(
            Authentication authentication,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        List<Timesheet> entries = service.getEntriesByUserAndDate(userId, date);
        return ResponseEntity.ok(entries);
    }

//    @GetMapping("/{userId}/week")
//    public ResponseEntity<List<Timesheet>> getEntriesForWeek(
//            @PathVariable int userId,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
//        List<Timesheet> entries = service.getEntriesForWeek(userId, start, end);
//        return ResponseEntity.ok(entries);
//    }

    @PutMapping("/timesheet/{id}")
    public ResponseEntity<Timesheet> updateEntry(
            @PathVariable int id,
            @RequestBody Timesheet updatedEntry) {
        Timesheet saved = service.updateEntry(id, updatedEntry);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEntry(@PathVariable int id) {
        service.deleteEntry(id);
        return ResponseEntity.ok("Entry deleted successfully");
    }

    @GetMapping("/worktypes")
    public List<WorkType> getAllWorkTypes() {
        return workTypeRepository.findAll();
    }
    @GetMapping("/timesheets/month")
    public List<Timesheet> getTimesheetsByMonth(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return service.getTimesheetsBetween(startDate, endDate);
    }

    @GetMapping("/timesheets/range-summary")
    public List<DailySummaryDTO> getRangeSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            Authentication authentication
    ) {
        return service.getRangeSummary(start, end, authentication);
    }

    @GetMapping("/timesheets/range-summary/{userId}")
    public List<DailySummaryDTO> getRangeSummarybyUserId(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @PathVariable int userId) {
        return service.getRangeSummaryforUser(start, end, userId);
    }

    @GetMapping("/timesheets/day/{userId}/{date}")
    public ResponseEntity<List<Timesheet>> getEntriesForDaybyUserId(
            @PathVariable int userId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Timesheet> entries = service.getEntriesByUserAndDate(userId, date);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/timesheet/range-summary-with-logs/{userId}")
    public ResponseEntity<List<DailySummaryWithLogsDTO>> getRangeSummaryWithLogs(
            @PathVariable int userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        List<DailySummaryWithLogsDTO> data = service.getRangeSummaryWithLogsForUser(start, end, userId);
        return ResponseEntity.ok(data);
    }

}