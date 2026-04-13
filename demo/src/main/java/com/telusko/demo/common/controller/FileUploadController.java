package com.telusko.demo.common.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.common.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private final Path rootLocation;

    public FileUploadController(FileStorageService fileStorageService,
                                @Value("${file.upload-dir:./uploads}") String uploadDir) {
        this.fileStorageService = fileStorageService;
        this.rootLocation = Paths.get(uploadDir);
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "") String folder) {
        
        String fileUrl = fileStorageService.storeFile(file, folder);
        return ResponseEntity.ok(ApiResponse.success("File uploaded", Map.of("url", fileUrl)));
    }

    @GetMapping("/{folder}/{subfolder}/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFileInSubfolder(@PathVariable String folder, @PathVariable String subfolder, @PathVariable String filename) {
        return serveResource(Paths.get(folder).resolve(subfolder).resolve(filename));
    }

    @GetMapping("/{folder}/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFileInFolder(@PathVariable String folder, @PathVariable String filename) {
        return serveResource(Paths.get(folder).resolve(filename));
    }
    
    @GetMapping("/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        return serveResource(Paths.get(filename));
    }

    private ResponseEntity<Resource> serveResource(Path subPath) {
        try {
            Path file = rootLocation.resolve(subPath);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                String fileName = file.toString().toLowerCase();
                if (fileName.endsWith(".png")) contentType = "image/png";
                else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (fileName.endsWith(".gif")) contentType = "image/gif";
                else if (fileName.endsWith(".webp")) contentType = "image/webp";
                else if (fileName.endsWith(".pdf")) contentType = "application/pdf";
                
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
