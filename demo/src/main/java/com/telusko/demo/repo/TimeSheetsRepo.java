package com.telusko.demo.repo;

import com.telusko.demo.Model.Timesheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeSheetsRepo extends JpaRepository<Timesheet,Integer> {
    List<Timesheet> findByUserIdAndDate(int userId, LocalDate date);

    List<Timesheet> findByUserIdAndDateBetween(int userId, LocalDate startDate, LocalDate endDate);

    List<Timesheet> findByDateBetween(LocalDate start, LocalDate end);

    List<Timesheet> findByDate(LocalDate date);

    List<Timesheet> findByDateAndUserId(LocalDate date, int userId);
}
