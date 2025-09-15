package com.telusko.demo.Model;

import jakarta.persistence.*;

@Entity
@Table
public class comment {

    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private task task;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String description;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public task getTask() {
        return task;
    }

    public void setTask(task task) {
        this.task = task;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
