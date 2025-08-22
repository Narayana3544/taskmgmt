package com.telusko.demo.service;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Task_status;
import com.telusko.demo.Model.createsprint;
import com.telusko.demo.Model.task;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.repo.Task_statusrepo;
import com.telusko.demo.repo.createsprintrepo;
import com.telusko.demo.repo.featurerepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.config.Task;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class Taskservice {

    @Autowired
    public TaskRepository repo;

    @Autowired
    private featurerepo featureRepo;

    @Autowired
    private createsprintrepo sprintRepo;

    @Autowired
    private Task_statusrepo taskStatusRepository;

    public task createtask(task Task){
        return repo.save(Task);
    }

    public task updateTask(int id, task newTaskData, MultipartFile attachment) throws Exception {
        // Fetch existing task
        Optional<task> existingTaskOpt = repo.findById(id);
        if (existingTaskOpt.isEmpty()) {
            throw new RuntimeException("Task not found with id: " + id);
        }

        task existingTask = existingTaskOpt.get();

        // ✅ Update normal fields
        existingTask.setUserstory(newTaskData.getUserstory());
        existingTask.setDescription(newTaskData.getDescription());
        existingTask.setAcceptance_criteria(newTaskData.getAcceptance_criteria());
        existingTask.setStorypoints(newTaskData.getStorypoints());
        existingTask.setStart_date(newTaskData.getStart_date());
        existingTask.setEnd_date(newTaskData.getEnd_date());
        existingTask.setSprint(newTaskData.getSprint());
        existingTask.setFeature(newTaskData.getFeature());
        existingTask.setUser(newTaskData.getUser());
        existingTask.setTaskType(newTaskData.getTaskType());
        existingTask.setTaskStatus(newTaskData.getTaskStatus());
        existingTask.setReportedTo(newTaskData.getReportedTo());

        // ✅ Handle attachment
        if (attachment != null && !attachment.isEmpty()) {
            existingTask.setAttachmentName(attachment.getOriginalFilename());
            existingTask.setAttachment(attachment.getBytes());
        }
        // ⚠️ else → keep existing attachment as it is (do nothing)

        return repo.save(existingTask);
    }

    public Optional<task> viewTaskById(int id) {
        return repo.findById(id);
    }


    public task saveTask(task Task, MultipartFile attachment) throws IOException {
        if (attachment != null && !attachment.isEmpty()) {
            Task.setAttachment(attachment.getBytes());
            Task.setAttachmentName(attachment.getOriginalFilename());
            Task.setAttachmentType(attachment.getContentType());
            Task.setAttachment_flag("Yes");
        } else {
            Task.setAttachment_flag("No");
        }
        return repo.save(Task);
    }
    public task getTaskById(int id) {
        return repo.findById(id).orElse(null);
    }


    public task createTask(
            String userstory,
            String description,
            String acceptanceCriteria,
            Integer storypoints,
            String attachmentFlag,
            MultipartFile attachment,
            Long featureId,
            Long sprintId
    ) throws IOException {

        task newTask = new task();
        newTask.setUserstory(userstory);
        newTask.setDescription(description);
        newTask.setAcceptance_criteria(acceptanceCriteria);
        newTask.setStorypoints(storypoints);
        newTask.setAttachment_flag(attachmentFlag);

        // Set feature & sprint
        Feature feature = featureRepo.findById(Math.toIntExact(featureId))
                .orElseThrow(() -> new RuntimeException("Feature not found"));
        newTask.setFeature(feature);

        createsprint sprint = sprintRepo.findById(Math.toIntExact(sprintId))
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
        newTask.setSprint(sprint);

        // Save attachment as byte[]
        if ("yes".equalsIgnoreCase(attachmentFlag) && attachment != null && !attachment.isEmpty()) {
            newTask.setAttachment(attachment.getBytes());
            newTask.setAttachmentName(attachment.getOriginalFilename());
        }

        return repo.save(newTask);
    }

    public List<task> viewTasksByUserId(int userId) {
        return repo.findByUser_Id(userId);
    }

    public void updateTaskStatus(int taskId, int statusId) {
        task Task = repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Task_status status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new RuntimeException("Status not found"));
        Task.setTaskStatus(status);
       repo.save(Task);   // only updates task_status_id column
    }

    public List<task> viewTasksBySprintId(int sprintId) {
        return repo.findBySprint_id(sprintId);
    }

    public List<task> findUnassignedTasks(int featureId) {
        return repo.findBySprint_idIsNullAndFeature_id(featureId);
    }

    public void assignTasksToSprint(int sprintId, List<Integer> taskIds) {
        createsprint sprint = sprintRepo.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        List<task> Tasks = repo.findAllById(taskIds);
        for (task Task : Tasks) {
            Task.setSprint(sprint); // update sprint_id
        }

        repo.saveAll(Tasks); // batch update
    }

    public void assignTaskByUser(int taskId, Authentication authentication) {
        task Task = repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        Task.setUser(userDetails.getUser());
        repo.save(Task);
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
}

