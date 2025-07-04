package com.telusko.demo.dto;

import com.telusko.demo.Model.User;
import com.telusko.demo.Model.story;

import java.util.List;

public class SprintOverviewDTO {
    private int sprintId;
    private String sprintName;
    private String startDate;
    private String endDate;
    private String featureName;
    private List<User> assignedUsers;
    private List<story> userStories;
    private int totalStoryPoints;
    private int completedStoryPoints;

    public int getSprintId() {
        return sprintId;
    }

    public void setSprintId(int sprintId) {
        this.sprintId = sprintId;
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getFeatureName() {
        return featureName;
    }

    public void setFeatureName(String featureName) {
        this.featureName = featureName;
    }

    public List<User> getAssignedUsers() {
        return assignedUsers;
    }

    public void setAssignedUsers(List<User> assignedUsers) {
        this.assignedUsers = assignedUsers;
    }

    public List<story> getUserStories() {
        return userStories;
    }

    public void setUserStories(List<story> userStories) {
        this.userStories = userStories;
    }

    public int getTotalStoryPoints() {
        return totalStoryPoints;
    }

    public void setTotalStoryPoints(int totalStoryPoints) {
        this.totalStoryPoints = totalStoryPoints;
    }

    public int getCompletedStoryPoints() {
        return completedStoryPoints;
    }

    public void setCompletedStoryPoints(int completedStoryPoints) {
        this.completedStoryPoints = completedStoryPoints;
    }
}
