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
}
