package com.telusko.demo.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "task")
@Data
public class Task {
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    @Id
    private int id;

    public String getUser_story() {
        return user_story;
    }

    public void setUser_story(String user_story) {
        this.user_story = user_story;
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

    public int getSprint_id() {
        return sprint_id;
    }

    public void setSprint_id(int sprint_id) {
        this.sprint_id = sprint_id;
    }

    public int getUser_id() {
        return user_id;
    }

    public void setUser_id(int user_id) {
        this.user_id = user_id;
    }

    public int getTask_status_id() {
        return task_status_id;
    }

    public void setTask_status_id(int task_status_id) {
        this.task_status_id = task_status_id;
    }

    public char getAttachment_flag() {
        return attachment_flag;
    }

    public void setAttachment_flag(char attachment_flag) {
        this.attachment_flag = attachment_flag;
    }

    private String user_story;
    private String acceptance_criteria;
    private String story_points;
    private int sprint_id;
    private int user_id;
    private int task_status_id;
    private char attachment_flag;

}
