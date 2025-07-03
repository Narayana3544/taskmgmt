package com.telusko.demo.controller;

import com.telusko.demo.Model.Sprint;
import com.telusko.demo.Model.Sprint_users;
import com.telusko.demo.Model.User;
import com.telusko.demo.Model.createsprint;
import com.telusko.demo.repo.createsprintrepo;
//import com.telusko.demo.repo.sprintusersrepo;
import com.telusko.demo.repo.userrepo;
import com.telusko.demo.service.sprintservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
public class sprintcontroller {

    @Autowired
    public sprintservice service;

    @Autowired
    public createsprintrepo sprintRepo;

    @Autowired
    public userrepo userRepo;

    @PostMapping("/create-sprints")
    public createsprint create(@RequestBody createsprint sprint){
        return service.create(sprint);
    }

    @GetMapping("/sprints")
    public List<createsprint> viewsprints(){
        return service.view();
    }
    @GetMapping("/sprints/{sprintId}")
    public Optional<createsprint> viewsprintsbyid(@PathVariable int sprintId){
        return sprintRepo.findById(sprintId);
    }

    @PostMapping("/sprints/{sprintId}/assign-users")
    public ResponseEntity<?> assignUsersToSprint(@PathVariable int sprintId, @RequestBody List<Long> userIds) {
        Optional<createsprint> sprintOpt = sprintRepo.findById(sprintId);
        if (sprintOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sprint not found");
        }

        List<User> users = userRepo.findAllById(userIds);
        if (users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No valid users found");
        }

        createsprint sprint = sprintOpt.get();
        sprint.setUsers(users);
        sprintRepo.save(sprint);

        return ResponseEntity.ok("Users assigned successfully");
    }

}


