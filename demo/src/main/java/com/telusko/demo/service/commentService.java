package com.telusko.demo.service;

import com.telusko.demo.Model.User;
import com.telusko.demo.Model.comment;
import com.telusko.demo.Model.task;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.repo.commentrepo;
import com.telusko.demo.repo.userrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class commentService {

    @Autowired
    private commentrepo repo;

    @Autowired
    private TaskRepository taskrepo;

    @Autowired
    private userrepo userRepository;


    public void addcommentToTask(int taskId, comment Comment, Authentication authentication) {
        Optional<task> Task= taskrepo.findById(taskId);
        if (Task == null) {
            throw new RuntimeException("Task not found with id " + taskId);
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getUser().getId());
           Comment.setUser(user);

        Comment.setTask(Task.get());
      repo.save(Comment);
    }

    public List<comment> viewCommentsForTask(int taskId) {
        return repo.findByTask_Id(taskId);
    }
}
