package com.telusko.demo.project.service;

import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.project.dto.BoardColumnRequest;
import com.telusko.demo.project.dto.BoardColumnResponse;
import com.telusko.demo.project.entity.BoardColumn;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.repository.BoardColumnRepository;
import com.telusko.demo.project.repository.ProjectRepository;
import com.telusko.demo.workitem.repository.WorkItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoardColumnService {

    private final BoardColumnRepository boardColumnRepository;
    private final ProjectRepository projectRepository;
    private final WorkItemRepository workItemRepository;

    @Transactional
    public List<BoardColumnResponse> getColumnsByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        List<BoardColumn> columns = boardColumnRepository.findByProjectIdAndActiveTrueOrderByPositionAsc(projectId);
        if (columns.isEmpty()) {
            columns = initDefaultTemplate(project, "SIMPLE");
        }

        return columns.stream().map(col -> {
            long count = workItemRepository.countByBoardColumnIdAndActiveTrue(col.getId());
            return toResponse(col, count);
        }).toList();
    }

    @Transactional
    public BoardColumnResponse createColumn(Long projectId, BoardColumnRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        List<BoardColumn> existing = boardColumnRepository.findByProjectIdAndActiveTrueOrderByPositionAsc(projectId);
        int position = request.getPosition() != null ? request.getPosition() : existing.size();

        boolean isDefault = Boolean.TRUE.equals(request.getIsDefault());
        if (isDefault) {
            existing.forEach(col -> {
                if (Boolean.TRUE.equals(col.getIsDefault())) {
                    col.setIsDefault(false);
                    boardColumnRepository.save(col);
                }
            });
        }

        BoardColumn column = BoardColumn.builder()
                .project(project)
                .name(request.getName().trim())
                .position(position)
                .statusCategory(request.getStatusCategory().toUpperCase())
                .wipLimit(request.getWipLimit())
                .isDefault(isDefault || existing.isEmpty())
                .active(true)
                .build();

        column = boardColumnRepository.save(column);
        log.info("Created board column: id={}, name='{}', project={}", column.getId(), column.getName(), projectId);
        return toResponse(column, 0L);
    }

    @Transactional
    public BoardColumnResponse updateColumn(Long projectId, Long columnId, BoardColumnRequest request) {
        BoardColumn column = boardColumnRepository.findByIdAndActiveTrue(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", "id", columnId));

        if (!column.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Column does not belong to project " + projectId);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            column.setName(request.getName().trim());
        }
        if (request.getStatusCategory() != null && !request.getStatusCategory().isBlank()) {
            column.setStatusCategory(request.getStatusCategory().toUpperCase());
        }
        if (request.getWipLimit() != null) {
            column.setWipLimit(request.getWipLimit() > 0 ? request.getWipLimit() : null);
        }
        if (request.getPosition() != null) {
            column.setPosition(request.getPosition());
        }
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            List<BoardColumn> allCols = boardColumnRepository.findByProjectIdAndActiveTrueOrderByPositionAsc(projectId);
            allCols.forEach(col -> {
                if (!col.getId().equals(columnId) && Boolean.TRUE.equals(col.getIsDefault())) {
                    col.setIsDefault(false);
                    boardColumnRepository.save(col);
                }
            });
            column.setIsDefault(true);
        }

        column = boardColumnRepository.save(column);
        long count = workItemRepository.countByBoardColumnIdAndActiveTrue(column.getId());
        return toResponse(column, count);
    }

    @Transactional
    public List<BoardColumnResponse> reorderColumns(Long projectId, List<Long> columnIds) {
        List<BoardColumn> columns = boardColumnRepository.findByProjectIdAndActiveTrueOrderByPositionAsc(projectId);
        Map<Long, BoardColumn> map = new HashMap<>();
        columns.forEach(c -> map.put(c.getId(), c));

        for (int i = 0; i < columnIds.size(); i++) {
            Long colId = columnIds.get(i);
            BoardColumn col = map.get(colId);
            if (col != null) {
                col.setPosition(i);
                boardColumnRepository.save(col);
            }
        }
        return getColumnsByProject(projectId);
    }

    @Transactional
    public void deleteColumn(Long projectId, Long columnId, Long targetColumnId) {
        BoardColumn column = boardColumnRepository.findByIdAndActiveTrue(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", "id", columnId));

        if (!column.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Column does not belong to project " + projectId);
        }

        long count = workItemRepository.countByBoardColumnIdAndActiveTrue(columnId);
        if (count > 0) {
            if (targetColumnId == null) {
                throw new BadRequestException("Column has " + count + " items. You must specify a targetColumnId to migrate items to.");
            }
            if (targetColumnId.equals(columnId)) {
                throw new BadRequestException("Target column cannot be the same as the column being deleted.");
            }
            BoardColumn targetColumn = boardColumnRepository.findByIdAndActiveTrue(targetColumnId)
                    .orElseThrow(() -> new ResourceNotFoundException("BoardColumn", "id", targetColumnId));
            if (!targetColumn.getProject().getId().equals(projectId)) {
                throw new BadRequestException("Target column does not belong to project " + projectId);
            }

            workItemRepository.migrateWorkItemsToColumn(columnId, targetColumn);
            log.info("Migrated {} items from column {} to column {}", count, columnId, targetColumnId);
        }

        column.setActive(false);
        boardColumnRepository.save(column);
        log.info("Deleted board column: id={}, project={}", columnId, projectId);
    }

    @Transactional
    public List<BoardColumn> initDefaultTemplate(Project project, String templateName) {
        List<BoardColumn> created = new ArrayList<>();
        if ("SCRUM".equalsIgnoreCase(templateName)) {
            created.add(BoardColumn.builder().project(project).name("Backlog").position(0).statusCategory("TODO").isDefault(true).active(true).build());
            created.add(BoardColumn.builder().project(project).name("To Do").position(1).statusCategory("TODO").isDefault(false).active(true).build());
            created.add(BoardColumn.builder().project(project).name("In Progress").position(2).statusCategory("IN_PROGRESS").isDefault(false).active(true).build());
            created.add(BoardColumn.builder().project(project).name("In Review").position(3).statusCategory("IN_PROGRESS").isDefault(false).active(true).build());
            created.add(BoardColumn.builder().project(project).name("Done").position(4).statusCategory("DONE").isDefault(false).active(true).build());
        } else {
            // Default "SIMPLE"
            created.add(BoardColumn.builder().project(project).name("To Do").position(0).statusCategory("TODO").isDefault(true).active(true).build());
            created.add(BoardColumn.builder().project(project).name("In Progress").position(1).statusCategory("IN_PROGRESS").isDefault(false).active(true).build());
            created.add(BoardColumn.builder().project(project).name("Done").position(2).statusCategory("DONE").isDefault(false).active(true).build());
        }
        return boardColumnRepository.saveAll(created);
    }

    private BoardColumnResponse toResponse(BoardColumn col, Long itemCount) {
        return BoardColumnResponse.builder()
                .id(col.getId())
                .projectId(col.getProject().getId())
                .name(col.getName())
                .position(col.getPosition())
                .statusCategory(col.getStatusCategory())
                .wipLimit(col.getWipLimit())
                .isDefault(col.getIsDefault())
                .active(col.getActive())
                .itemCount(itemCount)
                .build();
    }
}

