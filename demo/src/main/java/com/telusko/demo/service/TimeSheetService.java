package com.telusko.demo.service;

import com.telusko.demo.Model.Task_status;
import com.telusko.demo.Model.Timesheets;
import com.telusko.demo.Model.User;
import com.telusko.demo.repo.Task_statusrepo;
import com.telusko.demo.repo.TimeSheetsRepo;
import com.telusko.demo.repo.userrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class TimeSheetService {

    @Autowired
    public userrepo userRepo;

    @Autowired
    public TimeSheetsRepo repo;

    @Autowired
    public Task_statusrepo taskStatusRepo;

    public Timesheets createTimesheet(int userId, int managerId, LocalDate weekStart, LocalDate weekEnd, Authentication authentication) {

        User user = userRepo.findById(userId);
        if (user == null) {
            throw new RuntimeException("Status DRAFT not found");
        };

        User manager = userRepo.findById(managerId);
        if (manager == null) {
            throw new RuntimeException("Manager not found with id: " + managerId);
        }
        Task_status draftStatus = (taskStatusRepo.findByDecription("To Do")
                .orElseThrow(() -> new RuntimeException("Status DRAFT not found")));
        Timesheets timesheet = new Timesheets();
        timesheet.setUser(user);
        timesheet.setManager(manager);
        timesheet.setWeekStart(Date.valueOf(weekStart));
        timesheet.setWeekEnd(Date.valueOf(weekEnd));
        timesheet.setStatus(draftStatus); // default status
        timesheet.setTotalhours(0);
        timesheet.setCreatedAt(LocalDateTime.now());

        return repo.save(timesheet);
    }
}
