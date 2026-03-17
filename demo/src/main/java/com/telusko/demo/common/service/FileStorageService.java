package com.telusko.demo.common.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Stores a file and returns its public access URL.
     * @param file the multipart file
     * @param folder optional subfolder (e.g. 'profiles', 'workitems')
     * @return URL string for the stored file
     */
    String storeFile(MultipartFile file, String folder);
}
