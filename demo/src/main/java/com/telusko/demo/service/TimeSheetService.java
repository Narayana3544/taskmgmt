package com.telusko.demo.service;

import com.telusko.demo.Model.Timesheet;
import com.telusko.demo.Model.User;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.dto.DailySummaryDTO;
import com.telusko.demo.dto.DailySummaryWithLogsDTO;
import com.telusko.demo.dto.DateUtils;
import com.telusko.demo.dto.TimesheetSummaryDTO;
import com.telusko.demo.repo.*;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
//        entry.setPermission_granted(true);
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
            } else {
                entries = repo.findByDate(date); // all users
            }

            if (entries == null || entries.isEmpty()) {
                // Use new ctor: date, totalHours, totalHoursAndMinutes, status
                summaries.add(new DailySummaryDTO(date, 0.0, "0h 00m", "Leave"));
            } else {
                // filter out bad rows that would NPE or throw in Duration.between
                List<Timesheet> valid = entries.stream()
                        .filter(e -> e.getStart_time() != null && e.getEnd_time() != null)
                        .collect(Collectors.toList());

                long totalMinutes = valid.stream()
                        .mapToLong(e -> {
                            try {
                                return Duration.between(e.getStart_time(), e.getEnd_time()).toMinutes();
                            } catch (Exception ex) {
                                // Ignore problematic single record
                                return 0L;
                            }
                        })
                        .sum();

                if (totalMinutes < 0) totalMinutes = Math.abs(totalMinutes);

                long hoursPart = totalMinutes / 60;
                long minutesPart = totalMinutes % 60;
                double totalHoursRaw = totalMinutes / 60.0;
                double totalHours = Math.round(totalHoursRaw * 100.0) / 100.0; // 2 decimals

                String totalHoursAndMinutes = String.format("%dh %02dm", hoursPart, minutesPart);

                String status;
                if (entries.stream().anyMatch(e -> e.getWorkType() != null && e.getWorkType().getDescription().equalsIgnoreCase("Official"))) {
                    status = "Official";
                } else if (entries.stream().anyMatch(e -> e.getWorkType() != null && e.getWorkType().getDescription().equalsIgnoreCase("Time Off"))) {
                    status = "Time Off";
                } else {
                    status = "Worked";
                }

                summaries.add(new DailySummaryDTO(date, totalHours, totalHoursAndMinutes, status));
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

    public List<DailySummaryWithLogsDTO> getRangeSummaryWithLogsForUser(LocalDate start, LocalDate end, int userId) {
        List<DailySummaryWithLogsDTO> result = new ArrayList<>();

        if (!userRepo.existsById(userId)) {
            throw new RuntimeException("Record not found for userId: " + userId);
        }

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            List<Timesheet> logs = getEntriesByUserAndDate(userId, date);

            // Defensive: ignore any entries with null start/end to avoid exceptions
            List<Timesheet> validLogs = logs.stream()
                    .filter(e -> e.getStart_time() != null && e.getEnd_time() != null)
                    .collect(Collectors.toList());

            // sum minutes to avoid floating-point rounding issues
            long totalMinutes = validLogs.stream()
                    .mapToLong(e -> {
                        try {
                            return Duration.between(e.getStart_time(), e.getEnd_time()).toMinutes();
                        } catch (Exception ex) {
                            // if something odd happens for a single entry, ignore it
                            return 0L;
                        }
                    })
                    .sum();

            // defensive: if negative durations might exist, make non-negative
            if (totalMinutes < 0) totalMinutes = Math.abs(totalMinutes);

            long hoursPart = totalMinutes / 60;
            long minutesPart = totalMinutes % 60;
            double totalHoursRaw = totalMinutes / 60.0;

            // Round to 2 decimals for stable display (e.g., 7.50)
            double totalHours = Math.round(totalHoursRaw * 100.0) / 100.0;

            // formatted string e.g. "7h 05m" (minutes zero-padded)
            String totalHoursAndMinutes = String.format("%dh %02dm", hoursPart, minutesPart);

            String status;
            if (logs.isEmpty()) {
                if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                    status = "Weekend";
                } else if (isHoliday(date)) {
                    status = "Holiday";
                } else {
                    status = "LOP";
                }
            } else if (logs.stream().anyMatch(e -> e.getWorkType() != null && e.getWorkType().getDescription().equalsIgnoreCase("Official"))) {
                status = "Official";
            } else if (logs.stream().anyMatch(e -> e.getWorkType() != null && e.getWorkType().getDescription().equalsIgnoreCase("Time Off"))) {
                status = "Time Off";
            } else {
                status = "Worked";
            }

            // Use new constructor that includes totalHoursAndMinutes
            result.add(new DailySummaryWithLogsDTO(date, totalHours, totalHoursAndMinutes, status, logs));
        }

        return result;
    }

    // Example holiday check (you can replace with your repo/logic)
    private boolean isHoliday(LocalDate date) {
        List<LocalDate> holidays = List.of(
                LocalDate.of(2025, 10, 2),
                LocalDate.of(2025, 10, 3)
        );
        return holidays.contains(date);
    }
    public List<TimesheetSummaryDTO> getAllUsersSummary(LocalDate start, LocalDate end) {
        List<User> users = userRepo.findAll();
        List<LocalDate> workingDays = DateUtils.getWorkingDays(start, end);
        int totalWorkingDays = workingDays.size();

        List<TimesheetSummaryDTO> summaries = new ArrayList<>();

        for (User user : users) {
            // Use your existing daily method
            List<DailySummaryDTO> dailySummaries = getRangeSummaryforUser(start, end, user.getId());

            // Filter working days only
            List<DailySummaryDTO> workingSummaries = dailySummaries.stream()
                    .filter(d -> workingDays.contains(d.getDate()))
                    .toList();

            double totalHours = workingSummaries.stream()
                    .mapToDouble(DailySummaryDTO::getTotalHours)
                    .sum();

            int daysFilled = (int) workingSummaries.stream()
                    .filter(d -> d.getTotalHours() > 0)
                    .count();

            List<LocalDate> missingDates = workingDays.stream()
                    .filter(d -> workingSummaries.stream()
                            .noneMatch(s -> s.getDate().equals(d) && s.getTotalHours() > 0))
                    .toList();

            int missingDays = missingDates.size();
            double avgHours = daysFilled > 0 ? totalHours / daysFilled : 0.0;

            summaries.add(new TimesheetSummaryDTO(
                    user.getId(),
                    user.getFirst_name(),
                    totalHours,
                    daysFilled,
                    totalWorkingDays,
                    missingDays,
                    avgHours,
                    missingDates
            ));
        }

        return summaries;
    }

}