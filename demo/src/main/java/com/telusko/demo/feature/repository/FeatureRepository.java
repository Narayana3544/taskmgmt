package com.telusko.demo.feature.repository;

import com.telusko.demo.feature.entity.Feature;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeatureRepository extends JpaRepository<Feature, Long> {

    Page<Feature> findByProjectIdAndActiveTrue(Long projectId, Pageable pageable);

    @Query("SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.active = true AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Feature> findByProjectIdAndActiveTrueAndSearch(
            @Param("projectId") Long projectId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.active = true AND f.status.id = :statusId")
    Page<Feature> findByProjectIdAndStatusIdAndActiveTrue(
            @Param("projectId") Long projectId,
            @Param("statusId") Long statusId,
            Pageable pageable);

    @Query("SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.active = true AND f.status.id = :statusId AND LOWER(f.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Feature> findByProjectIdAndStatusIdAndActiveTrueAndSearch(
            @Param("projectId") Long projectId,
            @Param("statusId") Long statusId,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT f FROM Feature f WHERE f.project.id = :projectId AND f.status.code = :statusCode AND f.active = true ORDER BY f.name")
    List<Feature> findByProjectIdAndStatusCodeAndActiveTrue(
            @Param("projectId") Long projectId,
            @Param("statusCode") String statusCode);

    long countByProjectIdAndActiveTrue(Long projectId);
}
