package com.telusko.demo.controller;

import com.telusko.demo.repo.BugAttachmentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;

@RestController
public class BugAttachmentController {

    @Autowired
    public BugAttachmentRepo repo;

    @DeleteMapping("/bugs/attachments/{id}")
    public ResponseEntity<String> deleteBugAttachment(@PathVariable Integer id) {
        com.telusko.demo.Model.BugAttachment attachment = repo.findById(id).orElse(null);
        if (attachment != null) {
            com.telusko.demo.Model.Bug bug = attachment.getBug();
            if (bug != null) {
                bug.getAttachments().remove(attachment);
                // Also need to save the bug. We need a BugRepo.
            }
            repo.deleteById(id);
        }
        return ResponseEntity.ok("Attachment deleted successfully");
    }

}