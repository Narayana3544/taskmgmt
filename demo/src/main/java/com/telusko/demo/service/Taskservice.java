package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.*;
import jakarta.persistence.Tuple;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.config.Task;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Autowired
    private userrepo UserRepo;

    @Autowired
    private Teamrepo teamRepository;

    @Autowired
    private ProjectRepository projectRepo;

    @Autowired
    private featurerepo FeatureRepo;

    @Autowired
    private Task_typerepo taskTypeRepo;

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
            Long sprintId,
            Long userId,
            Long reportedToId,
            Long taskTypeId,
            Long taskStatusId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) throws IOException {

        task newTask = new task();
        newTask.setUserstory(userstory);
        newTask.setDescription(description);
        newTask.setAcceptance_criteria(acceptanceCriteria);
        newTask.setStorypoints(storypoints);
        newTask.setAttachment_flag(attachmentFlag);
        newTask.setStart_date(startDate);
        newTask.setEnd_date(endDate);

        // Feature (required)
        Feature feature = featureRepo.findById(Math.toIntExact(featureId))
                .orElseThrow(() -> new RuntimeException("Feature not found"));
        newTask.setFeature(feature);

        // Sprint (optional)
        if (sprintId != null) {
            createsprint sprint = sprintRepo.findById(Math.toIntExact(sprintId))
                    .orElseThrow(() -> new RuntimeException("Sprint not found"));
            newTask.setSprint(sprint);
        }

        // Assignee (optional)
        if (userId != null) {
            User user = UserRepo.findById(Math.toIntExact(userId));
//                    .orElseThrow(() -> new RuntimeException("User not found"));
            newTask.setUser(user);
        }

        // ReportedTo (optional)
        if (reportedToId != null) {
            User manager = UserRepo.findById(Math.toIntExact(reportedToId));
//                    .orElseThrow(() -> new RuntimeException("ReportedTo user not found"));
            newTask.setReportedTo(manager);
        }

        // TaskType (optional)
        if (taskTypeId != null) {
            Task_type type = taskTypeRepo.findById(Math.toIntExact(taskTypeId))
                    .orElseThrow(() -> new RuntimeException("TaskType not found"));
            newTask.setTaskType(type);
        }

        // TaskStatus (optional)
        if (taskStatusId != null) {
            Task_status status = taskStatusRepository.findById(Math.toIntExact(taskStatusId))
                    .orElseThrow(() -> new RuntimeException("TaskStatus not found"));
            newTask.setTaskStatus(status);
        }

        // Attachment (optional)
        if ("Yes".equalsIgnoreCase(attachmentFlag) && attachment != null && !attachment.isEmpty()) {
            newTask.setAttachment(attachment.getBytes());
            newTask.setAttachmentName(attachment.getOriginalFilename());
        }

        return repo.save(newTask);
    }

    public List<task> viewTasksByUserId(int userId) {
        return repo.findByUser_Id(userId);
    }

    public void updateTaskStatus(int taskId, int statusId) {
        LocalDate today = LocalDate.now();
        task Task = repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Task_status status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new RuntimeException("Status not found"));
        if(status.getDecription().equals("In Progress")){
            Task.setStart_date(today.atStartOfDay());
        }
       else if(status.getDecription().equals("Done")){
            Task.setEnd_date(today.atStartOfDay());
        }
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
            Task.setSprint(sprint);
        }

        repo.saveAll(Tasks);

    }

    public void assignTaskByUser(int taskId, Authentication authentication) {
        task Task = repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        Task.setUser(userDetails.getUser());
        repo.save(Task);
    }

    public void reportTask(int taskId, int managerId) {
        task Task=repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Task.setReportedTo(UserRepo.findById(managerId));
        repo.save(Task);
    }

    public void assignTask(int taskId, int userId) {
        task Task=repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Task.setUser(UserRepo.findById(userId));
        repo.save(Task);
    }

    public List<Team> viewUsersByTaskId(int taskId) {
        Optional<task> Task=repo.findById(taskId);
        int projectId=Task.get().getFeature().getProject().getId();
        return teamRepository.findByProject_Id(projectId);
    }

    public Page<task> getAllTasks(PageRequest pageable) {
        return repo.findAll(pageable);
    }


    public List<createsprint> viewSprintsByTaskId(int taskId) {
        int featureId=repo.findById(taskId).get().getFeature().getId();
        return sprintRepo.findByFeatureId(featureId);
    }

    public List<task> viewTasksBYProjectId(int projectId) {
        List<Feature> features=featureRepo.findByProjectId(projectId);
        List<task>Tasks=new ArrayList<>();
        for(Feature F:features){
            int featureId=F.getId();
            Tasks.addAll(repo.findByFeature_id(featureId));
        }
        return Tasks;
    }

    public void moveTaskToNextSprint(int taskId, int sprintId) {
        task Task=repo.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        createsprint Sprint=sprintRepo.findById(sprintId).orElseThrow(()->new RuntimeException(("sprint not found")));
        Task.setSprint(Sprint);
        repo.save(Task);
    }

    public List<task> viewActiveTasksByUserId(int userId) {
        List<task> tasks=repo.findByUser_Id(userId);

        List<task> ActiveTasks=new ArrayList<>();
        for(task t: tasks){
            if(t.getTaskStatus().getDecription().equals("In Progress")){
                ActiveTasks.add(t);
            }
        }
        return ActiveTasks;

    }

    public List<task> viewActiveSprintTasksByUserId(int userId) {
       // List<Project> projects=new ArrayList<>();
        List<Team> new_team=teamRepository.findProjectsByUser_id(userId);
        List<Feature> features=new ArrayList<>();
        List<createsprint> sprints=new ArrayList<>();

        List<task> tasks=new ArrayList<>();

        for(Team f:new_team){
            features.addAll(featureRepo.findByProjectId(f.getProject().getId()));
        }
        for(Feature f: features){
            sprints.addAll(sprintRepo.findByFeatureId(f.getId()));
        }
        System.out.println("Teams: " + new_team.size());
        System.out.println("Features: " + features.size());
        System.out.println("Sprints: " + sprints.size());
        for(createsprint s:sprints){
            System.out.println("Sprint " + s.getId() + " status = " + s.getStatus());
            if(s.getStatus().equals("Active")) {
                List<task> usertasks=new ArrayList<>();
                usertasks.addAll(repo.findBySprint_id(s.getId()));
                for(task t:usertasks){
                    if(t.getUser().getId()==userId){
                        tasks.add(t);
                    }
                }
            }
        }
        return tasks;
    }
}



