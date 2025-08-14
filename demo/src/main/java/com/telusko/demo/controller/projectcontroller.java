package com.telusko.demo.controller;

import com.telusko.demo.Model.Project;
import com.telusko.demo.service.projectservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
    public Project updateproject(@PathVariable Long id,@RequestBody Project project){
       return service.updateProject(id,project);
    }

    @GetMapping("/projects/{id}")
    public ResponseEntity<Project> getProjectByid(@PathVariable long id) {
        Optional<Project> project = service.getProjectByid(id);
        return project
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
