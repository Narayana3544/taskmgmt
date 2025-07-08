package com.telusko.demo.repo;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.User;
import com.telusko.demo.Model.Userstory;
import com.telusko.demo.Model.story;
import com.telusko.demo.dto.SprintOverviewDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface userstoryrepo  extends JpaRepository<story,Integer> {
    List<Feature> findByFeature_Id(int id);

    List<story> findByFeatureId(int featureId);
    List<story> findBySprintId(Long sprintId);
    List<story> findByUserstory(User user);
    @Query("SELECT s FROM story s WHERE s.userstory.id = :userId AND s.sprint IS NOT NULL AND s.sprint.status != 'Completed'")
    List<story> findByAssignedUserInActiveSprints(@Param("userId") int userId);

}
