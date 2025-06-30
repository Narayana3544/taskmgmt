package com.telusko.demo.service;

import com.telusko.demo.Model.story;
import com.telusko.demo.repo.userstoryrepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class userstoryservice {

    @Autowired
    private userstoryrepo repo;

    public story adduserstory(story story) {
        return repo.save(story);
    }
    public List<story> viewstories(){
        return repo.findAll();
    }
}

