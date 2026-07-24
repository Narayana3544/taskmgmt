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

	@org.springframework.context.annotation.Bean
	public org.springframework.boot.CommandLineRunner initData(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM status WHERE id = 12", Integer.class);
				if (count != null && count == 0) {
					jdbcTemplate.execute("INSERT INTO status (id, decription, sequence, status_code) VALUES (12, 'Backlog', 4, 1)");
				}
				Integer count2 = jdbcTemplate.queryForObject("SELECT count(*) FROM status WHERE id = 13", Integer.class);
				if (count2 != null && count2 == 0) {
					jdbcTemplate.execute("INSERT INTO status (id, decription, sequence, status_code) VALUES (13, 'Backlog', 4, 3)");
				}
			} catch (Exception e) {
				System.out.println("Could not insert Backlog status: " + e.getMessage());
			}
		};
	}

}
