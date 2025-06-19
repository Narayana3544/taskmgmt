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
@RequestMapping("/api")
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
//    @PostMapping("/login")
//    public ResponseEntity<Map<String, String>> login(@RequestParam String email,
//                                                     @RequestParam String password) {
//        boolean success = service.checkPassword(email, password);
//
//        if (success) {
//            return ResponseEntity.ok(Map.of("message", "Login successful"));
//        } else {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                    .body(Map.of("message", "Invalid credentials"));
//        }
//    }
@PostMapping("/login")
public ResponseEntity<String> login(@RequestBody Map<String, String> payload) {
    String email = payload.get("email");
    String password = payload.get("password");

    if (service.checkPassword(email, password)) {
        return ResponseEntity.ok("Login successful");
    } else {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}

}
