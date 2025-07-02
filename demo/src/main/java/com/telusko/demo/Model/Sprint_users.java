package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "sprint_users")
public class Sprint_users {
@Id
@GeneratedValue
  private int id ;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    @ManyToOne
    @JoinColumn(name = "sprint_id",nullable = false)
    private Sprint sprint;
    @ManyToOne
    @JoinColumn(name = "user-id",nullable = false)
    private User user;

    public Sprint getSprint() {
        return sprint;
    }

    public void setSprint(Sprint sprint) {
        this.sprint = sprint;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
