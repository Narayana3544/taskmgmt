package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.sql.Date;

@Entity
@Table(name = "userstory")
@Data
public class story {
    @Id
    @GeneratedValue
    private int id;
    private String description;
    private String acceptancecriteria;
    private int storypoints;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User userstory;



    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @ManyToOne
    @JoinColumn(name = "feature_id",nullable =false)
    private Feature feature;
    private String status;
    @ManyToOne
    @JoinColumn(name = "sprint_id")
    private createsprint sprint;

    public createsprint getSprint() {
        return sprint;
    }

    public void setSprint(createsprint sprint) {
        this.sprint = sprint;
    }

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

    public String getAcceptancecriteria() {
        return acceptancecriteria;
    }

    public void setAcceptancecriteria(String acceptancecriteria) {
        this.acceptancecriteria = acceptancecriteria;
    }

    public int getStorypoints() {
        return storypoints;
    }

    public void setStorypoints(int storypoints) {
        this.storypoints = storypoints;
    }

    public User getUserstory() {
        return userstory;
    }

    public void setUserstory(User userstory) {
        this.userstory = userstory;
    }

    public Feature getFeature() {
        return feature;
    }

    public void setFeature(Feature feature) {
        this.feature = feature;
    }
}
