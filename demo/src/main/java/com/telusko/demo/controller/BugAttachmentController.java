package com.telusko.demo.controller;

import com.telusko.demo.repo.BugAttachmentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BugAttachmentController {

    @Autowired
    public BugAttachmentRepo repo;



}
