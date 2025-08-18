package com.telusko.demo.dto;

import java.util.List;

public class AssignUsersRequest {
    private Long projectId;
    private List<Long> userIds;

    // getters and setters

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public List<Long> getUserIds() {
        return userIds;
    }

    public void setUserIds(List<Long> userIds) {
        this.userIds = userIds;
    }
}
