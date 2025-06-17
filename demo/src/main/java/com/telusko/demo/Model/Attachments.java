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
    private String filename_path;
}
