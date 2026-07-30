package com.telusko.demo.controller;

import com.telusko.demo.Model.Bug;
import com.telusko.demo.Model.BugAttachment;
import com.telusko.demo.Model.Project;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.Model.createsprint;
import com.telusko.demo.dto.BugDTO;
import com.telusko.demo.dto.BugListDTO;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
            @RequestParam(required = false) Integer taskId,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam int priorityId,
            @RequestParam(required = false) Integer statusId,
            @RequestParam int assignedToId,
            @RequestParam(required = false) Integer sprintId,
            @RequestParam(required = false) Integer storypoints,
            @RequestParam(required = false) Integer complexity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
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
                sprintId,
                storypoints,
                complexity,
                targetDate,
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

    @GetMapping("/view-bugs")
    public ResponseEntity<List<BugListDTO>> viewAllBugs() {
        List<Bug> bugs = repo.findAll();
        List<BugListDTO> dtos = bugs.stream().map(bug -> {
            // Get project/feature/sprint from task.sprint or bug.sprint
            String projectName = null;
            String featureName = null;
            String sprintName = null;
            createsprint sprint = null;
            if (bug.getTask() != null && bug.getTask().getSprint() != null) {
                sprint = bug.getTask().getSprint();
            } else if (bug.getSprint() != null) {
                sprint = bug.getSprint();
            }
            
            if (sprint != null) {
                sprintName = sprint.getName();
                if (sprint.getFeature() != null) {
                    featureName = sprint.getFeature().getName();
                    if (sprint.getFeature().getProject() != null) {
                        projectName = sprint.getFeature().getProject().getName();
                    }
                }
            }
            
            if (projectName == null && bug.getTask() != null && bug.getTask().getFeature() != null) {
                featureName = bug.getTask().getFeature().getName();
                if (bug.getTask().getFeature().getProject() != null) {
                    projectName = bug.getTask().getFeature().getProject().getName();
                }
            }
            return new BugListDTO(
                bug.getId(),
                bug.getTitle(),
                bug.getDescription(),
                projectName,
                featureName,
                sprintName,
                bug.getStatus() != null ? bug.getStatus().getDecription() : null,
                bug.getStatus() != null ? bug.getStatus().getId() : null,
                bug.getPriority() != null ? bug.getPriority().getDescription() : null,
                bug.getPriority() != null ? bug.getPriority().getId() : null,
                bug.getAssignedUser() != null ? bug.getAssignedUser().getFirst_name() : null,
                bug.getAssignedUser() != null ? bug.getAssignedUser().getId() : null,
                bug.getReportedUser() != null ? bug.getReportedUser().getFirst_name() : null,
                bug.getCreatedAt()
            );
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/sprints/{sprintId}/bugs")
    public ResponseEntity<List<Bug>> getBugsBySprint(@PathVariable int sprintId) {
        List<Bug> bugs = bugService.getBugsBySprint(sprintId);
        return ResponseEntity.ok(bugs);
    }

    @PutMapping("/bugs/{bugId}/status/{statusId}")
    public ResponseEntity<String> updateBugStatus(@PathVariable int bugId, @PathVariable int statusId) {
        bugService.updateBugStatus(bugId, statusId);
        return ResponseEntity.ok("Status updated successfully");
    }

    @GetMapping("/user/bugs")
    @Transactional(readOnly = true)
    public List<Bug> viewMyBugs(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        return bugService.viewbugsByUserId(userId);
    }

    @GetMapping("/user/{userId}/bugs")
    public List<Bug> viewUserBugs(@PathVariable int userId) {
        return bugService.viewbugsByUserId(userId);
    }

    @GetMapping("view-bug/{id}")
    public ResponseEntity<BugDTO> getBug(@PathVariable Integer id) {
        return ResponseEntity.ok(bugService.getBugById(id));
    }

    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Integer attachmentId) {
        BugAttachment att = bugAttachmentRepo.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + att.getFileName() + "\"")
                .body(att.getFileData());
    }

    @PutMapping(value = "/bugs/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateBug(
            @PathVariable Integer id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam int priorityId,
            @RequestParam(required = false) Integer statusId,
            @RequestParam int assignedToId,
            @RequestParam(required = false) Integer sprintId,
            @RequestParam(required = false) Integer taskId,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        int reporterId = userDetails.getUser().getId();
        Bug updatedBug = bugService.updateBug(
                id,
                title,
                description,
                priorityId,
                statusId,
                assignedToId,
                sprintId,
                taskId,
                attachments,
                reporterId
        );
        return ResponseEntity.ok("Bug updated successfully");
    }

    @PutMapping("/bugs/{bugId}/move/{sprintId}")
    public ResponseEntity<String> moveBugToSprint(@PathVariable int bugId, @PathVariable int sprintId) {
        bugService.moveBugToSprint(bugId, sprintId);
        return ResponseEntity.ok("Bug moved successfully");
    }
}