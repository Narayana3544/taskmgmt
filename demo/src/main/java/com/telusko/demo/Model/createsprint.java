package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;
import java.util.List;

@Entity
@Table
@Data
public class createsprint {
    @Id
    @GeneratedValue
    private int id;
    private String name;
    private java.sql.Date startDate;
    private java.sql.Date endDate;
    @ManyToOne
    @JoinColumn(name = "feature_id",nullable = false)
    private Feature feature;
    @ManyToMany
    @JoinTable(
            name = "sprint_users",
            joinColumns = @JoinColumn(name = "sprint_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> users;

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }


    public Feature getFeature() {
        return feature;
    }

    public void setFeature(Feature feature) {
        this.feature = feature;
    }
}
