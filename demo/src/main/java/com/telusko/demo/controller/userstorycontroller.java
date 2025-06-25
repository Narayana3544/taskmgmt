package com.telusko.demo.controller;

import com.telusko.demo.Model.Userstory;
import com.telusko.demo.service.userstoryservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class userstorycontroller {

    @Autowired
    public userstoryservice service;

    @PostMapping("/adduserstory")
    public Userstory adduserstory(@RequestBody Userstory story){
        return service.adduserstory(story);
    }
}
