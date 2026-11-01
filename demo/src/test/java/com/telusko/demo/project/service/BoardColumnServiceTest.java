package com.telusko.demo.project.service;

import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.project.dto.BoardColumnRequest;
import com.telusko.demo.project.dto.BoardColumnResponse;
import com.telusko.demo.project.entity.BoardColumn;
import com.telusko.demo.project.entity.Project;
import com.telusko.demo.project.repository.BoardColumnRepository;
import com.telusko.demo.project.repository.ProjectRepository;
import com.telusko.demo.workitem.repository.WorkItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardColumnServiceTest {

    @Mock
    private BoardColumnRepository boardColumnRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private WorkItemRepository workItemRepository;

    @InjectMocks
    private BoardColumnService boardColumnService;

    private Project testProject;
    private BoardColumn col1;
    private BoardColumn col2;

    @BeforeEach
    void setUp() {
        testProject = Project.builder().id(1L).code("TEST").name("Test Project").build();
        col1 = BoardColumn.builder().id(10L).project(testProject).name("To Do").position(0).statusCategory("TODO").isDefault(true).active(true).build();
        col2 = BoardColumn.builder().id(20L).project(testProject).name("Done").position(1).statusCategory("DONE").isDefault(false).active(true).build();
    }

    @Test
    void testGetColumnsByProject() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(testProject));
        when(boardColumnRepository.findByProjectIdAndActiveTrueOrderByPositionAsc(1L)).thenReturn(List.of(col1, col2));
        when(workItemRepository.countByBoardColumnIdAndActiveTrue(10L)).thenReturn(3L);
        when(workItemRepository.countByBoardColumnIdAndActiveTrue(20L)).thenReturn(1L);

        List<BoardColumnResponse> result = boardColumnService.getColumnsByProject(1L);

        assertEquals(2, result.size());
        assertEquals("To Do", result.get(0).getName());
        assertEquals(3L, result.get(0).getItemCount());
        assertEquals("Done", result.get(1).getName());
        assertEquals(1L, result.get(1).getItemCount());
    }

    @Test
    void testCreateColumn() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(testProject));
        when(boardColumnRepository.findByProjectIdAndActiveTrueOrderByPositionAsc(1L)).thenReturn(List.of(col1));
        when(boardColumnRepository.save(any(BoardColumn.class))).thenAnswer(invocation -> {
            BoardColumn c = invocation.getArgument(0);
            c.setId(30L);
            return c;
        });

        BoardColumnRequest req = BoardColumnRequest.builder()
                .name("In Review")
                .statusCategory("IN_PROGRESS")
                .wipLimit(5)
                .isDefault(false)
                .build();

        BoardColumnResponse res = boardColumnService.createColumn(1L, req);

        assertNotNull(res);
        assertEquals("In Review", res.getName());
        assertEquals("IN_PROGRESS", res.getStatusCategory());
        assertEquals(5, res.getWipLimit());
        assertEquals(1, res.getPosition());
    }

    @Test
    void testDeleteColumnRequiresTargetWhenItemsExist() {
        when(boardColumnRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(col1));
        when(workItemRepository.countByBoardColumnIdAndActiveTrue(10L)).thenReturn(4L);

        // Should throw BadRequestException when no targetColumnId is provided
        assertThrows(BadRequestException.class, () -> boardColumnService.deleteColumn(1L, 10L, null));
    }

    @Test
    void testDeleteColumnMigratesItemsWhenTargetProvided() {
        when(boardColumnRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(col1));
        when(boardColumnRepository.findByIdAndActiveTrue(20L)).thenReturn(Optional.of(col2));
        when(workItemRepository.countByBoardColumnIdAndActiveTrue(10L)).thenReturn(2L);

        boardColumnService.deleteColumn(1L, 10L, 20L);

        verify(workItemRepository).migrateWorkItemsToColumn(10L, col2);
        assertFalse(col1.getActive());
        verify(boardColumnRepository).save(col1);
    }
}

