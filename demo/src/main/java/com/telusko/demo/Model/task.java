package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.Date;

@Entity
@Data
@Table(name = "task")
public class task {

    @Id
    @GeneratedValue
    private int id;
    private String acceptance_criteria;
   private String attachment_flag;
   @ManyToOne
   @JoinColumn(name = "Sprint_id")
   private createsprint Sprint_id;

   private Integer storypoints;
   private String userstory;
   private String description;

   @ManyToOne
   @JoinColumn(name = "feature_id")
   private Feature feature_id;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @ManyToOne
   @JoinColumn(name = "user_id")
   private User user;

    @Column(updatable = false)
   private Date created_date;
   private Date start_date;
   private Date end_date;
   @ManyToOne
   @JoinColumn(name = "task_type_id")
   private Task_type taskType;

    public Task_type getTaskType() {
        return taskType;
    }

    public void setTaskType(Task_type taskType) {
        this.taskType = taskType;
    }

    @ManyToOne
   @JoinColumn(name = "task_status")
   private Task_status task_status;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getAcceptance_criteria() {
        return acceptance_criteria;
    }

    public void setAcceptance_criteria(String acceptance_criteria) {
        this.acceptance_criteria = acceptance_criteria;
    }

    public String getAttachment_flag() {
        return attachment_flag;
    }

    public void setAttachment_flag(String attachment_flag) {
        this.attachment_flag = attachment_flag;
    }

    public createsprint getSprint_id() {
        return Sprint_id;
    }

    public void setSprint_id(createsprint sprint_id) {
        Sprint_id = sprint_id;
    }

    public Integer getStorypoints() {
        return storypoints;
    }

    public void setStorypoints(Integer storypoints) {
        this.storypoints = storypoints;
    }

    public String getUserstory() {
        return userstory;
    }

    public void setUserstory(String userstory) {
        this.userstory = userstory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Feature getFeature_id() {
        return feature_id;
    }

    public void setFeature_id(Feature feature_id) {
        this.feature_id = feature_id;
    }

    public Date getCreated_date() {
        return created_date;
    }

    public void setCreated_date(Date created_date) {
        this.created_date = created_date;
    }

    public Date getStart_date() {
        return start_date;
    }

    public void setStart_date(Date start_date) {
        this.start_date = start_date;
    }

    public Date getEnd_date() {
        return end_date;
    }

    public void setEnd_date(Date end_date) {
        this.end_date = end_date;
    }

    public Task_status getTask_status() {
        return task_status;
    }

    public void setTask_status(Task_status task_status) {
        this.task_status = task_status;
    }
}
