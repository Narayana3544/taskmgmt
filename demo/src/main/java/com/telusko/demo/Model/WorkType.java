package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "work_type")
@Data
public class WorkType {

    @Id
    @GeneratedValue
    private int id;

    private String Description;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getDescription() {
        return Description;
    }

    public void setDescription(String description) {
        Description = description;
    }
}