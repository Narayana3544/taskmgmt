package com.telusko.demo.repo;

import com.telusko.demo.Model.Task_type;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Task_typerepo extends JpaRepository<Task_type,Integer> {

}
