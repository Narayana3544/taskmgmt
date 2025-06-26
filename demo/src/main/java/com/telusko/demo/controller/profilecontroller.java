package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.userrepo;
import com.telusko.demo.service.profileservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Optional;

@RestController
public class profilecontroller {


    @Autowired
    public profileservice service;

    @Autowired
    public userrepo repo;

//    @GetMapping("/user/profile")
//    public ResponseEntity<User> getuser(int id){
//        User user=service.getUser(id);
//       return ResponseEntity.ok(user);
//    }
    @GetMapping("/greet")
    public String greet(){
        return "hi";
    }
    @GetMapping("/user/profile")
    public ResponseEntity<?> getProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        String email = principal.getName();
        Optional<User> optionalUser = repo.findByEmail(email);

        if (optionalUser.isPresent()) {
            return ResponseEntity.ok(optionalUser.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }


}
