package com.telusko.demo.controller;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.Model.Project;
import com.telusko.demo.repo.ProjectRepository;
import com.telusko.demo.repo.featurerepo;
import com.telusko.demo.service.featureservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class featurecontroller {

    @Autowired

    public featureservice service;

    @Autowired
    public featurerepo repo;

    @Autowired
    public ProjectRepository projectRepo;

//    @PostMapping("/projects/{project_id}/addfeature")
//    public Feature addfeature(@RequestBody Feature feature){
//        return service.addfeature(feature);
//    }

    @PostMapping("/projects/{projectId}/addfeature")
    public ResponseEntity<String> addFeature(@PathVariable int projectId, @RequestBody Feature feature) {
        Optional<Project> projectOpt = projectRepo.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Project not found");
        }

        Project project = projectOpt.get();
        feature.setProject(project);
       repo.save(feature);
        return ResponseEntity.ok("Feature saved successfully!");
    }

//    @GetMapping("/features/byproject/{projectId}")
//    public ResponseEntity<List<Feature>> getFeaturesByProjectId(@PathVariable int projectId) {
//        List<Feature> features = repo.findByProjectId(projectId);
//        return ResponseEntity.ok(features);
//    }
@GetMapping("/features/project/{projectId}")
public List<Feature> getFeaturesByProjectId(@PathVariable int projectId) {
    return repo.findByProjectId(projectId);
}


}
