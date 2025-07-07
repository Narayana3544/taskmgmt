package com.telusko.demo.controller;

import com.telusko.demo.Model.comment;
import com.telusko.demo.Model.story;
import com.telusko.demo.repo.commentrepo;
import com.telusko.demo.repo.userstoryrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@RestController
public class commentcontroller {
    @Autowired
    private userstoryrepo userStoryRepo;
    @Autowired
    private commentrepo commentRepo;

    @PostMapping("/userstories/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable int id, @RequestBody Map<String, String> body, Principal principal) {
        Optional<story> storyOpt = userStoryRepo.findById(id);
        if (storyOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Story not found");
        }

       story story = storyOpt.get();
        comment comment = new comment();
        comment.setText(body.get("text"));
        comment.setStory(story);
        comment.setAuthor(principal.getName()); // Or use userRepo to get preferred name
        commentRepo.save(comment);

        return ResponseEntity.ok("Comment added");
    }

}
