package com.telusko.demo.service;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.profilerepo;
import com.telusko.demo.repo.userrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class profileservice {

    @Autowired
    public profilerepo repo;

    public User getUser(int id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }
}
