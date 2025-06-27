package com.telusko.demo.controller;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Project;
import com.telusko.demo.Model.Userstory;
import com.telusko.demo.Model.story;
import com.telusko.demo.repo.featurerepo;
import com.telusko.demo.repo.userstoryrepo;
import com.telusko.demo.service.userstoryservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
public class userstorycontroller {

    @Autowired
    public userstoryservice service;

    @Autowired
    public userstoryrepo repo;

    @Autowired
    public featurerepo featuteRepo;

    @PostMapping("/{feature_id}/adduserstory")
    public story adduserstory(@RequestBody story story, @PathVariable int featureid){
        return service.adduserstory(story);
    }
    @PostMapping("/features/{featureId}/adduserstory")
    public ResponseEntity<String> addUserStory(@PathVariable int featureId, @RequestBody story userStory) {
        Optional<Feature> featureOpt = featuteRepo.findById(featureId);

        if (featureOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Feature not found");
        }

        Feature feature = featureOpt.get();
        userStory.setFeature(feature); // set the full object
        repo.save(userStory);

        return ResponseEntity.ok("User story added successfully!");
    }
    @GetMapping("/features/{featureId}/userstories")
    public ResponseEntity<List<story>> getStoriesByFeatureId(@PathVariable int featureId) {
        List<story> stories = repo.findByFeatureId(featureId);
        return ResponseEntity.ok(stories);
    }
    @DeleteMapping("/userstories/{id}")
    public ResponseEntity<String> deleteStory(@PathVariable Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.ok("User story deleted.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User story not found.");
        }
    }

}
