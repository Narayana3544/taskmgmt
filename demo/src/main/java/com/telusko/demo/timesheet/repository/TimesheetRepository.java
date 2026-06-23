package com.telusko.demo.timesheet.repository;

import com.telusko.demo.timesheet.entity.Timesheet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {

    Optional<Timesheet> findByUserIdAndWorkDateAndActiveTrue(Long userId, LocalDate workDate);

    @Query("SELECT t FROM Timesheet t INNER JOIN t.user u " +
           "WHERE EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.user = u AND pm.manager.id = :managerId AND pm.active = true) " +
           "AND t.status.code = 'SUBMITTED' AND t.active = true " +
           "ORDER BY t.workDate ASC")
    Page<Timesheet> findPendingApprovalsByManager(@Param("managerId") Long managerId, Pageable pageable);

    @Query("SELECT t FROM Timesheet t " +
           "WHERE t.status.code = 'SUBMITTED' AND t.active = true " +
           "ORDER BY t.workDate ASC")
    Page<Timesheet> findAllPendingApprovals(Pageable pageable);

    @Query("SELECT t FROM Timesheet t " +
           "WHERE t.status.code = 'APPROVED' AND t.active = true " +
           "AND t.workDate >= :startDate AND t.workDate <= :endDate " +
           "ORDER BY t.workDate ASC")
    Page<Timesheet> findApprovedTimesheetsByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    // Overview: ALL users with their timesheet counts (all statuses)
    @Query("SELECT new com.telusko.demo.timesheet.dto.UserTimesheetOverviewDto(" +
           "u.id, u.fullName, u.email, COUNT(DISTINCT t.id), " +
           "CAST(COUNT(DISTINCT CASE WHEN t.status.code = 'APPROVED' THEN t.id END) AS long), " +
           "CAST(COUNT(DISTINCT CASE WHEN t.status.code = 'SUBMITTED' THEN t.id END) AS long), " +
           "COALESCE(SUM(te.durationMinutes) / 60.0, 0.0)) " +
           "FROM User u LEFT JOIN Timesheet t ON t.user = u AND t.workDate >= :startDate AND t.workDate <= :endDate AND t.active = true " +
           "LEFT JOIN TimesheetEntry te ON te.timesheet = t " +
           "WHERE u.active = true " +
           "GROUP BY u.id, u.fullName, u.email " +
           "ORDER BY u.fullName ASC")
    Page<com.telusko.demo.timesheet.dto.UserTimesheetOverviewDto> findUserTimesheetOverview(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    // User detail: ALL timesheets for a user in date range (all statuses)
    @Query("SELECT t FROM Timesheet t " +
           "WHERE t.user.id = :userId AND t.active = true " +
           "AND t.workDate >= :startDate AND t.workDate <= :endDate " +
           "ORDER BY t.workDate DESC")
    Page<Timesheet> findTimesheetsByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);

    // Legacy: keep the approved-only query for backward compatibility
    @Query("SELECT t FROM Timesheet t " +
           "WHERE t.user.id = :userId AND t.status.code = 'APPROVED' AND t.active = true " +
           "AND t.workDate >= :startDate AND t.workDate <= :endDate " +
           "ORDER BY t.workDate DESC")
    Page<Timesheet> findApprovedTimesheetsByUserAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, Pageable pageable);
}
