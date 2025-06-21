package com.telusko.demo.service;

import com.telusko.demo.Model.Project;
import com.telusko.demo.repo.ProjectRepository;
import com.telusko.demo.repo.userrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class projectservice {

    @Autowired
    private ProjectRepository repo;

    public Project addproject(Project project) {
        return repo.save(project);
    }

    public List<Project> viewprojects() {
        return (List<Project>) repo.findAll();
    }
}
