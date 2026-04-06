package com.telusko.demo.common.service;

import com.telusko.demo.common.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path rootLocation;
    private final String baseUrl;

    public LocalFileStorageService(@Value("${file.upload-dir:./uploads}") String uploadDir,
                                   @Value("${file.base-url:http://localhost:8080/api/files}") String baseUrl) {
        this.rootLocation = Paths.get(uploadDir);
        this.baseUrl = baseUrl;
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }
        
        // Validate MIME type. jpg, jpeg, png, pdf
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("application/pdf"))) {
            throw new BadRequestException("Only JPEG, PNG and PDF files are allowed.");
        }
        
        // Validate size (2MB max)
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new BadRequestException("File size must not exceed 2MB.");
        }

        try {
            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown");
            String extension = originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf('.')) : "";
            String uniqueFilename = UUID.randomUUID().toString() + extension;
            
            Path targetFolder = folder != null && !folder.isEmpty() ? this.rootLocation.resolve(folder) : this.rootLocation;
            Files.createDirectories(targetFolder);
            
            Path destinationFile = targetFolder.resolve(Paths.get(uniqueFilename)).normalize().toAbsolutePath();
            
            if (!destinationFile.getParent().equals(targetFolder.normalize().toAbsolutePath())) {
                throw new BadRequestException("Cannot store file outside current directory.");
            }
            
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);
            
            // Return URL
            return baseUrl + "/" + (folder != null && !folder.isEmpty() ? folder + "/" : "") + uniqueFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file.", e);
        }
    }
}
