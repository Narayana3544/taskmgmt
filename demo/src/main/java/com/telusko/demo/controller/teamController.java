package com.telusko.demo.controller;

import com.telusko.demo.Model.Project;
import com.telusko.demo.Model.Team;
import com.telusko.demo.Model.User;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.dto.AssignUsersRequest;
import com.telusko.demo.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class teamController {

    @Autowired
    private TeamService service;

//    @GetMapping("/getusers")
//    public List<Team> getteams(){
//        return service.getTeamByProjectId();
//    }

    @GetMapping("/project/users/{projectId}")
    public ResponseEntity<List<User>> getUsersByProject_Id(@PathVariable Integer projectId) {
        List<User> users = service.getUsersByProjectId(projectId);
        return ResponseEntity.ok(users);
    }


    @PostMapping("/projects/{projectId}/assign-users")
    public ResponseEntity<?> assignUsersToProject(
            @PathVariable Long projectId,
            @RequestBody List<Long> userIds) {
        service.assignUsersToProject(projectId, userIds);
        return ResponseEntity.ok("Users assigned successfully!");
    }

    @DeleteMapping("/project/unassign")
    public ResponseEntity<String> unassignUserFromProject(
            @RequestParam Integer projectId,
            @RequestParam Integer userId) {
        service.unassignUserFromProject(projectId, userId);
        return ResponseEntity.ok("User unassigned successfully");
    }

    @GetMapping("/project/assignedtouser")
    public List<Project> findUsersByProjectId(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        int userId = userDetails.getUser().getId();
        List<Project> projects = service.findProjectByUserId(userId);
        return projects;
    }


}
