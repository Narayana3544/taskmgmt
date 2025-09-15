package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "status")
public class Task_status {
    @Id
    private int id;
    private String decription;
    private String sequence;

    @ManyToOne
    @JoinColumn(name = "statusCode")
    private  Status_code statusCode;

    public String getDecription() {
        return decription;
    }

    public void setDecription(String decription) {
        this.decription = decription;
    }

    public String getSequence() {
        return sequence;
    }

    public void setSequence(String sequence) {
        this.sequence = sequence;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }
    public enum Status {
        TODO, IN_PROGRESS, REVIEW, DONE
    }
}
