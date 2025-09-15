package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Date;
import java.time.LocalDateTime;

@Entity
@Table(name = "Time_sheet_entries")
@Data
public class TimesheetEntry {
    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    @JoinColumn(name = "timesheet")
    private Timesheets timesheet;

    private Date date;

    @ManyToOne
    @JoinColumn(name = "task_Workedon")
    private task task;

    private String Comment;
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

    public Timesheets getTimesheet() {
        return timesheet;
    }

    public void setTimesheet(Timesheets timesheet) {
        this.timesheet = timesheet;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public task getTask() {
        return task;
    }

    public void setTask(task task) {
        this.task = task;
    }

    public String getComment() {
        return Comment;
    }

    public void setComment(String comment) {
        Comment = comment;
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
