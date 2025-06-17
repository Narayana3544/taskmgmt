package com.telusko.demo.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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

    public String getDescriptor() {
        return descriptor;
    }

    public void setDescriptor(String descriptor) {
        this.descriptor = descriptor;
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

    public int getFeature_id() {
        return feature_id;
    }

    public void setFeature_id(int feature_id) {
        this.feature_id = feature_id;
    }

    @Id
    private int id;
    private String descriptor;
    private int start_date;
    private int end_date;
    private String targeted_story_points;
    private String achieved_story_points;
    private int feature_id;

}
