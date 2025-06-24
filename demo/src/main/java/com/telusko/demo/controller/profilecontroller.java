package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.userrepo;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin("origins = http://localhost:3000")
public class profilecontroller {

    public userrepo repo;

    @GetMapping("/profile")
    public User getLoggedUser(User user) {
            return repo.findById(user);
    }

}
