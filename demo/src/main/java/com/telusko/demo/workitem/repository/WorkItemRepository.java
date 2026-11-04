package com.telusko.demo.workitem.repository;

import com.telusko.demo.project.entity.BoardColumn;
import com.telusko.demo.workitem.entity.WorkItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkItemRepository extends JpaRepository<WorkItem, Long>, JpaSpecificationExecutor<WorkItem> {

    @Override
    @EntityGraph(attributePaths = {"project", "status", "priority", "type", "owner", "assignee", "boardColumn"})
    Page<WorkItem> findAll(Specification<WorkItem> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"project", "status", "priority", "type", "owner", "assignee", "boardColumn"})
    List<WorkItem> findAll(Specification<WorkItem> spec);

    Page<WorkItem> findByProjectIdAndActiveTrue(Long projectId, Pageable pageable);

    @Query("SELECT w FROM WorkItem w WHERE w.project.id = :projectId AND w.active = true " +
           "AND LOWER(w.title) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<WorkItem> findByProjectIdAndActiveTrueAndSearch(@Param("projectId") Long projectId, @Param("search") String search, Pageable pageable);

    List<WorkItem> findByAssigneeIdAndActiveTrue(Long assigneeId);

    Page<WorkItem> findByAssigneeIdAndActiveTrue(Long assigneeId, Pageable pageable);

    // RULE: "My items" = user is OWNER or ASSIGNEE
    @Query("SELECT w FROM WorkItem w " +
           "LEFT JOIN FETCH w.assignee " +
           "LEFT JOIN FETCH w.owner " +
           "LEFT JOIN FETCH w.project " +
           "LEFT JOIN FETCH w.status " +
           "LEFT JOIN FETCH w.type " +
           "LEFT JOIN FETCH w.priority " +
           "WHERE w.active = true AND (w.owner.id = :ownerId OR w.assignee.id = :assigneeId)")
    Page<WorkItem> findByOwnerIdOrAssigneeIdAndActiveTrue(
            @Param("ownerId") Long ownerId,
            @Param("assigneeId") Long assigneeId,
            Pageable pageable);

    @Query("SELECT w FROM WorkItem w WHERE w.project.id = :projectId AND w.active = true AND w.status.code = :statusCode")
    List<WorkItem> findByProjectIdAndStatusCodeAndActiveTrue(
            @Param("projectId") Long projectId,
            @Param("statusCode") String statusCode);

    @Query("SELECT w FROM WorkItem w " +
           "LEFT JOIN FETCH w.assignee " +
           "LEFT JOIN FETCH w.owner " +
           "LEFT JOIN FETCH w.status " +
           "LEFT JOIN FETCH w.type " +
           "LEFT JOIN FETCH w.priority " +
           "LEFT JOIN FETCH w.project " +
           "WHERE w.project.id = :projectId AND w.active = true " +
           "AND w.id NOT IN (SELECT swi.workItem.id FROM SprintWorkItem swi WHERE swi.removedAt IS NULL) " +
           "AND (w.status IS NULL OR w.status.code != 'DONE')")
    List<WorkItem> findBacklogItems(@Param("projectId") Long projectId);

    @Query("SELECT w FROM WorkItem w WHERE w.project.id = :projectId AND w.active = true AND w.status.code = :statusCode")
    List<WorkItem> findByProjectIdAndStatusCode(@Param("projectId") Long projectId,
            @Param("statusCode") String statusCode);

    @Query("SELECT COUNT(w) FROM WorkItem w WHERE w.project.id = :projectId AND w.active = true")
    long countByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT COUNT(w) FROM WorkItem w WHERE w.project.id = :projectId AND w.active = true AND (w.status IS NULL OR w.status.code != 'DONE')")
    long countOpenItemsByProjectId(@Param("projectId") Long projectId);

    // Find items not DONE in a sprint (for spillover)
    @Query("SELECT w FROM WorkItem w JOIN w.project p " +
            "WHERE w.id IN (SELECT sw.workItem.id FROM SprintWorkItem sw WHERE sw.sprint.id = :sprintId AND sw.removedAt IS NULL) "
            +
            "AND w.active = true AND w.status.code != 'DONE'")
    List<WorkItem> findNonDoneItemsInSprint(@Param("sprintId") Long sprintId);

    // Find OPEN items in a sprint (for spillover → BACKLOG)
    @Query("SELECT w FROM WorkItem w " +
            "WHERE w.id IN (SELECT sw.workItem.id FROM SprintWorkItem sw WHERE sw.sprint.id = :sprintId AND sw.removedAt IS NULL) " +
            "AND w.active = true AND w.status.code = 'OPEN'")
    List<WorkItem> findOpenItemsInSprint(@Param("sprintId") Long sprintId);

    // Find IN_PROGRESS items in a sprint (for spillover → next sprint)
    @Query("SELECT w FROM WorkItem w " +
            "WHERE w.id IN (SELECT sw.workItem.id FROM SprintWorkItem sw WHERE sw.sprint.id = :sprintId AND sw.removedAt IS NULL) " +
            "AND w.active = true AND w.status.code = 'IN_PROGRESS'")
    List<WorkItem> findInProgressItemsInSprint(@Param("sprintId") Long sprintId);

    long countByBoardColumnIdAndActiveTrue(Long columnId);

    List<WorkItem> findByBoardColumnIdAndActiveTrue(Long columnId);

    @Modifying
    @Query("UPDATE WorkItem w SET w.boardColumn = :targetColumn WHERE w.boardColumn.id = :sourceColumnId")
    void migrateWorkItemsToColumn(@Param("sourceColumnId") Long sourceColumnId, @Param("targetColumn") BoardColumn targetColumn);
}
