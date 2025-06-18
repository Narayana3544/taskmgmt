package com.telusko.demo.controller;


import com.telusko.demo.Model.User;
import com.telusko.demo.service.loginservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class logincontroller {

    @Autowired
    private loginservice service;

    @GetMapping("/users")
    public List<User> getusers() {
        return service.getusers();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable int id) {
        boolean deleted = service.deleteUserById(id);

        if (deleted) {
            return ResponseEntity.ok("User deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

    }
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestParam int id,
                                                     @RequestParam String password) {
        boolean success = service.checkPassword(id, password);

        if (success) {
            return ResponseEntity.ok(Map.of("message", "Login successful"));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

}
