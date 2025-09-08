package com.telusko.demo.repo;

import com.telusko.demo.Model.Task_status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Task_statusrepo extends JpaRepository<Task_status,Integer> {

    List<Task_status> findByStatusCodeDescription(String description);
    List<Task_status> findByStatusCodeId(int id);
    Optional<Task_status> findByDecription(String name);
}
