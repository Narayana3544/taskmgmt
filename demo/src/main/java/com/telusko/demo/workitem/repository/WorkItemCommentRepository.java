package com.telusko.demo.workitem.repository;

import com.telusko.demo.workitem.entity.WorkItemComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkItemCommentRepository extends JpaRepository<WorkItemComment, Long> {
    List<WorkItemComment> findByWorkItemIdAndActiveTrueOrderByCommentedAtDesc(Long workItemId);

    List<WorkItemComment> findByWorkItemIdAndActiveTrue(Long workItemId);
}
