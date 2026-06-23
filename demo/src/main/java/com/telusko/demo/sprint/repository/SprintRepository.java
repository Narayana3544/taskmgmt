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

    @Query("SELECT s FROM Sprint s WHERE s.project.id = :projectId AND s.active = true AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Sprint> findByProjectIdAndActiveTrueAndSearch(@Param("projectId") Long projectId, @Param("search") String search, Pageable pageable);

    List<Sprint> findByProjectIdAndActiveTrue(Long projectId);

    @Query("SELECT s FROM Sprint s WHERE s.project.id = :projectId AND s.status.code = 'ACTIVE' AND s.active = true")
    Optional<Sprint> findActiveSprintByProject(@Param("projectId") Long projectId);

    @Query("SELECT COUNT(s) > 0 FROM Sprint s WHERE s.project.id = :projectId AND s.status.code = 'ACTIVE' AND s.active = true")
    boolean existsActiveSprintInProject(@Param("projectId") Long projectId);

    // ===== Feature-based queries =====
    Page<Sprint> findByFeatureIdAndActiveTrue(Long featureId, Pageable pageable);

    @Query("SELECT s FROM Sprint s WHERE s.feature.id = :featureId AND s.active = true AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Sprint> findByFeatureIdAndActiveTrueAndSearch(@Param("featureId") Long featureId, @Param("search") String search, Pageable pageable);

    long countByFeatureIdAndActiveTrue(Long featureId);

    @Query("SELECT s FROM Sprint s WHERE s.project.id = :projectId AND s.feature.id = :featureId AND s.active = true")
    Page<Sprint> findByProjectIdAndFeatureIdAndActiveTrue(@Param("projectId") Long projectId, @Param("featureId") Long featureId, Pageable pageable);

    // === Auto-close scheduler queries ===

    @Query("SELECT s FROM Sprint s WHERE s.status.code = 'ACTIVE' AND s.active = true AND s.endDate <= :date")
    List<Sprint> findActiveSprintsEndingOnOrBefore(@Param("date") java.time.LocalDate date);

    @Query("SELECT s FROM Sprint s WHERE s.status.code = 'ACTIVE' AND s.active = true AND s.endDate = :date")
    List<Sprint> findActiveSprintsEndingOn(@Param("date") java.time.LocalDate date);

    @Query("SELECT s FROM Sprint s WHERE s.feature.id = :featureId AND s.status.code = 'PLANNED' AND s.active = true ORDER BY s.startDate ASC, s.createdAt ASC")
    List<Sprint> findNextPlannedSprintsByFeature(@Param("featureId") Long featureId);
}
