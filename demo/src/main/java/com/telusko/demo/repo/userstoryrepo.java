package com.telusko.demo.repo;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Userstory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface userstoryrepo  extends JpaRepository<Userstory,Integer> {
    List<Feature> findByFeatureId(int projectId);
}
