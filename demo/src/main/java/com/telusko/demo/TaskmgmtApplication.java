package com.telusko.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main entry point for the TaskMgmt Enterprise Platform.
 */
@SpringBootApplication
@EnableAsync
public class TaskmgmtApplication {

	public static void main(String[] args) {
		SpringApplication.run(TaskmgmtApplication.class, args);
	}
}
