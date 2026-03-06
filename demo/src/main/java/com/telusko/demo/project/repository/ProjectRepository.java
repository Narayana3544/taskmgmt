package com.telusko.demo.project.repository;

import com.telusko.demo.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Page<Project> findByOrganizationIdAndActiveTrue(Long organizationId, Pageable pageable);

    boolean existsByOrganizationIdAndCode(Long organizationId, String code);
}
