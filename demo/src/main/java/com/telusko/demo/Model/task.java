package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;

@Entity
@Data
@Table(name = "task_new")
public class task {

    @Id
    @GeneratedValue
    private int id;
    private String title;
    @ManyToOne
    @JoinColumn(name = "description",nullable = false)
    private Task_status status ;
    private java.sql.Date due_date;
    private String priority;
    private String des;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Task_status getStatus() {
        return status;
    }

    public void setStatus(Task_status status) {
        this.status = status;
    }

    public Date getDue_date() {
        return due_date;
    }

    public void setDue_date(Date due_date) {
        this.due_date = due_date;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getDes() {
        return des;
    }

    public void setDes(String des) {
        this.des = des;
    }
}
