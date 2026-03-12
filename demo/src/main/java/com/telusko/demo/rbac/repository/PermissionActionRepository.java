package com.telusko.demo.rbac.repository;

import com.telusko.demo.rbac.entity.PermissionAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PermissionActionRepository extends JpaRepository<PermissionAction, Long> {
    Optional<PermissionAction> findByCode(String code);
}
