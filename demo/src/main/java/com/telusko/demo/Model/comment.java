package com.telusko.demo.Model;

import jakarta.persistence.*;

@Entity
@Table
public class comment {
    @Id
    private String text;
    @ManyToOne
    @JoinColumn(name = "story_id")
    private  story story;
    private String Author;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public story getStory() {
        return story;
    }

    public void setStory(story story) {
        this.story = story;
    }

    public String getAuthor() {
        return Author;
    }

    public void setAuthor(String author) {
        Author = author;
    }
}
