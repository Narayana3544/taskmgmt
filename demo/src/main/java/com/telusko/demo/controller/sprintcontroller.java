package com.telusko.demo.controller;

import com.telusko.demo.Model.*;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.dto.SprintOverviewDTO;
import com.telusko.demo.repo.*;
//import com.telusko.demo.repo.sprintusersrepo;
//import com.telusko.demo.repo.sprintoverviewdto;
import com.telusko.demo.service.sprintservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
public class sprintcontroller {

    @Autowired
    public sprintservice service;

    @Autowired
    public createsprintrepo sprintRepo;

    @Autowired
    public userrepo userRepo;

    @Autowired
    public userstoryrepo userStoryRepo;

    @Autowired
    public Teamrepo teamrepo;

    @Autowired
    public featurerepo Featurerepo;




//    @Autowired
//    public sprintoverviewdto overviewrepo;

    @PostMapping("/sprints/create-sprints")
    public createsprint create(@RequestBody createsprint sprint){
        return service.create(sprint);
    }

    @GetMapping("/sprints")
    public List<createsprint> viewsprints(){
        return service.view();
    }
    @GetMapping("/sprints/{sprintId}")
    public Optional<createsprint> viewsprintsbyid(@PathVariable int sprintId){
        return sprintRepo.findById(sprintId);
    }

    @PostMapping("/sprints/{sprintId}/assign-users")
    public ResponseEntity<?> assignUsersToSprint(@PathVariable int sprintId, @RequestBody List<Long> userIds) {
        Optional<createsprint> sprintOpt = sprintRepo.findById(sprintId);
        if (sprintOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sprint not found");
        }

        List<User> users = userRepo.findAllById(userIds);
        if (users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No valid users found");
        }

        createsprint sprint = sprintOpt.get();
        sprint.setUsers(users);
        sprintRepo.save(sprint);

        return ResponseEntity.ok("Users assigned successfully");
    }
    @GetMapping("/sprints/{sprintId}/overview")
    public ResponseEntity<?> getSprintOverview(@PathVariable int sprintId) {
        createsprint sprint = sprintRepo.findById(sprintId).orElse(null);
        if (sprint == null) {
            return ResponseEntity.notFound().build();
        }

        // Fetch user stories linked to this sprint
        List<story> userStories = userStoryRepo.findBySprintId((long) sprintId);

//        int totalPoints = userStories.stream().mapToInt(overviewrepo::gettotalStorypoints).sum();
//        int completedPoints = userStories.stream()
//                .filter(story -> "Done".equalsIgnoreCase(story.getStatus()))
//                .mapToInt(overviewrepo::getStorypoints)
//                .sum();

        SprintOverviewDTO dto = new SprintOverviewDTO();
        dto.setSprintId(sprint.getId());
        dto.setSprintName(sprint.getName());
        dto.setStartDate(sprint.getStartDate().toString());
        dto.setEndDate(sprint.getEndDate().toString());
        dto.setFeatureName(sprint.getFeature().getName());
        dto.setAssignedUsers(sprint.getUsers());
        dto.setUserStories(userStories);
//        dto.setTotalStoryPoints(totalPoints);
//        dto.setCompletedStoryPoints(completedPoints);

        return ResponseEntity.ok(dto);
    }


    @PostMapping("/sprints/{sprintId}/assign-stories")
    public ResponseEntity<?> assignUserStoriesToSprint(
            @PathVariable int sprintId,
            @RequestBody List<Integer> userStoryIds) {

        Optional<createsprint> sprintOpt = sprintRepo.findById(sprintId);
        if (sprintOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sprint not found");
        }

        createsprint sprint = sprintOpt.get();

        // Fetch current assigned user stories
        List<story> existingStories = userStoryRepo.findBySprintId((long) sprintId);
        int currentPoints = existingStories.stream().mapToInt(story::getStorypoints).sum();

        // Total capacity: users * 10 story points
        int userCount = sprint.getUsers() != null ? sprint.getUsers().size() : 0;
        int maxCapacity = userCount * 10;

        List<story> newStories = userStoryRepo.findAllById(userStoryIds);
        int newPoints = newStories.stream().mapToInt(story::getStorypoints).sum();

        if (currentPoints + newPoints > maxCapacity) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Capacity exceeded for this sprint");
        }

        // Assign each story to sprint
        for (story story : newStories) {
            story.setSprint(sprint);
        }

        userStoryRepo.saveAll(newStories);
        return ResponseEntity.ok("User stories assigned successfully to sprint ID: " + sprintId);
    }
    @GetMapping("/sprints/{sprintId}/available-users")
    public ResponseEntity<?> getAvailableUsers(@PathVariable int sprintId) {
        Optional<createsprint> sprintOpt = sprintRepo.findById(sprintId);
        if (sprintOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sprint not found");
        }

        createsprint sprint = sprintOpt.get();
        List<User> availableUsers = sprintRepo.findAvailableUsersForWeek(sprint.getStartDate(), sprint.getEndDate());
        return ResponseEntity.ok(availableUsers);
    }
    @PatchMapping("/sprints/{id}/complete")
    public ResponseEntity<?> markSprintComplete(@PathVariable int id) {
        Optional<createsprint> sprintOpt = sprintRepo.findById(id);
        if (sprintOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sprint not found");

        createsprint sprint = sprintOpt.get();
        sprint.setStatus("Completed");
        sprintRepo.save(sprint);

        return ResponseEntity.ok("Sprint marked as completed");
    }
    @GetMapping("/user/assigned-stories")
    public ResponseEntity<?> getAssignedStories(Principal principal) {
        String email = principal.getName();
        User user = userRepo.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<story> assignedStories = userStoryRepo.findByAssignedUserInActiveSprints(user.getId());
        return ResponseEntity.ok(assignedStories);
    }

    @GetMapping("/features/{featureId}/sprints")
    public List<createsprint> getSprintsByFeature(@PathVariable int featureId) {
        return sprintRepo.findByFeatureId(featureId);
    }

    @GetMapping("/sprint/users/{sprintId}")
    public List<User> getUsersByProjectId(@PathVariable int sprintId){
        return service.getUsersByProjectId(sprintId);
    }

    @GetMapping("/users/currentsprints")
    public List<createsprint> getassignedsprints(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        LocalDate today = LocalDate.now();
        List<Team> teams = teamrepo.findProjectsByUser_id(userId);
        List<createsprint> allSprints = new ArrayList<>();

        for (Team team : teams) {
            Project project = team.getProject();
            List<Feature> features = Featurerepo.findByProjectId(project.getId());

            for (Feature feature : features) {
                List<createsprint> sprints = sprintRepo.findByFeatureId(feature.getId());
                for (createsprint sprint : sprints) {
                    // ✅ auto update status based on date
                    if (today.isBefore(sprint.getStartDate().toLocalDate())) {
                        sprint.setStatus("UPCOMING");
                    } else if (today.isAfter(sprint.getEndDate().toLocalDate())) {
                        sprint.setStatus("COMPLETED");
                    } else {
                        sprint.setStatus("ACTIVE");
                    }

                    if ("ACTIVE".equals(sprint.getStatus())) {
                        allSprints.add(sprint);
                    }
                }
            }
        }

        return allSprints;
    }




}



