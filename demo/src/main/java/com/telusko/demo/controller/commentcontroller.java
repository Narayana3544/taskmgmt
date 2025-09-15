package com.telusko.demo.controller;

import com.telusko.demo.Model.comment;
import com.telusko.demo.Model.story;
import com.telusko.demo.repo.commentrepo;
import com.telusko.demo.repo.userstoryrepo;
import com.telusko.demo.service.commentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class commentcontroller {

    @Autowired
    private commentrepo repo;

    @Autowired
    private commentService service;

    @PostMapping("/addComment/{TaskId}")
    public void addCommentToTask(@PathVariable int TaskId, @RequestBody comment Comment, Authentication authentication){
        service.addcommentToTask(TaskId,Comment,authentication);
    }

    @GetMapping("/viewComments/{taskId}")
    public List<comment> viewCommentsForTask(@PathVariable int taskId){
        return service.viewCommentsForTask(taskId);
    }



}
