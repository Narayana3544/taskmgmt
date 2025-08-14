package com.telusko.demo.controller;


import com.telusko.demo.Model.task;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.service.Taskservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController

public class TaskController {

    @Autowired
    public TaskRepository repo;

    @Autowired
    public Taskservice service;

    @PostMapping("/create-task")
    public ResponseEntity<?> createTask(@RequestBody task Task) {
        try {
            task savedTask = repo.save(Task);
            return ResponseEntity.ok(savedTask);
        } catch (Exception e) {
            e.printStackTrace(); // Logs error in backend console
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/view-tasks")
    public List<task> viewtask(){
        return repo.findAll();
    }

    @PutMapping("/task/{id}")
    public task updatetask(@PathVariable int id,@RequestBody task Task){
        return service.updateTask(id,Task);
    }
    @GetMapping("/view-task/{id}")
    public Optional<task> viewTaskByID(@PathVariable int id){
        return service.viewTaskById(id);
    }
}
