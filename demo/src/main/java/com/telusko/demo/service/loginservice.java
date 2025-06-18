package com.telusko.demo.service;

import com.telusko.demo.Model.User;
import com.telusko.demo.repo.userrepo;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class loginservice {

    PasswordEncoder encoder =new BCryptPasswordEncoder(10);

    @Autowired
    private userrepo repo;

    public List<User> getusers() {
        return repo.findAll();
    }

    public User register(User user){
        user.setPassword(encoder.encode(user.getPassword()));
        return repo.save(user);
    }

    public boolean deleteUserById(int id) {
        if (repo.existsById((long) id)) {
            repo.deleteById((long) id);
            return true;
        }
        return false;
    }
    public boolean checkPassword(int userId, String rawPassword) {
        Optional<String> encryptedPassword = repo.findById((long) userId)
                .map(User::getPassword);

        return encryptedPassword.isPresent() && encoder.matches(rawPassword, encryptedPassword.get());
    }
}
