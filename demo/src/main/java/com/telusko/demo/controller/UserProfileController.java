package com.telusko.demo.controller;

import com.telusko.demo.Model.User;
import com.telusko.demo.exception.ResourceNotFoundException;
import com.telusko.demo.repo.userrepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Enhanced controller for user profile management including avatar upload.
 */
@RestController
@RequestMapping("/api/v2/profile")
public class UserProfileController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserProfileController.class);
    private static final String UPLOAD_DIR = "uploads/avatars/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    private final userrepo userRepo;
    
    public UserProfileController(userrepo userRepo) {
        this.userRepo = userRepo;
    }
    
    /**
     * Get current user's profile
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProfileResponse> getMyProfile(@AuthenticationPrincipal User user) {
        User dbUser = userRepo.findById(user.getId());
        if (dbUser == null) {
            throw new ResourceNotFoundException("User", "id", user.getId());
        }
        return ResponseEntity.ok(toProfileResponse(dbUser));
    }
    
    /**
     * Upload avatar for current user
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File too large. Maximum 5MB"));
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
        }
        
        // Generate unique filename
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString() + extension;
        
        // Ensure upload directory exists
        Path uploadPath = Path.of(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Save file
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Update user profile
        User user = userRepo.findById(currentUser.getId());
        if (user != null) {
            user.setProfilePicturePath(filePath.toString());
            userRepo.save(user);
        }
        
        logger.info("Avatar uploaded for user {}: {}", currentUser.getId(), filename);
        
        return ResponseEntity.ok(Map.of(
                "message", "Avatar uploaded successfully",
                "path", "/api/v2/profile/avatar/" + currentUser.getId()
        ));
    }
    
    /**
     * Get avatar for a user
     */
    @GetMapping("/avatar/{userId}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable int userId) throws IOException {
        User user = userRepo.findById(userId);
        if (user == null || user.getProfilePicturePath() == null) {
            return ResponseEntity.notFound().build();
        }
        
        Path avatarPath = Path.of(user.getProfilePicturePath());
        if (!Files.exists(avatarPath)) {
            return ResponseEntity.notFound().build();
        }
        
        byte[] imageBytes = Files.readAllBytes(avatarPath);
        String mimeType = Files.probeContentType(avatarPath);
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType != null ? mimeType : "image/jpeg"))
                .body(imageBytes);
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
    
    private ProfileResponse toProfileResponse(User user) {
        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirst_name())
                .lastName(user.getLast_name())
                .department(user.getDepartment())
                .designation(user.getDesignation())
                .phoneNumber(user.getPhoneNumber())
                .employmentType(user.getEmploymentType() != null ? user.getEmploymentType().toString() : null)
                .joiningDate(user.getJoiningDate())
                .hasAvatar(user.getProfilePicturePath() != null && !user.getProfilePicturePath().isBlank())
                .avatarUrl(user.getProfilePicturePath() != null ? "/api/v2/profile/avatar/" + user.getId() : null)
                .role(user.getRole() != null ? user.getRole().getDescription() : null)
                .reportingManager(user.getReportingManager() != null ? 
                        user.getReportingManager().getFirst_name() + " " + user.getReportingManager().getLast_name() : null)
                .build();
    }
    
    // Profile response DTO
    @lombok.Builder
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProfileResponse {
        private int id;
        private String email;
        private String firstName;
        private String lastName;
        private String department;
        private String designation;
        private String phoneNumber;
        private String employmentType;
        private java.time.LocalDate joiningDate;
        private boolean hasAvatar;
        private String avatarUrl;
        private String role;
        private String reportingManager;
    }
}
