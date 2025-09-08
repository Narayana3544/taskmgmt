package com.telusko.demo.repo;

import com.telusko.demo.Model.Timesheets;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimeSheetsRepo extends JpaRepository<Timesheets,Integer> {
}
