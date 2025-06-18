package com.telusko.demo.repo;

import com.telusko.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface userrepo extends JpaRepository<User, Long> {
    Optional<User> findById(Integer id); // Correct for primary key

}
