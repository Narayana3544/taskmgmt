package com.telusko.demo.project.repository;

import com.telusko.demo.project.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {

    List<BoardColumn> findByProjectIdAndActiveTrueOrderByPositionAsc(Long projectId);

    Optional<BoardColumn> findByIdAndActiveTrue(Long id);

    Optional<BoardColumn> findFirstByProjectIdAndIsDefaultTrueAndActiveTrue(Long projectId);

    long countByProjectIdAndActiveTrue(Long projectId);
}

