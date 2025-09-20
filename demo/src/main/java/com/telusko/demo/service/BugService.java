package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.dto.AttachmentDTO;
import com.telusko.demo.dto.BugDTO;
import com.telusko.demo.repo.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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
    public Priorityrepo priorityRepository;

    @Autowired
    public Task_statusrepo taskStatusRepository;

    @Autowired
    public userrepo userRepository;

    @Autowired
    public profilerepo userdetails;

//    public Bug createBug(int taskId, String title, String description, int priorityId, Integer statusId, int assignedToId, List<MultipartFile> attachments, String name) {
        public Bug createBug(
        int taskId,
        String title,
        String description,
        int priorityId,
        Integer statusId,
        int assignedToId,
        List<MultipartFile> attachments,
        int reporter
    ) {
            // Get task
            task taskEntity = taskRepository.findById(taskId)
                    .orElseThrow(() -> new RuntimeException("Task not found"));

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

            // Create bug
            Bug bug = new Bug();
            bug.setTask(taskEntity);
            bug.setTitle(title);
            bug.setDescription(description);
            bug.setPriority(priority);
            bug.setStatus(status);
            bug.setReportedUser(reportedUser);
            bug.setAssignedUser(assignedUser);

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

//    public Bug editBugById(Integer id, Bug bug) {
//
//
//    }
}
