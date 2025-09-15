package com.telusko.demo.repo;

import com.telusko.demo.Model.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeaveBalanceRepo extends JpaRepository<LeaveBalance,Integer> {
}
