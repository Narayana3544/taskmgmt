package com.telusko.demo.project.repository;

import com.telusko.demo.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectIdAndEndDateIsNull(Long projectId);

    // RULE: One user can have only one active membership per project
    @Query("SELECT pm FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.id = :userId AND pm.endDate IS NULL")
    Optional<ProjectMember> findActiveMembership(@Param("projectId") Long projectId, @Param("userId") Long userId);

    @Query("SELECT COUNT(pm) FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.endDate IS NULL")
    long countActiveMembers(@Param("projectId") Long projectId);
}
