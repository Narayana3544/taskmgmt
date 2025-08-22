package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.Teamrepo;
import com.telusko.demo.repo.createsprintrepo;
import com.telusko.demo.repo.featurerepo;
import org.springframework.beans.factory.annotation.Autowired;
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

    public sprintservice service;

    public createsprint create(createsprint sprint){
        createsprint updatedSprint = updateSprintStatus(sprint);
        return repo.save(sprint);
    }

    public List<createsprint> view() {
        return repo.findAll().stream()
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
            sprint.setStatus("PLANNED"); // not started yet
        } else if ((today.isEqual(sprint.getStartDate().toLocalDate()) || today.isAfter(sprint.getStartDate().toLocalDate()))
                && (today.isEqual(sprint.getEndDate().toLocalDate()) || today.isBefore(sprint.getEndDate().toLocalDate()))) {
            sprint.setStatus("ACTIVE");
        } else if (today.isAfter(sprint.getEndDate().toLocalDate())) {
            sprint.setStatus("COMPLETED");
        }

        return sprint;
    }



}
