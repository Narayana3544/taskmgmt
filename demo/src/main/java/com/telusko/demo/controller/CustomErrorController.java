package com.telusko.demo.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);

        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());

            // If a 404 is thrown (which happens when a user refreshes a React route),
            // forward the request to the React index.html so React Router can handle it.
            if (statusCode == HttpStatus.NOT_FOUND.value()) {
                return "forward:/index.html";
            }
        }
        
        return "error"; // fallback to default error page if not 404
    }
}
