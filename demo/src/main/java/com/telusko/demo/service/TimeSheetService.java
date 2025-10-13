package com.telusko.demo.service;

import com.telusko.demo.Model.Timesheet;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.dto.DailySummaryDTO;
import com.telusko.demo.repo.*;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class TimeSheetService {

    @Autowired
    public userrepo userRepo;

    @Autowired
    public TimeSheetsRepo repo;

    @Autowired
    public Task_statusrepo taskStatusRepo;

    @Autowired
    public TaskRepository taskrepo;

    @Autowired
    public WorkTypeRepo workTypeRepo;

    public Timesheet saveEntry(Timesheet entry) {
        entry.setPermission_granted(true);
        LocalDate today = LocalDate.now();
        if (!entry.getDate().isEqual(today)) {
            throw new IllegalStateException("Timesheet entries can only be created/edited for today.");
        }
        List<Timesheet> existingEntries=repo.findAll();
        return repo.save(entry);
    }

    public List<Timesheet> getEntriesByUserAndDate(int userId, LocalDate date) {
        return repo.findByUserIdAndDate(userId, date);
    }


    public Timesheet updateEntry(int id, Timesheet updatedEntry) {
        Timesheet existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));

        LocalDate today = LocalDate.now();
        if (!existing.getDate().isEqual(today)) {
            throw new IllegalStateException("Past timesheet entries cannot be updated.");
        }

        // copy fields
        existing.setStart_time(updatedEntry.getStart_time());
        existing.setEnd_time(updatedEntry.getEnd_time());
        existing.setWorkType(updatedEntry.getWorkType());
        existing.setTask(updatedEntry.getTask());
        existing.setDescription(updatedEntry.getDescription());
        existing.setPermission_granted(updatedEntry.isPermission_granted());

        return repo.save(existing);
    }

    public void deleteEntry(int id) {
        Timesheet existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found"));

        LocalDate today = LocalDate.now();
        if (!existing.getDate().isEqual(today)) {
            throw new IllegalStateException("Past timesheet entries cannot be deleted.");
        }

        repo.delete(existing);
    }

//    public List<Timesheet> getEntriesForWeek(int userId, LocalDate startDate, LocalDate endDate) {
//        // Fetch existing entries from DB
//        List<Timesheet> entries = repo.findByUserIdAndDateBetween(userId, startDate, endDate);
//
//        // Map existing entries by date for quick lookup
//        Map<LocalDate, Timesheet> entryMap = entries.stream()
//                .collect(Collectors.toMap(Timesheet::getDate, e -> e));
//
//        // Fill in missing days with "Leave" placeholder
//        List<Timesheet> fullWeek = new ArrayList<>();
//        LocalDate current = startDate;
//
//        while (!current.isAfter(endDate)) {
//            if (entryMap.containsKey(current)) {
//                fullWeek.add(entryMap.get(current));
//            } else {
//                Timesheet leaveEntry = new Timesheet();
//                leaveEntry.setDate(current);
//                leaveEntry.setDescription("Absent (auto-marked)");
//                leaveEntry.setPermission_granted(true);
//                // You can set a default WorkType = TIME_OFF if you want
//                fullWeek.add(leaveEntry);
//            }
//            current = current.plusDays(1);
//        }
//
//        return fullWeek;
//    }

    public void validateTimesheet(Timesheet newEntry, List<Timesheet> existingEntries) {
        for (Timesheet entry : existingEntries) {
            boolean overlap = !newEntry.getEnd_time().isBefore(entry.getStart_time()) &&
                    !newEntry.getStart_time().isAfter(entry.getEnd_time());
            if (overlap) {
                throw new IllegalArgumentException("Time entry overlaps with an existing entry");
            }
        }
    }


    public List<Timesheet> getTimesheetsBetween(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return repo.findByDateBetween(start, end);
    }

    public List<DailySummaryDTO> getRangeSummary(LocalDate start, LocalDate end, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        List<DailySummaryDTO> summaries = new ArrayList<>();

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            List<Timesheet> entries;
            if (userId != 0) {
                entries = repo.findByDateAndUserId(date, userId);
            }
            else {
                entries = repo.findByDate(date); // all users
            }

            if (entries.isEmpty()) {
                summaries.add(new DailySummaryDTO(date, 0, "Leave"));
            } else {
                double totalHours = entries.stream()
                        .mapToDouble(e -> Duration.between(e.getStart_time(), e.getEnd_time()).toMinutes() / 60.0)
                        .sum();

                String status;
                if (entries.stream().anyMatch(e -> e.getWorkType().getDescription().equalsIgnoreCase("Official"))) {
                    status = "Official";
                } else if (entries.stream().anyMatch(e -> e.getWorkType().getDescription().equalsIgnoreCase("Time Off"))) {
                    status = "Time Off";
                } else {
                    status = "Worked";
                }

                summaries.add(new DailySummaryDTO(date, totalHours, status));
            }
        }

        return summaries;
    }


    public List<DailySummaryDTO> getRangeSummaryforUser(LocalDate start, LocalDate end, int userId) {
        List<DailySummaryDTO> summaries = new ArrayList<>();

        // Check if user exists
        if (!userRepo.existsById(userId)) {
            throw new RuntimeException("Record not found for userId: " + userId);
        }

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            // Fetch entries only for this user and date
            List<Timesheet> entries = repo.findByDateAndUserId(date, userId);

            if (entries.isEmpty()) {
                summaries.add(new DailySummaryDTO(date, 0, "Leave"));
            } else {
                double totalHours = entries.stream()
                        .mapToDouble(e -> Duration.between(e.getStart_time(), e.getEnd_time()).toMinutes() / 60.0)
                        .sum();

                String status;
                if (entries.stream().anyMatch(e -> e.getWorkType().getDescription().equalsIgnoreCase("Official"))) {
                    status = "Official";
                } else if (entries.stream().anyMatch(e -> e.getWorkType().getDescription().equalsIgnoreCase("Time Off"))) {
                    status = "Time Off";
                } else {
                    status = "Worked";
                }

                summaries.add(new DailySummaryDTO(date, totalHours, status));
            }
        }

        return summaries;
    }
}