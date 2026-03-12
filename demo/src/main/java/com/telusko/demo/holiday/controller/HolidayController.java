package com.telusko.demo.holiday.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.holiday.dto.HolidayRequest;
import com.telusko.demo.holiday.dto.HolidayResponse;
import com.telusko.demo.holiday.service.HolidayService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> getHolidays(
            @RequestParam Long orgId,
            @RequestParam(required = false, defaultValue = "2026") int year) {
        return ResponseEntity.ok(ApiResponse.success(holidayService.getHolidaysByYear(orgId, year)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HolidayResponse>> getHolidayById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(holidayService.getHolidayById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HolidayResponse>> createHoliday(@Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Holiday created", holidayService.createHoliday(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HolidayResponse>> updateHoliday(
            @PathVariable Long id, @Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Holiday updated", holidayService.updateHoliday(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHoliday(@PathVariable Long id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.ok(ApiResponse.success("Holiday deleted", null));
    }
}
