package com.telusko.demo.masterdata.entity;

import com.telusko.demo.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Master value represents a configurable option within a MasterType.
 * Examples: status values, priority levels, leave types, notification types.
 * Replaces all scattered lookup tables (Task_status, Task_type, Priority,
 * etc.).
 */
@Entity
@Table(name = "master_value")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterValue extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_type_id", nullable = false)
    private MasterType masterType;

    @Column(nullable = false, length = 100)
    private String code;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(length = 255)
    private String description;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
