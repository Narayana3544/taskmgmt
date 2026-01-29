package com.telusko.demo.repo;

import com.telusko.demo.Model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Role entity.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    
    /**
     * Find role by name
     */
    Optional<Role> findByName(String name);
    
    /**
     * Find all active roles
     */
    List<Role> findByActiveTrue();
    
    /**
     * Check if role exists by name
     */
    boolean existsByName(String name);
    
    /**
     * Find non-system roles (can be modified/deleted)
     */
    List<Role> findBySystemRoleFalseAndActiveTrue();
    
    /**
     * Find roles that have a specific permission
     */
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.name = :permissionName AND r.active = true")
    List<Role> findByPermissionName(@Param("permissionName") String permissionName);
    
    /**
     * Count users with a specific role
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role.id = :roleId")
    long countUsersWithRole(@Param("roleId") int roleId);
}
