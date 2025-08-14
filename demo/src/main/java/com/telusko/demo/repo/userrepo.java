package com.telusko.demo.repo;

import com.telusko.demo.Model.User;
import com.telusko.demo.Model.story;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface userrepo extends JpaRepository<User, Long> {

    Optional<User> findById(int id);
    Optional<User> findByEmail(String email);
    List<User> findByRoleDescription(String description);


//    List<User> findAllById(List<Integer> userIds);
}
