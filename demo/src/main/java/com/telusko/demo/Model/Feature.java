package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "feature")
public class Feature {

    @Id
    @GeneratedValue
    private int id;
    private String descriptor;
    private int projectId;
    private String name;
    private String status;


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDescriptor() {
        return descriptor;
    }

    public void setDescriptor(String descriptor) {
        this.descriptor = descriptor;
    }

    public int getProjectId() {
        return projectId;
    }

    public void setProjectId(int projectId) {
        this.projectId = projectId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
