package com.telusko.demo.leave.entity;

import com.telusko.demo.common.entity.BaseEntity;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Tracks leave balance per user per leave type per year.
 */
@Entity
@Table(name = "leave_balance", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "leave_type_id", "year" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveBalance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private MasterValue leaveType;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "opening_balance", nullable = false, precision = 5, scale = 2)
    private BigDecimal openingBalance;

    @Column(name = "used_balance", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal usedBalance = BigDecimal.ZERO;

    @Column(name = "remaining_balance", nullable = false, precision = 5, scale = 2)
    private BigDecimal remainingBalance;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
