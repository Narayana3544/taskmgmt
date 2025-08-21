package com.telusko.demo.controller;


import com.telusko.demo.Model.task;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.service.Taskservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController

public class TaskController {

    @Autowired
    public TaskRepository repo;

    @Autowired
    public Taskservice service;

    @PostMapping("/create-task")
    public ResponseEntity<?> createTask(@RequestBody task Task) {
        try {
            task savedTask = repo.save(Task);
            return ResponseEntity.ok(savedTask);
        } catch (Exception e) {
            e.printStackTrace(); // Logs error in backend console
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/view-tasks")
    public List<task> viewtask(){
        return repo.findAll();
    }

//    @PutMapping("/task/{id}")
//    public task updatetask(@PathVariable int id,@RequestBody task Task){
//        return service.updateTask(id,Task);
//    }
    @GetMapping("/view-task/{id}")
    public Optional<task> viewTaskByID(@PathVariable int id){
        return service.viewTaskById(id);
    }


    @PostMapping("/create-task-attach")
    public ResponseEntity<?> createTask(
            @RequestPart("task") task Task,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment) {
        try {
            task savedTask = service.saveTask(Task, attachment);
            return ResponseEntity.ok(savedTask);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    @GetMapping("/{id}/attachment")
    public ResponseEntity<byte[]> getAttachment(@PathVariable int id) {
        task Task = service.getTaskById(id);
        if (Task != null && Task.getAttachment() != null) {
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + Task.getAttachmentName() + "\"")
                    .header("Content-Type", Task.getAttachmentType())
                    .body(Task.getAttachment());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTask(
            @RequestParam("userstory") String userstory,
            @RequestParam("description") String description,
            @RequestParam("acceptance_criteria") String acceptanceCriteria,
            @RequestParam("storypoints") Integer storypoints,
            @RequestParam("attachment_flag") String attachmentFlag,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment,
            @RequestParam("feature_id") Long featureId,
            @RequestParam("sprint_id") Long sprintId
    ) {
        try {
            task savedTask = service.createTask(
                    userstory,
                    description,
                    acceptanceCriteria,
                    storypoints,
                    attachmentFlag,
                    attachment,
                    featureId,
                    sprintId
            );
            return ResponseEntity.ok(savedTask);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tasks/{id}/download")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable int id) {
        Optional<task> taskOptional = repo.findById(id);

        if (taskOptional.isEmpty() || taskOptional.get().getAttachment() == null) {
            return ResponseEntity.notFound().build();
        }

        task Task = taskOptional.get();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + Task.getAttachmentName() + "\"")
                .contentType(MediaType.parseMediaType(Task.getAttachmentType()))
                .body(Task.getAttachment());
    }
    @PutMapping("/task/{id}")
    public ResponseEntity<task> updateTask(
            @PathVariable int id,
            @RequestPart("task") task Task,   // JSON part
            @RequestPart(value = "attachment", required = false) MultipartFile attachment // File part
    ) {
        try {
            task updatedTask = service.updateTask(id, Task, attachment);
            return ResponseEntity.ok(updatedTask);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/tasks")
    public List<task> viewMyTasks(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        return service.viewTasksByUserId(userId);
    }

    @PutMapping("/tasks/{taskId}/status/{statusId}")
    public ResponseEntity<String> updateTaskStatus(@PathVariable int taskId, @PathVariable int statusId) {
      service.updateTaskStatus(taskId, statusId);
        return ResponseEntity.ok("Task status updated successfully");
    }

    @GetMapping("/sprint/viewtaskBySprintId/{sprintId}")
    public List<task> viewTasksBySprintId(@PathVariable int sprintId){
        return service.viewTasksBySprintId(sprintId);
    }

    @GetMapping("/tasks/unassigned-toSprint/{featureId}")
    public List<task> findUnassignedTasks(@PathVariable int featureId){
        return service.findUnassignedTasks(featureId);
    }
    @PutMapping("/sprints/{sprintId}/assign-tasks")
    public ResponseEntity<String> assignTasksToSprint(
            @PathVariable int sprintId,
            @RequestBody List<Integer> taskIds) {

        service.assignTasksToSprint(sprintId, taskIds);
        return ResponseEntity.ok("Tasks assigned successfully");
    }

}
