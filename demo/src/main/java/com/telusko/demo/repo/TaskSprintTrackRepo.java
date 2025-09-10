package com.telusko.demo.repo;

import com.telusko.demo.Model.TaskSprintTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskSprintTrackRepo extends JpaRepository<TaskSprintTrack,Integer> {
}
