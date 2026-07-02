package com.telusko.demo.repo;

import com.telusko.demo.Model.TaskAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAttachmentRepository extends JpaRepository<TaskAttachment, Integer> {
    List<TaskAttachment> findByTaskId(int taskId);
}
