package com.xerox.rental.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.xerox.rental.dto.CompanySettingsRequest;
import com.xerox.rental.entity.CompanySettings;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.CompanySettingsRepository;
import com.xerox.rental.repository.UserRepository;

import jakarta.transaction.Transactional;



@Service
public class CompanySettingsService {

    @Autowired
    private CompanySettingsRepository companySettingsRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${company.upload.dir:uploads/company}")
    private String uploadDir;

    private static final String BASE_URL = "http://localhost:8080";

    public Optional<CompanySettings> getSettingsByOwnerId(Long ownerId) {
        return companySettingsRepository.findByOwnerId(ownerId);
    }

    @Transactional
    public CompanySettings createOrUpdateSettings(Long ownerId, CompanySettingsRequest req) {

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        CompanySettings settings = companySettingsRepository.findByOwnerId(ownerId)
                .orElse(new CompanySettings());

        settings.setOwner(owner);  // IMPORTANT

        if (req.getCompanyName() != null) settings.setCompanyName(req.getCompanyName());
        if (req.getDefaultCopyRatio() != null) settings.setDefaultCopyRatio(req.getDefaultCopyRatio());
        if (req.getDefaultFreeCopies() != null) settings.setDefaultFreeCopies(req.getDefaultFreeCopies());
        if (req.getAddress() != null) settings.setAddress(req.getAddress());
        if (req.getPhone() != null) settings.setPhone(req.getPhone());
        if (req.getEmail() != null) settings.setEmail(req.getEmail());
        if (req.getGstNumber() != null) settings.setGstNumber(req.getGstNumber());

        return companySettingsRepository.save(settings);
    }

    public CompanySettings uploadCompanyLogo(Long ownerId, MultipartFile file) throws IOException {
        CompanySettings settings = getOrCreateSettings(ownerId);
        String url = saveImage(file);
        settings.setCompanyLogoUrl(url);
        return companySettingsRepository.save(settings);
    }

    public CompanySettings uploadStampImage(Long ownerId, MultipartFile file) throws IOException {
        CompanySettings settings = getOrCreateSettings(ownerId);
        String url = saveImage(file);
        settings.setStampImageUrl(url);
        return companySettingsRepository.save(settings);
    }

    public CompanySettings uploadSignatureImage(Long ownerId, MultipartFile file) throws IOException {
        CompanySettings settings = getOrCreateSettings(ownerId);
        String url = saveImage(file);
        settings.setSignatureImageUrl(url);
        return companySettingsRepository.save(settings);
    }

    private CompanySettings getOrCreateSettings(Long ownerId) {
        return companySettingsRepository.findByOwnerId(ownerId)
            .orElseGet(() -> {
                User owner = userRepository.findById(ownerId)
                        .orElseThrow(() -> new RuntimeException("Owner not found"));
                CompanySettings settings = new CompanySettings();
                settings.setOwner(owner);
                return companySettingsRepository.save(settings);
            });
    }

    private String saveImage(MultipartFile file) throws IOException {

        String original = file.getOriginalFilename();
        String ext = original.substring(original.lastIndexOf("."));
        String unique = UUID.randomUUID().toString() + ext;

        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        Path path = Paths.get(uploadDir, unique);
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        // RETURN CLEAN PUBLIC URL
        return BASE_URL + "/uploads/company/" + unique;
    }

    public byte[] getImage(String imageName) throws IOException {
        Path path = Paths.get(uploadDir, imageName);
        return Files.readAllBytes(path);
    }
}