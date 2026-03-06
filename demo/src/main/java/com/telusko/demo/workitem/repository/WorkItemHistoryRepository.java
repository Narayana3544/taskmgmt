package com.telusko.demo.workitem.repository;

import com.telusko.demo.workitem.entity.WorkItemHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkItemHistoryRepository extends JpaRepository<WorkItemHistory, Long> {
    List<WorkItemHistory> findByWorkItemIdOrderByPerformedAtDesc(Long workItemId);
}
