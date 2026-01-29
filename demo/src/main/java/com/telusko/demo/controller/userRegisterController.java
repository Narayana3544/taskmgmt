package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.Rolerepo;
import com.telusko.demo.repo.userrepo;
import com.telusko.demo.service.loginservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
public class userRegisterController
{
    @Autowired
    private loginservice loginservice;

    @Autowired
    private userrepo repo;

    @Autowired
    private Rolerepo rolerepo;

    PasswordEncoder encoder =new BCryptPasswordEncoder(10);

//    @PostMapping("/register")
//    public User adduser(@RequestBody User user){
//
//        return loginservice.register(user);
//    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User user) {
        // Check if email already exists
        Optional<User> existingUser = repo.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT) // 409
                    .body("Email already exists. Please login.");
        }

        // Find or create default USER role
        var defaultRole = rolerepo.findByName("USER")
            .orElseGet(() -> {
                var newRole = new com.telusko.demo.Model.Role();
                newRole.setName("USER");
                newRole.setDescription("Default user role");
                newRole.setActive(true);
                return rolerepo.save(newRole);
            });

        // Save new user
        user.setPassword(encoder.encode(user.getPassword()));
        user.setRole(defaultRole);
        repo.save(user);
        return ResponseEntity.ok("Registration successful!");
    }


}
