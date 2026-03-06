package com.telusko.demo.rbac.repository;

import com.telusko.demo.rbac.entity.PermissionFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PermissionFeatureRepository extends JpaRepository<PermissionFeature, Long> {
    Optional<PermissionFeature> findByCode(String code);
}
