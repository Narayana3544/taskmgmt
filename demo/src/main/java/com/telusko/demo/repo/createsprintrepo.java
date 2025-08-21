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
public interface createsprintrepo extends JpaRepository<createsprint,Integer> {
    @Query("SELECT u FROM User u WHERE u.id NOT IN (" +
            "SELECT su.id FROM createsprint s JOIN s.users su " +
            "WHERE s.status = 'Active' AND s.startDate <= :endDate AND s.endDate >= :startDate)")
    List<User> findAvailableUsersForWeek(@Param("startDate") Date startDate, @Param("endDate") Date endDate);

    List<createsprint> findByFeatureId(int featureId);
}
