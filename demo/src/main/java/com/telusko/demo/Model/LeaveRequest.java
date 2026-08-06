package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;
import java.time.LocalDate;

@Entity
@Table(name = "leave_request")
@Data
public class LeaveRequest {

    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String leave_type;
    private Date startDate;
    private Date endDate;
    private String reason;
    @ManyToOne
    @JoinColumn(name = "status")
    private Task_status status;

    private LocalDate requestedOn;
    private LocalDate approvedOn;

    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;

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


    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Task_status getStatus() {
        return status;
    }

    public void setStatus(Task_status status) {
        this.status = status;
    }

    public User getManager() {
        return manager;
    }

    public void setManager(User manager) {
        this.manager = manager;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public LocalDate getRequestedOn() {
        return requestedOn;
    }

    public void setRequestedOn(LocalDate requestedOn) {
        this.requestedOn = requestedOn;
    }

    public LocalDate getApprovedOn() {
        return approvedOn;
    }

    public void setApprovedOn(LocalDate approvedOn) {
        this.approvedOn = approvedOn;
    }
}
