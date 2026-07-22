package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.dto.AttachmentDTO;
import com.telusko.demo.dto.BugDTO;
import com.telusko.demo.repo.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
public class BugService {

    @Autowired
    public BugRepo repo;

    @Autowired
    public BugAttachmentRepo bugAttachmentRepo;

    @Autowired
    public TaskRepository taskRepository;

    @Autowired
    public createsprintrepo sprintRepo;

    @Autowired
    public Priorityrepo priorityRepository;

    @Autowired
    public Task_statusrepo taskStatusRepository;

    @Autowired
    public userrepo userRepository;

    @Autowired
    public profilerepo userdetails;

    public Bug createBug(
            Integer taskId,
            String title,
            String description,
            int priorityId,
            Integer statusId,
            int assignedToId,
            Integer sprintId,
            Integer storypoints,
            Integer complexity,
            LocalDate targetDate,
            List<MultipartFile> attachments,
            int reporter
    ) {
        // Get task
        task taskEntity = null;
        if (taskId != null) {
            taskEntity = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));
        }

        // Get priority
        Priority priority = priorityRepository.findById(priorityId)
                .orElseThrow(() -> new RuntimeException("Priority not found"));

        // Get status (default = OPEN id=1)
        Task_status status = (statusId != null)
                ? taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new RuntimeException("Status not found"))
                : taskStatusRepository.findById(1)
                .orElseThrow(() -> new RuntimeException("Default Status not found"));

        // Get users
        User assignedUser = userRepository.findById(assignedToId);
        if (assignedUser == null)
            throw new RuntimeException("Assigned user not found");


        // reported user is the logged-in user
        User reportedUser = userdetails.findById(reporter)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));

        // Get Sprint (optional)
        createsprint sprintEntity = null;
        if (sprintId != null) {
            sprintEntity = sprintRepo.findById(sprintId)
                    .orElseThrow(() -> new RuntimeException("Sprint not found"));
        }

        // Create bug
        Bug bug = new Bug();
        bug.setTask(taskEntity);
        bug.setTitle(title);
        bug.setDescription(description);
        bug.setPriority(priority);
        bug.setStatus(status);
        bug.setReportedUser(reportedUser);
        bug.setAssignedUser(assignedUser);
        bug.setSprint(sprintEntity);
        bug.setStorypoints(storypoints);
        bug.setComplexity(complexity);
        bug.setTargetDate(targetDate);

        Bug savedBug = repo.save(bug);

        // Save attachments
        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                try {
                    BugAttachment attachment = new BugAttachment();
                    attachment.setBug(savedBug);
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setFileData(file.getBytes());
                    attachment.setUploadedBy(reportedUser);
                    bugAttachmentRepo.save(attachment);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to save attachment: " + file.getOriginalFilename(), e);
                }
            }
        }

        return savedBug;
    }

    public List<Bug> viewbugsByUserId(int userId) {
        return repo.findByAssignedUser_Id(userId);
    }

    public Bug updateBugStatus(int bugId, int statusId) {
        Bug bug = repo.findById(bugId).orElseThrow(() -> new RuntimeException("Bug not found"));
        Task_status status = taskStatusRepository.findById(statusId).orElseThrow(() -> new RuntimeException("Status not found"));
        bug.setStatus(status);
        return repo.save(bug);
    }

    public List<Bug> getBugsBySprint(int sprintId) {
        return repo.findBySprintId(sprintId);
    }

    @Transactional(readOnly = true)
    public BugDTO getBugById(Integer id) {
        Bug bug = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Bug not found"));

        // Convert entity → DTO
        List<AttachmentDTO> attachments = bug.getAttachments().stream()
                .map(att -> new AttachmentDTO(
                        att.getId(),
                        att.getFileName(),
                        att.getUploadedAt()
                ))
                .toList();

        return new BugDTO(
                bug.getId(),
                bug.getTitle(),
                bug.getDescription(),
                bug.getStatus().getDecription(),
                bug.getReportedUser() != null ? bug.getReportedUser().getFirst_name() : "-",
                bug.getAssignedUser() != null ? bug.getAssignedUser().getFirst_name() : "-",
                bug.getPriority().getDescription(),
                attachments
        );
    }

    @Transactional(readOnly = true)
    public byte[] downloadAttachment(Integer attachmentId) {
        BugAttachment att = (BugAttachment) bugAttachmentRepo.findAttachmentById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        return att.getFileData(); // this is your @Lob field
    }

    @Transactional
    public Bug updateBug(
            Integer id,
            String title,
            String description,
            int priorityId,
            Integer statusId,
            int assignedToId,
            List<MultipartFile> attachments,
            int reporterId
    ) {
        Bug bug = repo.findById(id).orElseThrow(() -> new RuntimeException("Bug not found"));
        
        Priority priority = priorityRepository.findById(priorityId)
                .orElseThrow(() -> new RuntimeException("Priority not found"));
        
        Task_status status = (statusId != null) 
                ? taskStatusRepository.findById(statusId).orElseThrow(() -> new RuntimeException("Status not found"))
                : bug.getStatus();
                
        User assignedUser = userRepository.findById(assignedToId);
        if (assignedUser == null) throw new RuntimeException("Assigned user not found");

        User reportedUser = userdetails.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("Reporter not found"));

        bug.setTitle(title);
        bug.setDescription(description);
        bug.setPriority(priority);
        bug.setStatus(status);
        bug.setAssignedUser(assignedUser);

        Bug updatedBug = repo.save(bug);

        if (attachments != null && !attachments.isEmpty()) {
            for (MultipartFile file : attachments) {
                try {
                    BugAttachment attachment = new BugAttachment();
                    attachment.setBug(updatedBug);
                    attachment.setFileName(file.getOriginalFilename());
                    attachment.setFileData(file.getBytes());
                    attachment.setUploadedBy(reportedUser);
                    bugAttachmentRepo.save(attachment);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to save attachment", e);
                }
            }
        }
        return updatedBug;
    }
}