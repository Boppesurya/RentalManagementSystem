package com.xerox.rental.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import com.xerox.rental.dto.CompanySettingsRequest;
import com.xerox.rental.dto.CompanySettingsResponse;
import com.xerox.rental.entity.CompanySettings;
import com.xerox.rental.entity.User;
import com.xerox.rental.mapper.CompanySettingsMapper;
import com.xerox.rental.service.CompanySettingsService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/company-settings")
@CrossOrigin(origins = "*")
public class CompanySettingsController {

    @Autowired
    private CompanySettingsService companySettingsService;

    @Autowired
    private UserService userService;

    // =========================
    //  GET SETTINGS BY OWNER
    // =========================
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<CompanySettingsResponse> getSettingsByOwnerId(@PathVariable Long ownerId) {
        return companySettingsService.getSettingsByOwnerId(ownerId)
                .map(cs -> ResponseEntity.ok(CompanySettingsMapper.toResponse(cs)))
                .orElse(ResponseEntity.notFound().build());
    }

    // =========================
    //  UPDATE BASIC SETTINGS
    // =========================
    @PostMapping("/owner/{ownerId}")
    public ResponseEntity<CompanySettingsResponse> createOrUpdateSettings(
            @PathVariable Long ownerId,
            @RequestBody CompanySettingsRequest request) {

        Optional<User> owner = userService.getUserById(ownerId);
        if (owner.isEmpty()) return ResponseEntity.badRequest().build();

        CompanySettings updated = companySettingsService.createOrUpdateSettings(ownerId, request);

        return ResponseEntity.ok(CompanySettingsMapper.toResponse(updated));
    }

    // =========================
    //  UPLOAD COMPANY LOGO
    // =========================
    @PostMapping(value = "/owner/{ownerId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CompanySettingsResponse> uploadLogo(
            @PathVariable Long ownerId,
            @RequestParam("file") MultipartFile file) {

        try {
            CompanySettings cs = companySettingsService.uploadCompanyLogo(ownerId, file);
            return ResponseEntity.ok(CompanySettingsMapper.toResponse(cs));

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // =========================
    //  UPLOAD STAMP
    // =========================
    @PostMapping(value = "/owner/{ownerId}/stamp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CompanySettingsResponse> uploadStamp(
            @PathVariable Long ownerId,
            @RequestParam("file") MultipartFile file) {

        try {
            CompanySettings cs = companySettingsService.uploadStampImage(ownerId, file);
            return ResponseEntity.ok(CompanySettingsMapper.toResponse(cs));

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // =========================
    //  UPLOAD SIGNATURE
    // =========================
    @PostMapping(value = "/owner/{ownerId}/signature", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CompanySettingsResponse> uploadSignature(
            @PathVariable Long ownerId,
            @RequestParam("file") MultipartFile file) {

        try {
            CompanySettings cs = companySettingsService.uploadSignatureImage(ownerId, file);
            return ResponseEntity.ok(CompanySettingsMapper.toResponse(cs));

        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // =========================
    //  SERVE IMAGE
    // =========================
    @GetMapping("/image/{fileName}")
    public ResponseEntity<Resource> getImage(@PathVariable String fileName) {
        try {
            byte[] bytes = companySettingsService.getImage(fileName);
            ByteArrayResource resource = new ByteArrayResource(bytes);

            MediaType type = MediaType.APPLICATION_OCTET_STREAM;

            if (fileName.toLowerCase().endsWith(".png"))
                type = MediaType.IMAGE_PNG;
            else if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg"))
                type = MediaType.IMAGE_JPEG;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .contentType(type)
                    .contentLength(bytes.length)
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    
}
