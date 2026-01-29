package com.telusko.demo.service;

import com.telusko.demo.Model.SprintBurndown;
import com.telusko.demo.Model.Task_status;
import com.telusko.demo.Model.createsprint;
import com.telusko.demo.Model.task;
import com.telusko.demo.dto.analytics.BurndownDataDTO;
import com.telusko.demo.dto.analytics.SprintAnalyticsDTO;
import com.telusko.demo.exception.ResourceNotFoundException;
import com.telusko.demo.repo.SprintBurndownRepository;
import com.telusko.demo.repo.createsprintrepo;
import com.telusko.demo.repo.TaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for sprint burndown calculations and analytics.
 */
@Service
@Transactional
public class BurndownService {
    
    private static final Logger logger = LoggerFactory.getLogger(BurndownService.class);
    
    private final SprintBurndownRepository burndownRepository;
    private final createsprintrepo sprintRepo;
    private final TaskRepository taskRepo;
    
    public BurndownService(
            SprintBurndownRepository burndownRepository,
            createsprintrepo sprintRepo,
            TaskRepository taskRepo
    ) {
        this.burndownRepository = burndownRepository;
        this.sprintRepo = sprintRepo;
        this.taskRepo = taskRepo;
    }
    
    /**
     * Get burndown chart data for a sprint
     */
    public BurndownDataDTO getBurndownData(int sprintId) {
        createsprint sprint = sprintRepo.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));
        
        List<SprintBurndown> burndownData = burndownRepository.findBySprintId(sprintId);
        
        // Calculate sprint duration
        LocalDate startDate = sprint.getStartDate().toLocalDate();
        LocalDate endDate = sprint.getEndDate().toLocalDate();
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        
        // Get total story points
        int totalPoints = calculateTotalPoints(sprintId);
        
        // Generate ideal burndown line
        List<Double> idealLine = generateIdealBurndown(totalPoints, (int) totalDays);
        
        // Extract actual burndown from data
        List<BurndownDataDTO.DailyData> dailyData = burndownData.stream()
                .map(bd -> BurndownDataDTO.DailyData.builder()
                        .date(bd.getDate())
                        .remainingPoints(bd.getRemainingPoints())
                        .completedPoints(bd.getCompletedPoints())
                        .idealRemaining(bd.getIdealRemaining())
                        .dailyVelocity(bd.getDailyVelocity())
                        .build())
                .collect(Collectors.toList());
        
        return BurndownDataDTO.builder()
                .sprintId(sprintId)
                .sprintName(sprint.getName())
                .startDate(startDate)
                .endDate(endDate)
                .totalPoints(totalPoints)
                .idealBurndown(idealLine)
                .dailyData(dailyData)
                .build();
    }
    
    /**
     * Calculate and store burndown data for today
     */
    public void calculateDailyBurndown(int sprintId) {
        createsprint sprint = sprintRepo.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));
        
        LocalDate today = LocalDate.now();
        
        // Check if already calculated for today
        Optional<SprintBurndown> existing = burndownRepository.findBySprintAndDate(sprint, today);
        if (existing.isPresent()) {
            logger.debug("Burndown already calculated for sprint {} on {}", sprintId, today);
            return;
        }
        
        // Calculate metrics
        int totalPoints = calculateTotalPoints(sprintId);
        int completedPoints = calculateCompletedPoints(sprintId);
        int remainingPoints = totalPoints - completedPoints;
        
        // Calculate ideal remaining
        LocalDate startDate = sprint.getStartDate().toLocalDate();
        LocalDate endDate = sprint.getEndDate().toLocalDate();
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        long daysElapsed = ChronoUnit.DAYS.between(startDate, today) + 1;
        double idealRemaining = totalPoints - (totalPoints * (double) daysElapsed / totalDays);
        
        // Calculate daily velocity (points completed today)
        Optional<SprintBurndown> yesterday = burndownRepository.findBySprintAndDate(sprint, today.minusDays(1));
        double dailyVelocity = 0;
        if (yesterday.isPresent()) {
            int yesterdayCompleted = yesterday.get().getCompletedPoints() != null ? yesterday.get().getCompletedPoints() : 0;
            dailyVelocity = completedPoints - yesterdayCompleted;
        }
        
        // Count tasks
        int totalTasks = countTotalTasks(sprintId);
        int completedTasks = countCompletedTasks(sprintId);
        int inProgressTasks = countInProgressTasks(sprintId);
        
        // Create burndown entry
        SprintBurndown burndown = SprintBurndown.builder()
                .sprint(sprint)
                .date(today)
                .totalPoints(totalPoints)
                .completedPoints(completedPoints)
                .remainingPoints(remainingPoints)
                .idealRemaining(idealRemaining)
                .dailyVelocity(dailyVelocity)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .build();
        
        burndownRepository.save(burndown);
        logger.info("Calculated burndown for sprint {} on {}: remaining={}, completed={}", 
                sprintId, today, remainingPoints, completedPoints);
    }
    
    /**
     * Initialize burndown data for a new sprint
     */
    public void initializeBurndown(int sprintId) {
        createsprint sprint = sprintRepo.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));
        
        LocalDate startDate = sprint.getStartDate().toLocalDate();
        int totalPoints = calculateTotalPoints(sprintId);
        
        SprintBurndown initial = SprintBurndown.builder()
                .sprint(sprint)
                .date(startDate)
                .totalPoints(totalPoints)
                .completedPoints(0)
                .remainingPoints(totalPoints)
                .idealRemaining((double) totalPoints)
                .dailyVelocity(0.0)
                .totalTasks(countTotalTasks(sprintId))
                .completedTasks(0)
                .inProgressTasks(0)
                .build();
        
        burndownRepository.save(initial);
        logger.info("Initialized burndown for sprint {}", sprintId);
    }
    
    /**
     * Get sprint velocity analytics
     */
    public SprintAnalyticsDTO getSprintAnalytics(int sprintId) {
        createsprint sprint = sprintRepo.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", "id", sprintId));
        
        int totalPoints = calculateTotalPoints(sprintId);
        int completedPoints = calculateCompletedPoints(sprintId);
        int totalTasks = countTotalTasks(sprintId);
        int completedTasks = countCompletedTasks(sprintId);
        
        // Calculate velocity
        Double velocity = burndownRepository.getTotalVelocityForSprint(sprint);
        
        // Calculate completion percentage
        double completionPercentage = totalPoints > 0 
                ? (double) completedPoints / totalPoints * 100 
                : 0;
        
        return SprintAnalyticsDTO.builder()
                .sprintId(sprintId)
                .sprintName(sprint.getName())
                .totalPoints(totalPoints)
                .completedPoints(completedPoints)
                .remainingPoints(totalPoints - completedPoints)
                .completionPercentage(completionPercentage)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .velocity(velocity != null ? velocity : 0.0)
                .build();
    }
    
    // Helper methods
    
    private int calculateTotalPoints(int sprintId) {
        List<task> tasks = taskRepo.findBySprintId(sprintId);
        return tasks.stream()
                .mapToInt(t -> t.getStorypoints() != null ? t.getStorypoints() : 0)
                .sum();
    }
    
    private int calculateCompletedPoints(int sprintId) {
        List<task> tasks = taskRepo.findBySprintId(sprintId);
        return tasks.stream()
                .filter(t -> t.getTaskStatus() != null && isCompletedStatus(t.getTaskStatus()))
                .mapToInt(t -> t.getStorypoints() != null ? t.getStorypoints() : 0)
                .sum();
    }
    
    private int countTotalTasks(int sprintId) {
        return taskRepo.findBySprintId(sprintId).size();
    }
    
    private int countCompletedTasks(int sprintId) {
        return (int) taskRepo.findBySprintId(sprintId).stream()
                .filter(t -> t.getTaskStatus() != null && isCompletedStatus(t.getTaskStatus()))
                .count();
    }
    
    private int countInProgressTasks(int sprintId) {
        return (int) taskRepo.findBySprintId(sprintId).stream()
                .filter(t -> t.getTaskStatus() != null && isInProgressStatus(t.getTaskStatus()))
                .count();
    }
    
    private boolean isCompletedStatus(Task_status status) {
        String desc = status.getDecription().toLowerCase();
        return desc.contains("done") || desc.contains("completed") || desc.contains("closed");
    }
    
    private boolean isInProgressStatus(Task_status status) {
        String desc = status.getDecription().toLowerCase();
        return desc.contains("progress") || desc.contains("working") || desc.contains("development");
    }
    
    private List<Double> generateIdealBurndown(int totalPoints, int totalDays) {
        List<Double> idealLine = new ArrayList<>();
        double dailyBurn = (double) totalPoints / totalDays;
        
        for (int day = 0; day <= totalDays; day++) {
            idealLine.add(totalPoints - (dailyBurn * day));
        }
        
        return idealLine;
    }
}
