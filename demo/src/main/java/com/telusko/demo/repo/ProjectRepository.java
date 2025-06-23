package com.telusko.demo.repo;

import com.telusko.demo.Model.Project;
import com.telusko.demo.Model.User;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends CrudRepository<Project, Long> {
    Optional<Project> findById(int id);

}
