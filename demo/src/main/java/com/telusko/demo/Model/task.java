package com.telusko.demo.Model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
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
   private createsprint sprint;

   private Integer storypoints;
   private String userstory;
   private String description;

   @ManyToOne
   @JoinColumn(name = "feature_id")
   private Feature feature;

    @Lob
    @Column(name = "attachment")
    private byte[] attachmentData;

    private String attachmentName;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @CreationTimestamp
    @Column(name = "created_date", updatable = false)
    private LocalDateTime createdDate;

    private Date start_date;

    private Date end_date;

    @ManyToOne
    @JoinColumn(name = "task_type_id")
    private Task_type taskType;


    @ManyToOne
    @JoinColumn(name = "task_status_id")
    private Task_status taskStatus;

    private boolean is_active = true;

    @ManyToOne
    @JoinColumn(name = "reported_to")
    private User reportedTo;


    public String getAttachmentType() {
        return attachmentType;
    }

    public void setAttachmentType(String attachmentType) {
        this.attachmentType = attachmentType;
    }

    public String getAttachmentName() {
        return attachmentName;
    }

    public void setAttachmentName(String attachmentName) {
        this.attachmentName = attachmentName;
    }

    private String attachmentType; // To store file MIME type

    public byte[] getAttachment() {
        return attachmentData;
    }

    public void setAttachment(byte[] attachment) {
        this.attachmentData = attachment;
    }

    public User getReportedTo() {
        return reportedTo;
    }

    public void setReportedTo(User reportedTo) {
        this.reportedTo = reportedTo;
    }

    public createsprint getSprint() {
        return sprint;
    }

    public void setSprint(createsprint sprint) {
        this.sprint = sprint;
    }

    public Feature getFeature() {
        return feature;
    }

    public void setFeature(Feature feature) {
        this.feature = feature;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }



    public Task_type getTaskType() {
        return taskType;
    }

    public void setTaskType(Task_type taskType) {
        this.taskType = taskType;
    }

    public User getReported_to() {
        return reportedTo;
    }

    public void setReported_to(User reported_to) {
        this.reportedTo = reported_to;
    }

    public boolean isIs_active() {
        return is_active;
    }

    public void setIs_active(boolean is_active) {
        this.is_active = is_active;
    }



    public Task_status getTaskStatus() {
        return taskStatus;
    }

    public void setTaskStatus(Task_status taskStatus) {
        this.taskStatus = taskStatus;
    }

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


    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
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

}
