package com.telusko.demo.service;

import com.telusko.demo.Model.task;
import com.telusko.demo.repo.new_task_repo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class new_task_service {

    @Autowired
    public new_task_repo repo;

    public task create_task(task task) {
        return repo.save(task);
    }

    public List<task> view_tasks(){
        return repo.findAll();
    }

    public task updateTask(task updatedTask) {
        return repo.save(updatedTask);
    }
}
