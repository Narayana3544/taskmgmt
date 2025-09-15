package com.telusko.demo.service;

import com.telusko.demo.Model.Project;
import com.telusko.demo.Model.Team;
import com.telusko.demo.Model.User;
import com.telusko.demo.repo.ProjectRepository;
import com.telusko.demo.repo.Teamrepo;
import com.telusko.demo.repo.userrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeamService {

    @Autowired
    public Teamrepo repo;

    @Autowired
    public ProjectRepository projectRepo;

    @Autowired
    public userrepo userRepository;


    public List<User> getUsersByProjectId(Integer projectId) {
        List<Team> teamList =repo.findByProject_Id(projectId);

        return teamList.stream()
                .map(Team::getUser)   // extract user
                .collect(Collectors.toList());
    }

    public void assignUsersToProject(Long projectId, List<Long> userIds) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        for (Long userId : userIds) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Team team = new Team();
            team.setProject(project);
            team.setUser(user);

            repo.save(team);
        }
    }



    public void unassignUserFromProject(Integer projectId, Integer userId) {
        Optional<Team> assignment = repo.findByProjectIdAndUserId(projectId, userId);

        if (assignment.isPresent()) {
            repo.delete(assignment.get());
        } else {
            throw new RuntimeException("Assignment not found");
        }
    }

    public List<Project> findProjectByUserId(int userId){
        List<Team> projectList  =repo.findProjectsByUser_id(userId);
         return projectList.stream()
                .map(Team::getProject)
                .collect(Collectors.toList());
    }

}
