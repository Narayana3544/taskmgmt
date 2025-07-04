package com.telusko.demo.repo;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Userstory;
import com.telusko.demo.Model.story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface userstoryrepo  extends JpaRepository<story,Integer> {
    List<Feature> findByFeature_Id(int id);

    List<story> findByFeatureId(int featureId);
    List<story> findBySprintId(Long sprintId);
}
