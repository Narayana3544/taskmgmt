package com.telusko.demo.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "feature")
public class Feature {

    @Id
    private int id;
    private String descriptor;
    private int project_id;
}
