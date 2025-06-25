package com.telusko.demo.service;

import com.telusko.demo.Model.Userstory;
import com.telusko.demo.repo.userstoryrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class userstoryservice {

    @Autowired
    public userstoryrepo repo;

    public Userstory adduserstory(Userstory story) {
        return repo.save(story);
    }
}
