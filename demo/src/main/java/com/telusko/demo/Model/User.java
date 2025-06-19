//package com.telusko.demo.Model;
//
//import jakarta.persistence.Entity;
//import jakarta.persistence.GeneratedValue;
//import jakarta.persistence.Id;
//import jakarta.persistence.Table;
//import lombok.Data;
//
//@Entity
//@Table(name = "user")
//@Data
//public class User {
//    @Id
//    @GeneratedValue
//    private int id;
//    private String First_name;
//    private String Last_name;
//    private int Role_id;
//    private  String username;
//    private String password;
//    private int created_date;
//
//    public int getId() {
//        return id;
//    }
//
//    public void setId(int id) {
//        this.id = id;
//    }
//
//    public String getFirst_name() {
//        return First_name;
//    }
//
//    public void setFirst_name(String first_name) {
//        First_name = first_name;
//    }
//
//    public String getLast_name() {
//        return Last_name;
//    }
//
//    public void setLast_name(String last_name) {
//        Last_name = last_name;
//    }
//
//    public int getRole_id() {
//        return Role_id;
//    }
//
//    public void setRole_id(int role_id) {
//        Role_id = role_id;
//    }
//
//    public String getUsername() {
//        return username;
//    }
//
//    public void setUsername(String username) {
//        this.username = username;
//    }
//
//    public String getPassword() {
//        return password;
//    }
//
//    public void setPassword(String password) {
//        this.password = password;
//    }
//
//    public int getCreated_date() {
//        return created_date;
//    }
//
//    public void setCreated_date(int created_date) {
//        this.created_date = created_date;
//    }
//}


package com.telusko.demo.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name ="register")
@Data
public class User {
    @Id
    @GeneratedValue
    private int id;
    private String first_name;
    private String last_name;
    private String preffered_name;
    private String email;
    private String password;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPreffered_name() {
        return preffered_name;
    }

    public void setPreffered_name(String preffered_name) {
        this.preffered_name = preffered_name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


}

