package com.telusko.demo.sprint.repository;

import com.telusko.demo.sprint.entity.Sprint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    Page<Sprint> findByProjectIdAndActiveTrue(Long projectId, Pageable pageable);

    List<Sprint> findByProjectIdAndActiveTrue(Long projectId);

    @Query("SELECT s FROM Sprint s WHERE s.project.id = :projectId AND s.status.code = 'ACTIVE' AND s.active = true")
    Optional<Sprint> findActiveSprintByProject(@Param("projectId") Long projectId);

    @Query("SELECT COUNT(s) > 0 FROM Sprint s WHERE s.project.id = :projectId AND s.status.code = 'ACTIVE' AND s.active = true")
    boolean existsActiveSprintInProject(@Param("projectId") Long projectId);
}
