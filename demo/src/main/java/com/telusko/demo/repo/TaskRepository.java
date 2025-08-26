package com.telusko.demo.repo;

import com.telusko.demo.Model.Create_Task;
import com.telusko.demo.Model.task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository  extends JpaRepository<task,Integer> {

//    Optional<task> viewTasksByUserId(int userId);

    List<task> findByUser_Id(int userId);

    List<task> findBySprint_id(int sprintId);

    List<task> findByFeature_id(int featureId);

    List<task> findBySprint_idIsNullAndFeature_id(int featureId);

    List<task> findAllBySprint_id(int sprintId);

//    task findByTaskId(int taskId);
}
