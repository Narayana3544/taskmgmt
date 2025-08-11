package com.telusko.demo.controller;


import com.telusko.demo.Model.task;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.service.Taskservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

public class TaskController {

    @Autowired
    public TaskRepository repo;

    @Autowired
    public Taskservice service;

    @PostMapping("/create-task")
    public task createtask(@RequestBody task Task){
        return service.createtask(Task);
    }
    @GetMapping("/view-tasks")
    public List<task> viewtask(){
        return repo.findAll();
    }

    @PutMapping("/task/{id}")
    public task updatetask(@PathVariable int id,@RequestBody task Task){
        return service.updateTask(id,Task);
    }
}
