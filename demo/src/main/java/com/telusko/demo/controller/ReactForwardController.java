package com.telusko.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

// @Controller // Disabled to prevent intercepting static assets in Tomcat deployment. CustomErrorController handles 404s instead.
public class ReactForwardController {

    @RequestMapping(value = "/**")
    public String forward() {
        return "forward:/index.html";
    }
}

