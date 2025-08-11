package com.telusko.demo.service;

import com.telusko.demo.Model.task;
import com.telusko.demo.repo.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
            existingTask.setSprint_id(updatedTask.getSprint_id());
            existingTask.setStorypoints(updatedTask.getStorypoints());
            existingTask.setUserstory(updatedTask.getUserstory());
            existingTask.setDescription(updatedTask.getDescription());
            existingTask.setFeature_id(updatedTask.getFeature_id());
            existingTask.setStart_date(updatedTask.getStart_date());
            existingTask.setEnd_date(updatedTask.getEnd_date());
            existingTask.setTaskType(updatedTask.getTaskType());
            existingTask.setTask_status(updatedTask.getTask_status());

            return repo.save(existingTask);
        }).orElseThrow(() -> new RuntimeException("Task not found with id " + id));
    }
}
