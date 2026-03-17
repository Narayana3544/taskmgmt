package com.telusko.demo.leave.repository;

import com.telusko.demo.leave.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    
    Page<LeaveRequest> findByUserIdAndActiveTrueOrderByStartDateDesc(Long userId, Pageable pageable);

    @Query("SELECT l FROM LeaveRequest l INNER JOIN l.user u " +
           "WHERE (:managerId IS NULL OR " +
           "  EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.user = u AND pm.manager.id = :managerId AND pm.active = true)) " +
           "AND l.status.code = 'APPLIED' AND l.active = true " +
           "ORDER BY l.startDate ASC")
    Page<LeaveRequest> findPendingTeamLeaves(@Param("managerId") Long managerId, Pageable pageable);
}
