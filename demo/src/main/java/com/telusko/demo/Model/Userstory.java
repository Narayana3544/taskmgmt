package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "task")
@Data
public class Userstory {

    @Id
    private int id;
    private String description;
    private String acceptance_criteria;
    private String story_points;
//    private int sprint_id;
@ManyToOne
@JoinColumn(name = "user_id", nullable = false)
private User userstory;
@ManyToOne
@JoinColumn(name="feature_id",nullable=false)
private Feature feature;
//    private int task_status_id;
//    private char attachment_flag;
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public User getUserstory() {
        return userstory;
    }

    public void setUserstory(User userstory) {
        this.userstory = userstory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAcceptance_criteria() {
        return acceptance_criteria;
    }

    public void setAcceptance_criteria(String acceptance_criteria) {
        this.acceptance_criteria = acceptance_criteria;
    }

    public String getStory_points() {
        return story_points;
    }

    public void setStory_points(String story_points) {
        this.story_points = story_points;
    }

    }

//    public int getTask_status_id() {
//        return task_status_id;
//    }
//
//    public void setTask_status_id(int task_status_id) {
//        this.task_status_id = task_status_id;
//    }
//
//    public char getAttachment_flag() {
//        return attachment_flag;
//    }
//
//    public void setAttachment_flag(char attachment_flag) {
//        this.attachment_flag = attachment_flag;
//    }




