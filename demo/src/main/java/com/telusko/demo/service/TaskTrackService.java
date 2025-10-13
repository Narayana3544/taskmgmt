package com.telusko.demo.service;

import com.telusko.demo.Model.Task_track;
import com.telusko.demo.Model.User;
import com.telusko.demo.Model.task;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.repo.TaskTrackRepo;
import com.telusko.demo.repo.userrepo;
import javax.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TaskTrackService {

    @Autowired
    TaskTrackRepo repo;

    @Autowired
    TaskRepository Taskrepo;

    @Autowired
    userrepo Userrepo;

    @Transactional
    public void assignTask(int taskId, int newUserId) {
        // 1. Find task
        task existingTask = Taskrepo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User fromUser = existingTask.getUser();

        User toUser = Userrepo.findById(newUserId);
        if (toUser == null) {
            throw new RuntimeException("User not found");
        }

        Task_track track = new Task_track();
        track.setTask(existingTask);
        track.setFromuser(fromUser);
        track.setTouser(toUser);
        repo.save(track);

        existingTask.setUser(toUser);
        Taskrepo.save(existingTask);
    }

}
