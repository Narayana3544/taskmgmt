package com.telusko.demo.masterdata.repository;

import com.telusko.demo.masterdata.entity.MasterType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterTypeRepository extends JpaRepository<MasterType, Long> {
    List<MasterType> findByOrganizationIdAndActiveTrue(Long organizationId);

    Optional<MasterType> findByOrganizationIdAndCode(Long organizationId, String code);
}
