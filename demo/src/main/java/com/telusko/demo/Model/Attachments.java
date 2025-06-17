package com.telusko.demo.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "attachments")
public class Attachments {

    @Id
    private int id;
    private int task_id;

    public String getFilename_path() {
        return filename_path;
    }

    public void setFilename_path(String filename_path) {
        this.filename_path = filename_path;
    }

    public int getTask_id() {
        return task_id;
    }

    public void setTask_id(int task_id) {
        this.task_id = task_id;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    private String filename_path;
}
