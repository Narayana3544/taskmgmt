package com.telusko.demo.sprint.service;

import com.telusko.demo.sprint.entity.Sprint;
import com.telusko.demo.sprint.repository.SprintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job that automatically closes expired sprints.
 * Runs daily at midnight (00:00).
 *
 * Spillover rules:
 * - OPEN items → moved to BACKLOG
 * - IN_PROGRESS items → moved to next PLANNED sprint in same feature (or BACKLOG if none)
 * - DONE items → left as-is
 */
@Component
public class SprintScheduler {

    private static final Logger log = LoggerFactory.getLogger(SprintScheduler.class);

    private final SprintRepository sprintRepository;
    private final SprintService sprintService;

    public SprintScheduler(SprintRepository sprintRepository, SprintService sprintService) {
        this.sprintRepository = sprintRepository;
        this.sprintService = sprintService;
    }

    /**
     * Runs every day at midnight (server time).
     * Finds all ACTIVE sprints where endDate <= today and closes them.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void autoCloseExpiredSprints() {
        LocalDate today = LocalDate.now();
        log.info("Running sprint auto-close job for date: {}", today);

        List<Sprint> expiredSprints = sprintRepository.findActiveSprintsEndingOnOrBefore(today);

        if (expiredSprints.isEmpty()) {
            log.info("No expired sprints found.");
            return;
        }

        log.info("Found {} expired sprint(s) to close", expiredSprints.size());

        for (Sprint sprint : expiredSprints) {
            try {
                sprintService.autoCloseSprint(sprint.getId());
                log.info("Auto-closed sprint: id={}, name='{}', endDate={}",
                        sprint.getId(), sprint.getName(), sprint.getEndDate());
            } catch (Exception e) {
                log.error("Failed to auto-close sprint id={}: {}", sprint.getId(), e.getMessage(), e);
            }
        }
    }
}
