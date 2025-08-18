package com.telusko.demo.repo;

import com.telusko.demo.Model.Team;
import com.telusko.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface Teamrepo extends JpaRepository<Team,Integer> {

    List<Team> findByProject_Id(Integer projectId);

    List<User> findUsersByProject_Id(Integer projectId);

    Optional<Team> findByProjectIdAndUserId(Integer projectId, Integer userId);
}
