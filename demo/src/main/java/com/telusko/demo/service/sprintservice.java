package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.TaskRepository;
import com.telusko.demo.repo.Teamrepo;
import com.telusko.demo.repo.createsprintrepo;
import com.telusko.demo.repo.featurerepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class sprintservice {

    @Autowired
    public createsprintrepo repo;

    @Autowired
    public Teamrepo teamrepo;

    @Autowired
    public featurerepo Featurerepo;

    @Autowired
    public TaskRepository taskrepo;

    public sprintservice service;

    public createsprint create(createsprint sprint){
        createsprint updatedSprint = updateSprintStatus(sprint);
        return repo.save(sprint);
    }

    public List<createsprint> view() {
       List<createsprint> sprints=repo.findAll();
        List<createsprint> allSprints = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (createsprint sprint : sprints) {
            // ✅ auto update status based on date
            if (today.isBefore(sprint.getStartDate().toLocalDate())) {
                sprint.setStatus("Upcoming");
            } else if (today.isAfter(sprint.getEndDate().toLocalDate())) {
                sprint.setStatus("Completed");
            } else {
                sprint.setStatus("Active");
            }
//
//            if ("Active".equals(sprint.getStatus())) {
//                allSprints.add(sprint);
//            }
//            updateSprintStatus(sprint);
            allSprints.add(sprint);

        }

        return sprints.stream()
                .map(this::updateSprintStatus)
                .collect(Collectors.toList());
    }

    public List<User> getUsersByProjectId(int sprintId) {
        Optional<createsprint> sprint=repo.findById(sprintId);
        Feature feature=sprint.get().getFeature();
        Project project=feature.getProject();
        List<Team> teams = teamrepo.findByProject_Id(project.getId());
        return teams.stream()
                .map(Team::getUser) // extract user from each team entry
                .collect(Collectors.toList());

    }

    public createsprint updateSprintStatus(createsprint sprint) {
        LocalDate today = LocalDate.now();

        if (today.isBefore(sprint.getStartDate().toLocalDate())) {
            sprint.setStatus("Planned"); // not started yet
        } else if ((today.isEqual(sprint.getStartDate().toLocalDate()) || today.isAfter(sprint.getStartDate().toLocalDate()))
                && (today.isEqual(sprint.getEndDate().toLocalDate()) || today.isBefore(sprint.getEndDate().toLocalDate()))) {
            sprint.setStatus("Active");
        } else if (today.isAfter(sprint.getEndDate().toLocalDate())) {
            sprint.setStatus("Completed");
        }

        return sprint;
    }


    public void calculateStoryPoints(int sprintId) {
        createsprint sprint=repo.findById(sprintId)
                .orElseThrow(()->new RuntimeException("Sprint not found"));
        List<task> Tasks=taskrepo.findAllBySprint_id(sprintId);
        List<Team> AssignedUsers=teamrepo.findByProject_Id(sprint.getFeature().getProject().getId());
        int AcheivedStoryPoints=0;
        int TargettedStoryPoints=8*AssignedUsers.size();
        for(task T:Tasks){
            if(T.getTaskStatus().getDecription().equals("Done")){
                AcheivedStoryPoints+=T.getStorypoints();
            }
        }
//        sprint.setTargettedStoryPoints(TargettedStoryPoints);
//        sprint.setAchievedStoryPoints(AcheivedStoryPoints);
    }

    public List<createsprint> findByProjectId(int projectId) {
        List<Feature> featureList=Featurerepo.findByProjectId(projectId);
        List<Integer> featureids=new ArrayList<>();
        List<createsprint> sprints=new ArrayList<>();
        for(Feature f :featureList){
            featureids.add(f.getId());
        }
        for(int i: featureids){
            sprints.addAll(repo.findByFeatureId(i));
        }
        return sprints;
    }
}
