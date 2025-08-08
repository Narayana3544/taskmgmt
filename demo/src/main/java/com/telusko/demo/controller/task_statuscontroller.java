package com.telusko.demo.controller;

import com.telusko.demo.Model.Task_status;
import com.telusko.demo.repo.Task_statusrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class task_statuscontroller {

    @Autowired
    public Task_statusrepo repo;

    @GetMapping("/getstatus")
    public List<Task_status> getstatus(){
        return repo.findAll();
    }
}
