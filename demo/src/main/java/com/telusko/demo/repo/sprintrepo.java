package com.telusko.demo.repo;

import com.telusko.demo.Model.User;
import com.telusko.demo.Model.createsprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface sprintrepo extends JpaRepository<createsprint,Integer> {

}
