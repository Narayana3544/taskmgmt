package com.telusko.demo.holiday.repository;

import com.telusko.demo.holiday.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    @Query("SELECT h FROM Holiday h WHERE h.organization.id = :orgId AND YEAR(h.date) = :year ORDER BY h.date ASC")
    List<Holiday> findByOrganizationIdAndYear(@Param("orgId") Long orgId, @Param("year") int year);

    List<Holiday> findByOrganizationIdAndActiveTrueOrderByDateAsc(Long orgId);
}
