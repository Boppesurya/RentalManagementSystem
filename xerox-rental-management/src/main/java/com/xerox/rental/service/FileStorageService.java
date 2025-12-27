package com.xerox.rental.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileStorageService {
	private final String uploadDir = "uploads/tickets/";

    public List<String> storeFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return List.of();

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            return files.stream().map(file -> {
                try {
                    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    Path filePath = uploadPath.resolve(filename);
                    file.transferTo(filePath.toFile());
                    return "/uploads/tickets/" + filename; // relative URL for frontend
                } catch (Exception e) {
                    throw new RuntimeException("File upload failed: " + file.getOriginalFilename(), e);
                }
            }).collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("File upload error", e);
        }
    }
}
