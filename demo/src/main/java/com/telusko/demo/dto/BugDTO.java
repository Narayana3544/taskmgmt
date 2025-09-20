package com.telusko.demo.dto;

import java.util.List;

// BugDTO.java
public record BugDTO(
        Integer id,
        String title,
        String description,
        String status,
        String reporter,
        String assignee,
        String priority,
        List<AttachmentDTO> attachments

) {
    @Override
    public Integer id() {
        return id;
    }

    @Override
    public String title() {
        return title;
    }

    @Override
    public String description() {
        return description;
    }

    @Override
    public String status() {
        return status;
    }

    @Override
    public String reporter() {
        return reporter;
    }

    @Override
    public String assignee() {
        return assignee;
    }

    @Override
    public List<AttachmentDTO> attachments() {
        return attachments;
    }
}