package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "task_track")
@Data
public class Task_track {
    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private task Task;

    @ManyToOne
    @JoinColumn(name = "fromUser")
    private User Fromuser;

    @ManyToOne
    @JoinColumn(name = "toUser")
    private User Touser;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public task getTask() {
        return Task;
    }

    public void setTask(task task) {
        Task = task;
    }

    public User getFromuser() {
        return Fromuser;
    }

    public void setFromuser(User fromuser) {
        Fromuser = fromuser;
    }

    public User getTouser() {
        return Touser;
    }

    public void setTouser(User touser) {
        Touser = touser;
    }
}
