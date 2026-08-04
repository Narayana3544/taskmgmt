package com.telusko.demo.controller;

import com.telusko.demo.Model.Task_status;
import com.telusko.demo.config.CustomUserDetails;
import com.telusko.demo.repo.Task_statusrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
public class task_statuscontroller {

    @Autowired
    public Task_statusrepo repo;

    @GetMapping("/getstatus")
    public List<Task_status> getstatus(){
        return repo.findAll();
    }

//    @GetMapping("/getstatusForProject")
//    public List<Task_status> getStatusForProject(){
//        return repo.findByStatusCodeDescription("Project");
//    }

    @GetMapping("/getstatusForProject")
    public List<Task_status> getStatusForProject(){
        return repo.findByStatusCodeId(2);
    }

    @GetMapping("/getstatusForTask")
    public List<Task_status> getStatusForTask(){
        return repo.findByStatusCodeId(1);
    }

    @GetMapping("/getstatusForFeature")
    public List<Task_status> getStatusForFeature(){
        return repo.findByStatusCodeId(3);
    }
    @GetMapping("/getstatusForSprint")
    public List<Task_status> getStatusForSprint(){
        return repo.findByStatusCodeId(4);
    }

    /**
     * Returns task statuses filtered by the logged-in user's role.
     *
     * ADMIN / TESTER  → all task statuses (Backlog, To Do, In Progress, Fixed, Re Open, Done)
     * DEVELOPER       → Backlog, To Do, In Progress, Fixed  (Re Open & Done are excluded)
     */
    @GetMapping("/getstatusForTask/byRole")
    public List<Task_status> getStatusForTaskByRole(Authentication authentication) {
        // Get all task statuses from DB
        List<Task_status> allTaskStatuses = repo.findByStatusCodeId(1);

        // Determine the logged-in user's role
        String role = "";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            role = userDetails.getUser().getRole() != null
                    ? userDetails.getUser().getRole().getDescription()
                    : "";
        }

        final String roleLower = role.trim().toLowerCase();

        if (roleLower.equals("developer")) {
            // Developer: Backlog, To Do, In Progress, Fixed  (exclude Re Open and Done)
            List<String> excluded = Arrays.asList("re open", "reopen", "done", "completed", "closed", "resolved");
            return allTaskStatuses.stream()
                    .filter(s -> {
                        String name = (s.getDecription() != null ? s.getDecription() : "").toLowerCase().trim();
                        return excluded.stream().noneMatch(ex -> name.equals(ex) || name.contains(ex));
                    })
                    .collect(java.util.stream.Collectors.toList());
        }

        // Admin, Tester, and all other roles → return full list
        return allTaskStatuses;
    }
}
