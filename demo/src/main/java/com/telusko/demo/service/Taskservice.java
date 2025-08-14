package com.telusko.demo.service;

import com.telusko.demo.Model.task;
import com.telusko.demo.repo.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class Taskservice {

    @Autowired
    public TaskRepository repo;

    public task createtask(task Task){
        return repo.save(Task);
    }

    public task updateTask(int id, task updatedTask) {
        return repo.findById(id).map(existingTask -> {
            existingTask.setAcceptance_criteria(updatedTask.getAcceptance_criteria());
            existingTask.setAttachment_flag(updatedTask.getAttachment_flag());
            existingTask.setSprint(updatedTask.getSprint());
            existingTask.setStorypoints(updatedTask.getStorypoints());
            existingTask.setUserstory(updatedTask.getUserstory());
            existingTask.setDescription(updatedTask.getDescription());
            existingTask.setFeature(updatedTask.getFeature());
            existingTask.setStart_date(updatedTask.getStart_date());
            existingTask.setEnd_date(updatedTask.getEnd_date());
            existingTask.setTaskType(updatedTask.getTaskType());
            existingTask.setTaskStatus(updatedTask.getTaskStatus());

            return repo.save(existingTask);
        }).orElseThrow(() -> new RuntimeException("Task not found with id " + id));
    }

    public Optional<task> viewTaskById(int id) {
        return repo.findById(id);
    }
}
