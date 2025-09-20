package com.telusko.demo.repo;

import com.telusko.demo.Model.Priority;
import org.springframework.data.jpa.repository.JpaRepository;

public interface Priorityrepo extends JpaRepository<Priority,Integer> {
}
