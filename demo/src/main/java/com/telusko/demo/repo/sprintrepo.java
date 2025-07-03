package com.telusko.demo.repo;

import com.telusko.demo.Model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface sprintrepo extends JpaRepository<Sprint,Integer> {

}
