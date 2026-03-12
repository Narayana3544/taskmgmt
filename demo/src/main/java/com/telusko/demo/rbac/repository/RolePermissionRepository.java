package com.telusko.demo.rbac.repository;

import com.telusko.demo.rbac.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    @Query("SELECT rp FROM RolePermission rp " +
            "WHERE rp.role.id = :roleId " +
            "AND rp.feature.code = :featureCode " +
            "AND rp.action.code = :actionCode " +
            "AND rp.allowed = true")
    List<RolePermission> findAllowedPermission(
            @Param("roleId") Long roleId,
            @Param("featureCode") String featureCode,
            @Param("actionCode") String actionCode);

    List<RolePermission> findByRoleId(Long roleId);

    boolean existsByRoleIdAndFeatureIdAndActionId(Long roleId, Long featureId, Long actionId);
}
