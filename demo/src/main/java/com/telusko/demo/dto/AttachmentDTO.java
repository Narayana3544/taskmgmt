package com.telusko.demo.dto;

import java.time.LocalDateTime;

// AttachmentDTO.java
public record AttachmentDTO(
        Integer id,
        String fileName,
        LocalDateTime uploadedAt
) {
    @Override
    public Integer id() {
        return id;
    }

    @Override
    public String fileName() {
        return fileName;
    }

    @Override
    public LocalDateTime uploadedAt() {
        return uploadedAt;
    }
}