# Step 1: Use official OpenJDK base image
FROM openjdk:21-jdk-slim

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy built jar file into container
COPY target/task-mgmt.jar app.jar

# Step 4: Expose port 8080 (Spring Boot default)
EXPOSE 8080

# Step 5: Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
