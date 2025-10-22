package com.telusko.demo.dto;

public class UserDTO {
    private int userId;

    private String username;
    public UserDTO(int userId, String username, String email) {
        this.userId = userId;
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public int getUserId() {
        return userId;
    }


    public void setUserId(int userId) {
        this.userId = userId;
    }



}
