package com.telusko.demo.controller;

import com.telusko.demo.Model.Task_type;
import com.telusko.demo.repo.Task_typerepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class Task_typecontroller {

    @Autowired
    public Task_typerepo repo;

    @GetMapping("/gettype")
    public List<Task_type> getstatus(){
        return repo.findAll();
    }
}
