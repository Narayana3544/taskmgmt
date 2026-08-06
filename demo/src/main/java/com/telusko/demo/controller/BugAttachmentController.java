package com.telusko.demo.controller;

import com.telusko.demo.repo.BugAttachmentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;

@RestController
public class BugAttachmentController {

    @Autowired
    public BugAttachmentRepo repo;

    @Transactional
    @DeleteMapping("/bugs/attachments/{id}")
    public ResponseEntity<String> deleteBugAttachment(@PathVariable Integer id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.ok("Attachment deleted successfully");
    }

}