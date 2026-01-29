package com.telusko.demo.repo;

import com.telusko.demo.Model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Permission entity.
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    
    /**
     * Find permission by name
     */
    Optional<Permission> findByName(String name);
    
    /**
     * Find all permissions by category
     */
    List<Permission> findByCategory(String category);
    
    /**
     * Find all active permissions
     */
    List<Permission> findByActiveTrue();
    
    /**
     * Find permissions by category and active status
     */
    List<Permission> findByCategoryAndActiveTrue(String category);
    
    /**
     * Check if permission exists by name
     */
    boolean existsByName(String name);
    
    /**
     * Find all distinct categories
     */
    @Query("SELECT DISTINCT p.category FROM Permission p WHERE p.active = true ORDER BY p.category")
    List<String> findAllCategories();
    
    /**
     * Find permissions by list of names
     */
    @Query("SELECT p FROM Permission p WHERE p.name IN :names AND p.active = true")
    List<Permission> findByNameIn(@Param("names") List<String> names);
}
