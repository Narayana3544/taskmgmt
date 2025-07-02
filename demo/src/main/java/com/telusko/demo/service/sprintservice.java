package com.telusko.demo.service;

import com.telusko.demo.Model.createsprint;
import com.telusko.demo.repo.createsprintrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class sprintservice {

    @Autowired
    public createsprintrepo repo;

    public createsprint create(createsprint sprint){
        return repo.save(sprint);
    }

    public List<createsprint> view() {
        return repo.findAll();
    }
}
