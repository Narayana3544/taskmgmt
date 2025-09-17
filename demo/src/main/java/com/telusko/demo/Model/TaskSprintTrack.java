package com.telusko.demo.Model;

import javax.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "task_sprint_track")
public class TaskSprintTrack {
    @Id
    @GeneratedValue
    private int id;

    @ManyToOne
    @JoinColumn(name = "task_id")
    private task Task;

    @ManyToOne
    @JoinColumn(name="fromSprintId")
    private createsprint fromSprint;

    @ManyToOne
    @JoinColumn(name="toSprintId")
    private createsprint toSprint;

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

    public createsprint getFromSprint() {
        return fromSprint;
    }

    public void setFromSprint(createsprint fromSprint) {
        this.fromSprint = fromSprint;
    }

    public createsprint getToSprint() {
        return toSprint;
    }

    public void setToSprint(createsprint toSprint) {
        this.toSprint = toSprint;
    }
}
