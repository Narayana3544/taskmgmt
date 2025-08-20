package com.telusko.demo.repo;

import com.telusko.demo.Model.Create_Task;
import com.telusko.demo.Model.task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository  extends JpaRepository<task,Integer> {

    List<task> findBySprint_id(int sprintId);
}
