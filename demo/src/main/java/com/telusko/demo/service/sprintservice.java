package com.telusko.demo.service;

import com.telusko.demo.Model.*;
import com.telusko.demo.repo.Teamrepo;
import com.telusko.demo.repo.createsprintrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class sprintservice {

    @Autowired
    public createsprintrepo repo;

    @Autowired
    public Teamrepo teamrepo;

    public createsprint create(createsprint sprint){
        return repo.save(sprint);
    }

    public List<createsprint> view() {
        return repo.findAll();
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
}
