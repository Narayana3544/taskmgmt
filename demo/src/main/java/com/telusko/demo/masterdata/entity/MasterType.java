package com.telusko.demo.masterdata.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;

/**
 * Master type defines a category of configurable values (e.g., WORK_ITEM_TYPE,
 * PROJECT_STATUS, PRIORITY). Each type has multiple MasterValue children.
 */
@Entity
@Table(name = "master_type", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "organization_id", "code" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterType extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Organization organization;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
