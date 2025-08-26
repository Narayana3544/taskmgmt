package com.telusko.demo.controller;

import com.telusko.demo.Model.Task_status;
import com.telusko.demo.repo.Task_statusrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
