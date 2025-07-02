package com.telusko.demo.repo;

import com.telusko.demo.Model.createsprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface createsprintrepo extends JpaRepository<createsprint,Long> {

}
