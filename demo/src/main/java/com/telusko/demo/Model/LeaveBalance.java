package com.telusko.demo.Model;

import javax.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Date;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "leave_balances")
public class LeaveBalance {

    @Id
    @GeneratedValue
    private int id;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String leave_type;
    private int totalAllocated;
    private int used;
    private int remaining;
    private int year;
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getLeave_type() {
        return leave_type;
    }

    public void setLeave_type(String leave_type) {
        this.leave_type = leave_type;
    }

    public int getTotalAllocated() {
        return totalAllocated;
    }

    public void setTotalAllocated(int totalAllocated) {
        this.totalAllocated = totalAllocated;
    }

    public int getUsed() {
        return used;
    }

    public void setUsed(int used) {
        this.used = used;
    }

    public int getRemaining() {
        return remaining;
    }

    public void setRemaining(int remaining) {
        this.remaining = remaining;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }


}
