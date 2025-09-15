package com.telusko.demo.controller;

import com.telusko.demo.service.TaskSprintTrackService;
import com.telusko.demo.service.Taskservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TaskSprintTrackController {

    @Autowired
    Taskservice taskservice;

    @Autowired
    TaskSprintTrackService service;
    
}
