//package com.telusko.demo.controller;
//
//import com.telusko.demo.Model.Timesheets;
//import com.telusko.demo.dto.TimesheetRequest;
//import com.telusko.demo.service.TimeSheetService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.Authentication;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RestController;
//
//@RestController
//public class TimeSheetController {
//
//    @Autowired
//    public TimeSheetService service;
//
//    @PostMapping("/timesheets")
//    public ResponseEntity<Timesheets> createTImesheets(@RequestBody TimesheetRequest request, Authentication authentication){
//        Timesheets timesheet = service.createTimesheet(
//                request.getUserId(),
//                request.getManagerId(),
//                request.getWeekStart(),
//                request.getWeekEnd()
//        );
//        return ResponseEntity.ok(timesheet);
//    }
//    }
//
