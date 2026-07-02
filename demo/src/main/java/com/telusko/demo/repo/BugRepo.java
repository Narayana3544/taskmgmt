package com.telusko.demo.repo;

import com.telusko.demo.Model.Bug;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugRepo extends JpaRepository<Bug,Integer> {
    @Query("SELECT b FROM Bug b WHERE b.Task.id = :taskId")
    List<Bug> findByTaskId(@Param("taskId") int taskId);

    @Query("SELECT b FROM Bug b WHERE b.sprint.id = :sprintId OR (b.sprint IS NULL AND b.Task.sprint.id = :sprintId)")
    List<Bug> findBySprintId(@Param("sprintId") int sprintId);

    List<Bug> findByAssignedUser_Id(int userId);
}