package com.telusko.demo.repo;

import com.telusko.demo.Model.Task_track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskTrackRepo extends JpaRepository<Task_track,Integer> {
}
