package com.telusko.demo.Model;

import javax.persistence.*;

@Entity
@Table(name = "status_code")
public class Status_code {
    @Id
    @GeneratedValue
    private int id;
    private String description;

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
}
