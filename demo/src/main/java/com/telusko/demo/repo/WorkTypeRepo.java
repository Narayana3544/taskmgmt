package com.telusko.demo.repo;

import com.telusko.demo.Model.WorkType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkTypeRepo extends JpaRepository<WorkType,Integer> {
}