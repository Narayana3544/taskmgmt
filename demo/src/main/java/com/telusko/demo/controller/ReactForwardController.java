package com.telusko.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactForwardController {

    @RequestMapping(value = "/**")
    public String forward() {
        return "forward:/index.html";
    }
}

