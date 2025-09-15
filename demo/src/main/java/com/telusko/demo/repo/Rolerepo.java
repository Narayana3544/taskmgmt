package com.telusko.demo.repo;

import com.telusko.demo.Model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Rolerepo  extends JpaRepository<Role,Integer> {
}
