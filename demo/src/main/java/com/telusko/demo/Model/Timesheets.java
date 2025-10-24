package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Date;
import java.time.LocalDateTime;
import java.util.Optional;

@Entity
@Table(name = "timesheets")
@Data
public class Timesheets {
    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Date WeekStart;
    private Date WeekEnd;

    @ManyToOne
    @JoinColumn(name = "status")
    private Task_status status;

    private int totalhours;

    private Date submittedOn;
    private Date approvedOn;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

    @CreationTimestamp
    private LocalDateTime createdAt;

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

    public Date getWeekStart() {
        return WeekStart;
    }

    public void setWeekStart(Date weekStart) {
        WeekStart = weekStart;
    }

    public Date getWeekEnd() {
        return WeekEnd;
    }

    public void setWeekEnd(Date weekEnd) {
        WeekEnd = weekEnd;
    }

    public Task_status getStatus() {
        return status;
    }

    public void setStatus(Task_status status) {
        this.status = status;
    }

    public int getTotalhours() {
        return totalhours;
    }

    public void setTotalhours(int totalhours) {
        this.totalhours = totalhours;
    }

    public Date getSubmittedOn() {
        return submittedOn;
    }

    public void setSubmittedOn(Date submittedOn) {
        this.submittedOn = submittedOn;
    }

    public Date getApprovedOn() {
        return approvedOn;
    }

    public void setApprovedOn(Date approvedOn) {
        this.approvedOn = approvedOn;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
