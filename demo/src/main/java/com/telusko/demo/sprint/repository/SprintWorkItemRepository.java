package com.telusko.demo.sprint.repository;

import com.telusko.demo.sprint.entity.SprintWorkItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintWorkItemRepository extends JpaRepository<SprintWorkItem, Long> {
    List<SprintWorkItem> findBySprintIdAndRemovedAtIsNull(Long sprintId);

    Optional<SprintWorkItem> findBySprintIdAndWorkItemIdAndRemovedAtIsNull(Long sprintId, Long workItemId);

    @Query("SELECT swi FROM SprintWorkItem swi WHERE swi.workItem.id = :workItemId AND swi.removedAt IS NULL")
    List<SprintWorkItem> findActiveByWorkItemId(@Param("workItemId") Long workItemId);
}
