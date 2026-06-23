package com.telusko.demo.sprint.service;

import com.telusko.demo.notification.service.NotificationService;
import com.telusko.demo.project.entity.ProjectMember;
import com.telusko.demo.project.repository.ProjectMemberRepository;
import com.telusko.demo.sprint.entity.Sprint;
import com.telusko.demo.sprint.repository.SprintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled job that sends notifications to project members
 * when a sprint is completing today.
 *
 * Runs daily at 8:00 AM (server time).
 */
@Component
public class SprintExpiryNotifier {

    private static final Logger log = LoggerFactory.getLogger(SprintExpiryNotifier.class);

    private final SprintRepository sprintRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;

    public SprintExpiryNotifier(SprintRepository sprintRepository,
                                 ProjectMemberRepository projectMemberRepository,
                                 NotificationService notificationService) {
        this.sprintRepository = sprintRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.notificationService = notificationService;
    }

    /**
     * Runs daily at 8:00 AM (server time).
     * Notifies all project members about sprints ending today.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void notifySprintExpiryToday() {
        LocalDate today = LocalDate.now();
        log.info("Running sprint expiry notification job for date: {}", today);

        List<Sprint> expiringToday = sprintRepository.findActiveSprintsEndingOn(today);

        if (expiringToday.isEmpty()) {
            log.info("No sprints expiring today.");
            return;
        }

        log.info("Found {} sprint(s) expiring today", expiringToday.size());

        for (Sprint sprint : expiringToday) {
            try {
                // Get all active members of the sprint's project
                List<ProjectMember> members = projectMemberRepository
                        .findByProjectIdAndEndDateIsNull(sprint.getProject().getId());

                for (ProjectMember member : members) {
                    notificationService.createNotification(
                            member.getUser().getId(),
                            "SPRINT", sprint.getId(),
                            "Sprint Ending Today",
                            "Sprint '" + sprint.getName() + "' in project '"
                                    + sprint.getProject().getName() + "' is completing today. "
                                    + "Unfinished items will be spilled over at midnight.",
                            0L // System notification
                    );
                }

                log.info("Notified {} members about sprint '{}' (id={}) expiring today",
                        members.size(), sprint.getName(), sprint.getId());
            } catch (Exception e) {
                log.error("Failed to send expiry notifications for sprint id={}: {}",
                        sprint.getId(), e.getMessage(), e);
            }
        }
    }
}
