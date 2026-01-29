package com.telusko.demo.controller;

import com.telusko.demo.dto.analytics.BurndownDataDTO;
import com.telusko.demo.dto.analytics.SprintAnalyticsDTO;
import com.telusko.demo.service.BurndownService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for sprint burndown and analytics.
 */
@RestController
@RequestMapping("/api/analytics")
public class BurndownController {
    
    private static final Logger logger = LoggerFactory.getLogger(BurndownController.class);
    
    private final BurndownService burndownService;
    
    public BurndownController(BurndownService burndownService) {
        this.burndownService = burndownService;
    }
    
    /**
     * Get burndown chart data for a sprint
     */
    @GetMapping("/sprints/{sprintId}/burndown")
    @PreAuthorize("hasAuthority('VIEW_SPRINT') or hasAuthority('VIEW_ANALYTICS')")
    public ResponseEntity<BurndownDataDTO> getBurndownData(@PathVariable int sprintId) {
        logger.info("Fetching burndown data for sprint: {}", sprintId);
        BurndownDataDTO data = burndownService.getBurndownData(sprintId);
        return ResponseEntity.ok(data);
    }
    
    /**
     * Get sprint analytics
     */
    @GetMapping("/sprints/{sprintId}")
    @PreAuthorize("hasAuthority('VIEW_SPRINT') or hasAuthority('VIEW_ANALYTICS')")
    public ResponseEntity<SprintAnalyticsDTO> getSprintAnalytics(@PathVariable int sprintId) {
        logger.info("Fetching analytics for sprint: {}", sprintId);
        SprintAnalyticsDTO analytics = burndownService.getSprintAnalytics(sprintId);
        return ResponseEntity.ok(analytics);
    }
    
    /**
     * Manually trigger burndown calculation for today
     */
    @PostMapping("/sprints/{sprintId}/burndown/calculate")
    @PreAuthorize("hasAuthority('MANAGE_SPRINTS')")
    public ResponseEntity<Map<String, String>> calculateBurndown(@PathVariable int sprintId) {
        logger.info("Manually triggering burndown calculation for sprint: {}", sprintId);
        burndownService.calculateDailyBurndown(sprintId);
        return ResponseEntity.ok(Map.of("message", "Burndown calculated successfully"));
    }
    
    /**
     * Initialize burndown for a new sprint
     */
    @PostMapping("/sprints/{sprintId}/burndown/initialize")
    @PreAuthorize("hasAuthority('MANAGE_SPRINTS')")
    public ResponseEntity<Map<String, String>> initializeBurndown(@PathVariable int sprintId) {
        logger.info("Initializing burndown for sprint: {}", sprintId);
        burndownService.initializeBurndown(sprintId);
        return ResponseEntity.ok(Map.of("message", "Burndown initialized successfully"));
    }
}
