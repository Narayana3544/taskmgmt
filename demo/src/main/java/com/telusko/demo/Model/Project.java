package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table
public class Project {
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Id
    @GeneratedValue
    private int id;
    private String name;
    private String description;
    @ManyToOne
    @JoinColumn(name = "status_id")
    private Task_status status;


    public Task_status getStatus() {
        return status;
    }

    public void setStatus(Task_status status) {
        this.status = status;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
