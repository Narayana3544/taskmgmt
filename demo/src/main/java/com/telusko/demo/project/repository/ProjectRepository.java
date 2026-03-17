package com.telusko.demo.project.repository;

import com.telusko.demo.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByOrganizationIdAndActiveTrue(Long organizationId, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.organization.id = :orgId AND p.active = true " +
           "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.code) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> findByOrganizationIdAndActiveTrueAndSearch(@org.springframework.data.repository.query.Param("orgId") Long orgId, @org.springframework.data.repository.query.Param("search") String search, Pageable pageable);

    boolean existsByOrganizationIdAndCode(Long organizationId, String code);
}
