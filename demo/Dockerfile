# Step 1: Use Eclipse Temurin (official OpenJDK successor, actively maintained)
FROM eclipse-temurin:21-jre-alpine

# Step 2: Set working directory inside container
WORKDIR /app

# Step 3: Copy built war file into container
COPY target/task-mgmt.war app.war

# Step 4: Expose port 8080 (Spring Boot default)
EXPOSE 8080

# Step 5: Run the war (Spring Boot executable war)
ENTRYPOINT ["java", "-jar", "app.war"]
