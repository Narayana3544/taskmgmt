package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "sprint")
public class Sprint {
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }
    public int getStart_date() {
        return start_date;
    }

    public void setStart_date(int start_date) {
        this.start_date = start_date;
    }

    public int getEnd_date() {
        return end_date;
    }

    public void setEnd_date(int end_date) {
        this.end_date = end_date;
    }

    public String getTargeted_story_points() {
        return targeted_story_points;
    }

    public void setTargeted_story_points(String targeted_story_points) {
        this.targeted_story_points = targeted_story_points;
    }

    public String getAchieved_story_points() {
        return achieved_story_points;
    }

    public void setAchieved_story_points(String achieved_story_points) {
        this.achieved_story_points = achieved_story_points;
    }

    @Id
    @GeneratedValue
    private int id;
    private int start_date;
    private int end_date;
    private String targeted_story_points;
    private String achieved_story_points;
    @ManyToOne
    @JoinColumn(name = "feature_id",nullable = false)
    private Feature feature ;

    public Feature getFeature() {
        return feature;
    }

    public void setFeature(Feature feature) {
        this.feature = feature;
    }
}
