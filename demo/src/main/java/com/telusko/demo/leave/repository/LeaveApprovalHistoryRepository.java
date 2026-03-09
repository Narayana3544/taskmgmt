package com.telusko.demo.leave.repository;

import com.telusko.demo.leave.entity.LeaveApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveApprovalHistoryRepository extends JpaRepository<LeaveApprovalHistory, Long> {
    List<LeaveApprovalHistory> findByLeaveRequestIdOrderByActionAtDesc(Long leaveRequestId);
}
