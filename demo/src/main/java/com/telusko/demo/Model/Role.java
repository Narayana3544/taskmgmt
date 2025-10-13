package com.telusko.demo.Model;

import javax.persistence.*;
import lombok.Data;

@Entity
@Table(name = "ROle")
@Data
public class Role {
    @Id
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
