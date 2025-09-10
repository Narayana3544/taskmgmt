package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.repo.TaskSprintTrackRepo;
import com.telusko.demo.repo.sprintrepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TaskSprintTrackService {

    @Autowired
  public TaskSprintTrackRepo repo;

    @Autowired
    public TaskRepository Taskrepo;

    @Autowired
    public sprintrepo SprintRepo;


    @Transactional
    public void MoveTaskToAnySprint(int taskId, int newSprintId) {
        task existingTask = Taskrepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        createsprint existingSprint=existingTask.getSprint();
        createsprint newSprint=SprintRepo.findById(newSprintId)
                .orElseThrow(()->new RuntimeException("Sprint not found"));

        TaskSprintTrack track = new TaskSprintTrack();
        track.setTask(existingTask);
        track.setFromSprint(existingSprint);
        track.setToSprint(newSprint);
        repo.save(track);
        existingTask.setSprint(newSprint);
        Taskrepo.save(existingTask);
    }
}
