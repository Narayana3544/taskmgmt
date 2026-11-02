package com.telusko.demo.masterdata.repository;

import com.telusko.demo.masterdata.entity.MasterType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterTypeRepository extends JpaRepository<MasterType, Long> {
    @Query("SELECT mt FROM MasterType mt WHERE (mt.organization.id = :organizationId OR mt.organization IS NULL) AND mt.active = true ORDER BY mt.id")
    List<MasterType> findByOrganizationIdAndActiveTrue(@Param("organizationId") Long organizationId);

    @Query("SELECT mt FROM MasterType mt WHERE (mt.organization.id = :organizationId OR mt.organization IS NULL) AND mt.code = :code")
    Optional<MasterType> findByOrganizationIdAndCode(@Param("organizationId") Long organizationId, @Param("code") String code);
}
