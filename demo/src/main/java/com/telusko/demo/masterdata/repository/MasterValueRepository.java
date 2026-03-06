package com.telusko.demo.masterdata.repository;

import com.telusko.demo.masterdata.entity.MasterValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MasterValueRepository extends JpaRepository<MasterValue, Long> {
    List<MasterValue> findByMasterTypeIdAndActiveTrue(Long masterTypeId);

    List<MasterValue> findByMasterTypeCodeAndActiveTrue(String masterTypeCode);

    Optional<MasterValue> findByMasterTypeIdAndCode(Long masterTypeId, String code);

    @Query("SELECT mv FROM MasterValue mv WHERE mv.masterType.code = :typeCode AND mv.code = :code AND mv.active = true")
    Optional<MasterValue> findByMasterTypeCodeAndCode(
            @Param("typeCode") String typeCode, @Param("code") String code);
}
