package com.telusko.demo.controller;

import com.telusko.demo.Model.Project;
import com.telusko.demo.service.projectservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class projectcontroller {

    @Autowired
    private projectservice service;

    @PostMapping("/addproject")
    public Project addproject(@RequestBody Project project){
        return service.addproject(project);
    }

    @GetMapping("/projects")
    public List<Project> viewprojects(){
        return service.viewprojects();
    }

    @DeleteMapping("/projects/{id}")
    public void deleteproject(@PathVariable int id){
         service.deleteproject(id);
    }
    @PutMapping("/projects/{id}")
    public void updateproject(Project project,@PathVariable int id){
        service.updateproject(project,id);
    }
}
