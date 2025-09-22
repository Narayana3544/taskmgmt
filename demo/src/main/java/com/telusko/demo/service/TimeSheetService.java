package com.telusko.demo.service;

import com.telusko.demo.Model.Timesheet;
import com.telusko.demo.repo.*;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

        LocalDate today = LocalDate.now();
        if (!entry.getDate().isEqual(today)) {
            throw new IllegalStateException("Timesheet entries can only be created/edited for today.");
        }
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

    public List<Timesheet> getEntriesForWeek(int userId, LocalDate startDate, LocalDate endDate) {
        // Fetch existing entries from DB
        List<Timesheet> entries = repo.findByUserIdAndDateBetween(userId, startDate, endDate);

        // Map existing entries by date for quick lookup
        Map<LocalDate, Timesheet> entryMap = entries.stream()
                .collect(Collectors.toMap(Timesheet::getDate, e -> e));

        // Fill in missing days with "Leave" placeholder
        List<Timesheet> fullWeek = new ArrayList<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            if (entryMap.containsKey(current)) {
                fullWeek.add(entryMap.get(current));
            } else {
                Timesheet leaveEntry = new Timesheet();
                leaveEntry.setDate(current);
                leaveEntry.setDescription("Absent (auto-marked)");
                leaveEntry.setPermission_granted(true);
                // You can set a default WorkType = TIME_OFF if you want
                fullWeek.add(leaveEntry);
            }
            current = current.plusDays(1);
        }

        return fullWeek;
    }


}
