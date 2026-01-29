package com.telusko.demo.repo;

import com.telusko.demo.Model.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveBalanceRepo extends JpaRepository<LeaveBalance, Integer> {
    
    List<LeaveBalance> findByUserIdAndYear(int userId, int year);
    
    List<LeaveBalance> findByUserId(int userId);
}
