package com.telusko.demo.Model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "create_task")
public class Create_Task {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private int id;

        @ManyToOne
        @JoinColumn(name = "status_id", nullable = false)
        private Task_status status;

        @ManyToOne
        @JoinColumn(name = "sprint_id")
        private createsprint sprint;

        @ManyToOne
        @JoinColumn(name = "story_id")
        private story story;

        @ManyToOne
        @JoinColumn(name = "user_id")
        private User user;

        private LocalDate createdDate;

        private LocalDate assignedDate;

        private LocalDate completedDate;

        @PrePersist
        public void setCreatedDate() {
            this.createdDate = LocalDate.now(); // sets system date automatically
        }

        public int getId() {
                return id;
        }

        public void setId(int id) {
                this.id = id;
        }

        public Task_status getStatus() {
                return status;
        }

        public void setStatus(Task_status status) {
                this.status = status;
        }

        public createsprint getSprint() {
                return sprint;
        }

        public void setSprint(createsprint Sprint) {
                this.sprint = Sprint;
        }

        public story getStory() {
                return story;
        }

        public void setStory(story story) {
                this.story = story;
        }

        public User getUser() {
                return user;
        }

        public void setUser(User user) {
                this.user = user;
        }

        public LocalDate getCreatedDate() {
                return createdDate;
        }

        public void setCreatedDate(LocalDate createdDate) {
                this.createdDate = createdDate;
        }

        public LocalDate getAssignedDate() {
                return assignedDate;
        }

        public void setAssignedDate(LocalDate assignedDate) {
                this.assignedDate = assignedDate;
        }

        public LocalDate getCompletedDate() {
                return completedDate;
        }

        public void setCompletedDate(LocalDate completedDate) {
                this.completedDate = completedDate;
        }
}

