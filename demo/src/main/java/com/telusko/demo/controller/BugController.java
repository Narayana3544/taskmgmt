package com.telusko.demo.controller;

import com.telusko.demo.Model.Bug;
import com.telusko.demo.Model.BugAttachment;
import com.telusko.demo.Model.Project;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.dto.BugDTO;
import com.telusko.demo.repo.BugAttachmentRepo;
import com.telusko.demo.repo.BugRepo;
import com.telusko.demo.service.BugService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class BugController {

    @Autowired
    public BugService bugService;

    @Autowired
    public BugRepo repo;

    @Autowired
    public BugAttachmentRepo bugAttachmentRepo;

    @PostMapping(value = "/bugs",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Bug> createBug(
            @RequestParam int taskId,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam int priorityId,
            @RequestParam(required = false) Integer statusId,
            @RequestParam int assignedToId,
            @RequestPart(required = false) List<MultipartFile> attachments,
            @AuthenticationPrincipal CustomUserDetails userDetails
    )

    {
        int reporterId = userDetails.getUser().getId();
        Bug createdBug = bugService.createBug(
                taskId,
                title,
                description,
                priorityId,
                statusId,
                assignedToId,
                attachments,
                reporterId
        );
        return ResponseEntity.ok(createdBug);
    }

    @GetMapping("/bugs/byTask/{taskId}")
    public ResponseEntity<List<Bug>> getBugsByTask(@PathVariable int taskId) {
        List<Bug> bugs = repo.findByTaskId(taskId);
        return ResponseEntity.ok(bugs);
    }

    @GetMapping("/user/bugs")
    public List<Bug> viewMyBugs(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        return bugService.viewbugsByUserId(userId);
    }
    @GetMapping("view-bug/{id}")
    public ResponseEntity<BugDTO> getBug(@PathVariable Integer id) {
        return ResponseEntity.ok(bugService.getBugById(id));
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Integer attachmentId) {
        byte[] fileData = bugService.downloadAttachment(attachmentId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attachment-" + attachmentId + "\"")
                .body(fileData);
    }

//    @PutMapping("/edit-bug/{id}")
//    public ResponseEntity<Bug> editBug(@PathVariable Integer id,@RequestBody Bug bug) {
//        return repo.findById(id)
//                .map(bug1 -> {
//                    bug.setTitle();
//                    bug.setDescription(updatedProject.getDescription());
//                    bug.setStatus(updatedProject.getStatus());
//                    return repo.save(bug);
//                })
//                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
//    }

}