package com.telusko.demo.repo;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
    public interface featurerepo extends JpaRepository<Feature, Integer> {
    List<Feature> findByProjectId(int projectId);
}


