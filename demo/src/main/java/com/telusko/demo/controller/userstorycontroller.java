package com.telusko.demo.controller;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.story;
import com.telusko.demo.repo.featurerepo;
import com.telusko.demo.repo.userstoryrepo;
import com.telusko.demo.service.userstoryservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
    public ResponseEntity<String> deleteStory(@PathVariable int id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.ok("User story deleted.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User story not found.");
        }
    }
    @GetMapping("/features/userstories")
    public List<story> userstories(){
        return service.viewstories();
    }
    @PatchMapping("/userstories/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable int id, @RequestBody Map<String, String> body) {
        Optional<story> optional = repo.findById(id);
        if (optional.isEmpty()) return ResponseEntity.notFound().build();

        story s = optional.get();
        s.setStatus(body.get("status"));
        repo.save(s);

        return ResponseEntity.ok("Status updated");
    }
    // Get user story by ID
    @GetMapping("/userstories/{id}")
    public ResponseEntity<story> getUserStoryById(@PathVariable int id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update user story
    @PutMapping("/userstories/{id}")
    public ResponseEntity<story> updateUserStory(
            @PathVariable int id,
            @RequestBody story updatedStory) {
        return repo.findById(id)
                .map(story -> {
                    story.setDescription(updatedStory.getDescription());
                    story.setAcceptancecriteria(updatedStory.getAcceptancecriteria());
                    story.setStorypoints(updatedStory.getStorypoints());
                    story.setStatus(updatedStory.getStatus());

                    // If updating feature
                    if (updatedStory.getFeature() != null && updatedStory.getFeature().getId() != 0) {
                        story.setFeature(updatedStory.getFeature());
                    }

                    return ResponseEntity.ok(repo.save(story));
                })
                .orElse(ResponseEntity.notFound().build());
    }



}
