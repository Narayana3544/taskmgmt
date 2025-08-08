package com.telusko.demo.service;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Project;
import com.telusko.demo.repo.ProjectRepository;
import com.telusko.demo.repo.featurerepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;


@Service
public class featureservice {

    @Autowired
    public featurerepo repo;


    public Feature addfeature(Feature feature) {

        return repo.save(feature);
    }

//    public Optional<Feature> viewfeatures(int id) {
//        return  repo.findByProjectId(id);
//    }

    public Feature updateFeature(int id, Feature updatedFeature) {
        Optional<Feature> optionalFeature = repo.findById(id);

        if (optionalFeature.isPresent()) {
            Feature existingFeature = optionalFeature.get();
            existingFeature.setName(updatedFeature.getName());
            existingFeature.setDescriptor(updatedFeature.getDescriptor());
            existingFeature.setStatus(updatedFeature.getStatus());
            existingFeature.setProject(updatedFeature.getProject());

            return repo.save(existingFeature);
        } else {
            throw new RuntimeException("Feature not found with id " + id);
        }
    }

    public Optional<Feature> getfeaturesbyid(int id) {
        return repo.findById(id);
    }
}
