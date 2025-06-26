package com.telusko.demo.repo;

import com.telusko.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface profilerepo extends JpaRepository<User,Integer> {
    @Override
    Optional<User> findById(Integer integer);
}
