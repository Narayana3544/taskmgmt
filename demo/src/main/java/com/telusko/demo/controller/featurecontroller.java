package com.telusko.demo.controller;

import com.telusko.demo.Model.Feature;
import com.telusko.demo.service.featureservice;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class featurecontroller {

    @Autowired

    public featureservice service;

    @PostMapping("/projects/{project_id}/addfeature")
    public Feature addfeature(@RequestBody Feature feature){
        return service.addfeature(feature);
    }
    @GetMapping("/projects/{project_id}/features")
    public List<Feature> viewfeatures(){
        return service.viewfeatures();
    }
}
