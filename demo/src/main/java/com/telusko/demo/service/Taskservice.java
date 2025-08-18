package com.telusko.demo.service;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.createsprint;
import com.telusko.demo.Model.task;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.repo.createsprintrepo;
import com.telusko.demo.repo.featurerepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

@Service
public class Taskservice {

    @Autowired
    public TaskRepository repo;

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


    @Autowired
    private featurerepo featureRepo;

    @Autowired
    private createsprintrepo sprintRepo;

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

}
