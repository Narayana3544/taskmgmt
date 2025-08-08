package com.telusko.demo.controller;

import com.telusko.demo.Model.task;
import com.telusko.demo.service.new_task_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class new_task_controller {

    @Autowired
    public new_task_service service;

    @PostMapping("/create-task")
    public task createtask(@RequestBody task Task){
        return service.create_task(Task);
    }
    @GetMapping("/tasks")
    public List<task> viewtask(){
        return service.view_tasks();
    }
    @PutMapping("/tasks/{id}")
    public task updateTask(@PathVariable int id, @RequestBody task updatedTask) {
        updatedTask.setId(id);
        return service.updateTask(updatedTask);
    }
}
