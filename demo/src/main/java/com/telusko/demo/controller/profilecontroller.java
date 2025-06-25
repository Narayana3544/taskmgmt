package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.userrepo;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin("origins = http://localhost:3000")
public class profilecontroller {

    @Autowired
    public userrepo repo;

    @GetMapping("/profile/{id}")
    public void finduser(@PathVariable int id){
        repo.findById(id);
    }
}
