package com.telusko.demo.leave.repository;

import com.telusko.demo.leave.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    
    List<LeaveBalance> findByUserIdAndYearAndActiveTrue(Long userId, Integer year);
    
    Optional<LeaveBalance> findByUserIdAndLeaveTypeIdAndYearAndActiveTrue(Long userId, Long leaveTypeId, Integer year);
}
