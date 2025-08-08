package com.telusko.demo.repo;

import com.telusko.demo.Model.task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface new_task_repo extends JpaRepository<task,Integer> {

}
