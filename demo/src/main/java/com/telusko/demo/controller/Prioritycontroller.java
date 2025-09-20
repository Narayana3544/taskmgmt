package com.telusko.demo.controller;

import com.telusko.demo.Model.Priority;
import com.telusko.demo.repo.Priorityrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class Prioritycontroller {

    @Autowired
    public Priorityrepo repo;

    @GetMapping("/Priorities")
    public List<Priority> getpriority(){
        return repo.findAll();
    }
}