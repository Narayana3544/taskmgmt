package com.telusko.demo.controller;


import com.telusko.demo.Model.Team;
import com.telusko.demo.Model.User;
import com.telusko.demo.Model.createsprint;
import com.telusko.demo.Model.task;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.service.TaskSprintTrackService;
import com.telusko.demo.service.TaskTrackService;
import com.telusko.demo.service.Taskservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController

public class TaskController {

    @Autowired
    public TaskRepository repo;

    @Autowired
    public Taskservice service;

    @Autowired
    public TaskTrackService taskTrackService;

    @Autowired
    public TaskSprintTrackService taskSprintTrackService;

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

//    @GetMapping("/view-tasks")
//    public List<task> viewtask(){
//        return repo.findAll();
//    }

    @GetMapping("/view-tasks")
    public Page<task> getTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return service.getAllTasks(PageRequest.of(page, size));
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
            @RequestParam(value = "storypoints", required = false) Integer storypoints,
            @RequestParam("attachment_flag") String attachmentFlag,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment,
            @RequestParam("feature_id") Long featureId,
            @RequestParam(value = "sprint_id", required = false) Long sprintId,
            @RequestParam(value = "user_id", required = false) Long userId,
            @RequestParam(value = "reportedTo", required = false) Long reportedToId,
            @RequestParam(value = "taskType_id", required = false) Long taskTypeId,
            @RequestParam(value = "taskStatus_id", required = false) Long taskStatusId,
            @RequestParam(value = "start_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "end_date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
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
                    sprintId,
                    userId,
                    reportedToId,
                    taskTypeId,
                    taskStatusId,
                    startDate,
                    endDate
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
    @PutMapping("/tasks/{taskId}/assignMe")
    public ResponseEntity<String> assignTask(@PathVariable int taskId,Authentication authentication) {
        service.assignTaskByUser(taskId,authentication);
        return ResponseEntity.ok("Task Assigned successfully");
    }

    @PutMapping("/tasks/{taskId}/unassignMe")
    public ResponseEntity<String> unassignTask(@PathVariable int taskId, Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();

        task Task = repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (Task.getUser() != null && Task.getUser().getId() == userId) {
            Task.setUser(null);
            repo.save(Task);
            return ResponseEntity.ok("Task unassigned successfully");
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can't unassign this task");
        }
    }

    @PutMapping("/tasks/{taskId}/assignReportTo/{managerId}")
    public ResponseEntity<String> reportTask(@PathVariable int taskId,@PathVariable int managerId ) {
        service.reportTask(taskId, managerId);
        return ResponseEntity.ok("Task Assigned successfully");
    }
    @PutMapping("/tasks/{taskId}/assignTo/{userId}")
    public ResponseEntity<String> assignTask(@PathVariable int taskId, @PathVariable int userId) {
        try {
            taskTrackService.assignTask(taskId, userId);
            return ResponseEntity.ok("Task Assigned successfully");
        } catch (Exception e) {
            e.printStackTrace(); // log in console
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error assigning task: " + e.getMessage());
        }
    }


    @GetMapping("/tasks/viewUsers/{taskId}")
    public List<Team> viewUsersBytaskId(@PathVariable int taskId){
        return service.viewUsersByTaskId(taskId);
    }

    @GetMapping("/viewTaskSprints/{taskId}")
    public List<createsprint> ViewSprintsOnTasks(@PathVariable int taskId){
        return service.viewSprintsByTaskId(taskId);
    }

    @GetMapping("/viewTaskByProjectId/{ProjectId}")
    public List<task> ViewTasksByProjectId(@PathVariable int ProjectId){
        return service.viewTasksBYProjectId(ProjectId);
    }

    @PutMapping("/tasks/{taskId}/move/{SprintId}")
    public ResponseEntity<String> moveTaskToNextSprint(@PathVariable int taskId, @PathVariable int SprintId) {
        try {
//          service.moveTaskToNextSprint(taskId,SprintId);
            taskSprintTrackService.MoveTaskToAnySprint(taskId,SprintId);
            return ResponseEntity.ok("Task Assigned successfully");
        } catch (Exception e) {
            e.printStackTrace(); // log in console
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error moving task to next sprint: " + e.getMessage());
        }
    }
}
