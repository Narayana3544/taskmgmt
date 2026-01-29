package com.telusko.demo.repo;

import com.telusko.demo.Model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepo extends JpaRepository<LeaveRequest, Integer> {
    
    List<LeaveRequest> findByUserId(int userId);
    
    List<LeaveRequest> findByManagerId(int managerId);
}
