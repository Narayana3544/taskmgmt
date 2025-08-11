package com.telusko.demo.service;

import com.telusko.demo.Model.Project;
import com.telusko.demo.repo.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

    public void deleteproject(int id) {
        repo.deleteById((long) id);
    }
//
//    public Project updateproject(Project project) {
//        return repo.save(project);
//    }

    public Project updateProject(Long id, Project updatedProject) {
        return repo.findById(id)
                .map(project -> {
                    project.setName(updatedProject.getName());
                    project.setDescription(updatedProject.getDescription());
                    project.setStatus(updatedProject.getStatus());
                    return repo.save(project);
                })
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    public Optional<Project> getProjectByid(long id) {
        return repo.findById(id);
    }
}
