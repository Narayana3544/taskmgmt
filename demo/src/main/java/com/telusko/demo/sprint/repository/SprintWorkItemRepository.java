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

    @Query("SELECT new com.telusko.demo.sprint.dto.SprintOverviewResponse(" +
           "  COALESCE(SUM(CASE WHEN swi.removedAt IS NULL THEN 1L ELSE 0L END), 0L), " + // totalItems
           "  COALESCE(SUM(CASE WHEN w.status.code = 'DONE' AND swi.removedAt IS NULL THEN 1L ELSE 0L END), 0L), " + // completedItems
           "  COALESCE(SUM(CASE WHEN w.status.code NOT IN ('DONE', 'BLOCKED') AND swi.removedAt IS NULL THEN 1L ELSE 0L END), 0L), " + // pendingItems
           "  COALESCE(SUM(CASE WHEN w.status.code = 'BLOCKED' AND swi.removedAt IS NULL THEN 1L ELSE 0L END), 0L), " + // blockedItems
           "  COALESCE(SUM(CASE WHEN swi.removedAt IS NOT NULL THEN 1L ELSE 0L END), 0L) " + // spilloverItems
           ") " +
           "FROM SprintWorkItem swi " +
           "JOIN swi.workItem w " +
           "WHERE swi.sprint.id = :sprintId")
    com.telusko.demo.sprint.dto.SprintOverviewResponse getSprintOverview(@Param("sprintId") Long sprintId);
}
