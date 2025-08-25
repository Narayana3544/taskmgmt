package com.telusko.demo.controller;


import com.telusko.demo.Model.User;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.userrepo;
import com.telusko.demo.service.CustomUserDetailsService;
import com.telusko.demo.service.loginservice;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.catalina.Authenticator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class logincontroller {

    @Autowired
    private loginservice service;
    @Autowired
    private userrepo repo;

    @Autowired
    public CustomUserDetailsService Service;

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

    @Autowired
    private AuthenticationManager authManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User request, HttpServletRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(auth);

        req.getSession().setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext()
        );

        return ResponseEntity.ok("Login successful");
    }


    @GetMapping("/register/{id}")
    public ResponseEntity<User> getRegisterById(@PathVariable Long id) {
        User user = service.getUserById(id); // ✅ Ensure this returns a proper User object
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/managers")
    public List<User> getManagers() {
        return service.getManagers();
    }

    @GetMapping("/users/me")
    public User getloggedUser(Authentication authentication){
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        return repo.findById(userId);

    }

}




