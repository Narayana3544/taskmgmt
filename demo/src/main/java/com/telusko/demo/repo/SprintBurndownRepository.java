package com.telusko.demo.repo;

import com.telusko.demo.Model.SprintBurndown;
import com.telusko.demo.Model.createsprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for SprintBurndown entity.
 */
@Repository
public interface SprintBurndownRepository extends JpaRepository<SprintBurndown, Long> {
    
    /**
     * Find all burndown data for a sprint ordered by date
     */
    List<SprintBurndown> findBySprintOrderByDateAsc(createsprint sprint);
    
    /**
     * Find burndown data for a sprint by ID
     */
    @Query("SELECT sb FROM SprintBurndown sb WHERE sb.sprint.id = :sprintId ORDER BY sb.date ASC")
    List<SprintBurndown> findBySprintId(@Param("sprintId") int sprintId);
    
    /**
     * Find burndown for specific date
     */
    Optional<SprintBurndown> findBySprintAndDate(createsprint sprint, LocalDate date);
    
    /**
     * Find latest burndown entry for a sprint
     */
    @Query("SELECT sb FROM SprintBurndown sb WHERE sb.sprint = :sprint ORDER BY sb.date DESC LIMIT 1")
    Optional<SprintBurndown> findLatestBySprint(@Param("sprint") createsprint sprint);
    
    /**
     * Get total points completed in date range (for velocity calculation)
     */
    @Query("SELECT SUM(sb.dailyVelocity) FROM SprintBurndown sb WHERE sb.sprint = :sprint")
    Double getTotalVelocityForSprint(@Param("sprint") createsprint sprint);
    
    /**
     * Delete burndown data for a sprint
     */
    void deleteBySprint(createsprint sprint);
}
