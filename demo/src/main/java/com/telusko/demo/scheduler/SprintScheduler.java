package com.telusko.demo.scheduler;

import com.telusko.demo.Model.createsprint;
import com.telusko.demo.repo.createsprintrepo;
import com.telusko.demo.service.BurndownService;
import com.telusko.demo.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled jobs for sprint management and burndown calculations.
 */
@Component
@EnableScheduling
public class SprintScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(SprintScheduler.class);
    
    private final createsprintrepo sprintRepo;
    private final BurndownService burndownService;
    private final NotificationService notificationService;
    
    public SprintScheduler(
            createsprintrepo sprintRepo,
            BurndownService burndownService,
            NotificationService notificationService
    ) {
        this.sprintRepo = sprintRepo;
        this.burndownService = burndownService;
        this.notificationService = notificationService;
    }
    
    /**
     * Calculate daily burndown for all active sprints.
     * Runs every day at 11:59 PM.
     */
    @Scheduled(cron = "0 59 23 * * ?")
    public void calculateDailyBurndown() {
        logger.info("Starting daily burndown calculation job");
        
        List<createsprint> activeSprints = getActiveSprints();
        
        for (createsprint sprint : activeSprints) {
            try {
                burndownService.calculateDailyBurndown(sprint.getId());
                logger.debug("Calculated burndown for sprint: {}", sprint.getName());
            } catch (Exception e) {
                logger.error("Failed to calculate burndown for sprint {}: {}", 
                        sprint.getId(), e.getMessage());
            }
        }
        
        logger.info("Completed daily burndown calculation for {} sprints", activeSprints.size());
    }
    
    /**
     * Clean up old notifications.
     * Runs every day at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldNotifications() {
        logger.info("Starting notification cleanup job");
        int deleted = notificationService.cleanupOldNotifications();
        logger.info("Deleted {} old notifications", deleted);
    }
    
    /**
     * Check for sprints ending soon and send notifications.
     * Runs every day at 9 AM.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkSprintEndingSoon() {
        logger.info("Checking for sprints ending soon");
        
        LocalDate today = LocalDate.now();
        LocalDate twoDaysFromNow = today.plusDays(2);
        long twoDaysFromNowEpoch = twoDaysFromNow.toEpochDay();
        
        List<createsprint> activeSprints = getActiveSprints();
        
        for (createsprint sprint : activeSprints) {
            LocalDate sprintEndDate = sprint.getEndDate().toLocalDate();
            if (sprintEndDate.equals(twoDaysFromNow)) {
                // Sprint ends in 2 days - send notification
                logger.info("Sprint '{}' ending soon", sprint.getName());
                // TODO: Get team members and send notifications
            }
        }
    }
    
    /**
     * Get all active sprints (current date is between start and end date)
     */
    private List<createsprint> getActiveSprints() {
        LocalDate today = LocalDate.now();
        
        return sprintRepo.findAll().stream()
                .filter(s -> {
                    LocalDate start = s.getStartDate().toLocalDate();
                    LocalDate end = s.getEndDate().toLocalDate();
                    return !today.isBefore(start) && !today.isAfter(end);
                })
                .toList();
    }
}
