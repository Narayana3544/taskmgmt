package com.telusko.demo.repo;

import com.telusko.demo.Model.comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface commentrepo  extends JpaRepository<comment,String> {

}
