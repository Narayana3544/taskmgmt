package com.telusko.demo.user.repository;

import com.telusko.demo.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByOrganizationIdAndActiveTrue(Long organizationId, Pageable pageable);

    Page<User> findByOrganizationId(Long organizationId, Pageable pageable);
}
