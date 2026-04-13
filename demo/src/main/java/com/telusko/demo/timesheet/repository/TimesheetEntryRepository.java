package com.telusko.demo.timesheet.repository;

import com.telusko.demo.timesheet.entity.TimesheetEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimesheetEntryRepository extends JpaRepository<TimesheetEntry, Long> {
    List<TimesheetEntry> findByTimesheetIdOrderByStartTimeAsc(Long timesheetId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM TimesheetEntry e " +
           "INNER JOIN e.timesheet t " +
           "INNER JOIN t.user u " +
           "LEFT JOIN e.workItem w " +
           "LEFT JOIN w.project p " +
           "WHERE t.workDate >= :startDate AND t.workDate <= :endDate " +
           "AND t.status.code = 'APPROVED' " +
           "AND t.active = true " +
           "AND (CAST(:projectId AS long) IS NULL OR p.id = :projectId) " +
           "AND (CAST(:targetUserId AS long) IS NULL OR u.id = :targetUserId) " +
           "AND (:userName = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :userName, '%'))) " +
           "ORDER BY t.workDate DESC, e.startTime ASC")
    org.springframework.data.domain.Page<TimesheetEntry> findTimesheetEntriesReport(
           @org.springframework.data.repository.query.Param("startDate") java.time.LocalDate startDate, 
           @org.springframework.data.repository.query.Param("endDate") java.time.LocalDate endDate, 
           @org.springframework.data.repository.query.Param("projectId") Long projectId, 
           @org.springframework.data.repository.query.Param("targetUserId") Long targetUserId, 
           @org.springframework.data.repository.query.Param("userName") String userName, 
           org.springframework.data.domain.Pageable pageable);
}
