package com.telusko.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class TaskmgmtApplication  extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(TaskmgmtApplication.class);
	}

	public static void main(String[] args) {
		System.out.println("Starting TaskmgmtApplication...");
		SpringApplication.run(TaskmgmtApplication.class, args);
	}

}
