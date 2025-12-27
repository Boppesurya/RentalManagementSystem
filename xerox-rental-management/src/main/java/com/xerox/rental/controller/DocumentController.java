package com.xerox.rental.controller;

import com.xerox.rental.dto.DocumentRequest;
import com.xerox.rental.dto.DocumentResponse;
import com.xerox.rental.entity.Contract;
import com.xerox.rental.entity.Document;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.ContractService;
import com.xerox.rental.service.DocumentService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {
	 @Autowired
	    private DocumentService documentService;

	    @Autowired
	    private UserService userService;

	    @Autowired
	    private MachineService machineService;

	    @Autowired
	    private ContractService contractService;

	    @GetMapping
	    public ResponseEntity<List<DocumentResponse>> getAllDocuments() {
	        List<Document> documents = documentService.getAllDocuments();
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/{id}")
	    public ResponseEntity<DocumentResponse> getDocumentById(@PathVariable Long id) {
	        return documentService.getDocumentById(id)
	            .map(this::convertToResponse)
	            .map(ResponseEntity::ok)
	            .orElse(ResponseEntity.notFound().build());
	    }

	    @GetMapping("/type/{documentType}")
	    public ResponseEntity<List<DocumentResponse>> getDocumentsByType(
	        @PathVariable Document.DocumentType documentType
	    ) {
	        List<Document> documents = documentService.getDocumentsByType(documentType);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/status/{status}")
	    public ResponseEntity<List<DocumentResponse>> getDocumentsByStatus(
	        @PathVariable Document.Status status
	    ) {
	        List<Document> documents = documentService.getDocumentsByStatus(status);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/machine/{machineId}")
	    public ResponseEntity<List<DocumentResponse>> getDocumentsByMachine(@PathVariable Long machineId) {
	        List<Document> documents = documentService.getDocumentsByMachine(machineId);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/user/{userId}")
	    public ResponseEntity<List<DocumentResponse>> getDocumentsByUser(@PathVariable Long userId) {
	        List<Document> documents = documentService.getDocumentsByUser(userId);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/contract/{contractId}")
	    public ResponseEntity<List<DocumentResponse>> getDocumentsByContract(@PathVariable Long contractId) {
	        List<Document> documents = documentService.getDocumentsByContract(contractId);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/entity/{entityType}/{entityId}")
	    public ResponseEntity<List<DocumentResponse>> getDocumentsByEntity(
	        @PathVariable String entityType,
	        @PathVariable Long entityId
	    ) {
	        List<Document> documents = documentService.getDocumentsByEntity(entityType, entityId);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/expiring")
	    public ResponseEntity<List<DocumentResponse>> getExpiringDocuments(
	        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
	    ) {
	        List<Document> documents = documentService.getExpiringDocuments(date);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/public")
	    public ResponseEntity<List<DocumentResponse>> getPublicDocuments() {
	        List<Document> documents = documentService.getPublicDocuments();
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @GetMapping("/search")
	    public ResponseEntity<List<DocumentResponse>> searchDocuments(@RequestParam String query) {
	        List<Document> documents = documentService.searchDocuments(query);
	        List<DocumentResponse> responses = documents.stream()
	            .map(this::convertToResponse)
	            .collect(Collectors.toList());
	        return ResponseEntity.ok(responses);
	    }

	    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	    public ResponseEntity<DocumentResponse> uploadDocument(
	        @RequestParam("file") MultipartFile file,
	        @RequestParam("title") String title,
	        @RequestParam("documentType") String documentType,
	        @RequestParam("uploadedBy") Long uploadedBy,
	        @RequestParam(value = "description", required = false) String description,
	        @RequestParam(value = "machineId", required = false) Long machineId,
	        @RequestParam(value = "userId", required = false) Long userId,
	        @RequestParam(value = "contractId", required = false) Long contractId,
	        @RequestParam(value = "expiryDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate,
	        @RequestParam(value = "tags", required = false) String tags,
	        @RequestParam(value = "isPublic", required = false, defaultValue = "false") Boolean isPublic
	    ) {
	        try {
	            Document document = new Document();
	            document.setTitle(title);
	            document.setDescription(description);
	            document.setDocumentType(Document.DocumentType.valueOf(documentType.toUpperCase()));
	            document.setExpiryDate(expiryDate);
	            document.setTags(tags);
	            document.setIsPublic(isPublic);

	            Optional<User> uploader = userService.getUserById(uploadedBy);
	            if (uploader.isEmpty()) {
	                return ResponseEntity.badRequest().build();
	            }
	            document.setUploadedBy(uploader.get());

	            if (machineId != null) {
	                Optional<Machine> machine = machineService.getMachineById(machineId);
	                machine.ifPresent(document::setMachine);
	            }

	            if (userId != null) {
	                Optional<User> user = userService.getUserById(userId);
	                user.ifPresent(document::setUser);
	            }

	            if (contractId != null) {
	                Optional<Contract> contract = contractService.getContractById(contractId);
	                contract.ifPresent(document::setContract);
	            }

	            Document savedDocument = documentService.uploadDocument(file, document);
	            return ResponseEntity.ok(convertToResponse(savedDocument));
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }

	    @PutMapping("/{id}")
	    public ResponseEntity<DocumentResponse> updateDocument(
	        @PathVariable Long id,
	        @RequestBody DocumentRequest request
	    ) {
	        try {
	            Document documentDetails = new Document();
	            documentDetails.setTitle(request.getTitle());
	            documentDetails.setDescription(request.getDescription());

	            if (request.getDocumentType() != null) {
	                documentDetails.setDocumentType(Document.DocumentType.valueOf(request.getDocumentType().toUpperCase()));
	            }

	            if (request.getStatus() != null) {
	                documentDetails.setStatus(Document.Status.valueOf(request.getStatus().toUpperCase()));
	            }

	            documentDetails.setExpiryDate(request.getExpiryDate());
	            documentDetails.setTags(request.getTags());
	            documentDetails.setIsPublic(request.getIsPublic());
	            documentDetails.setVersion(request.getVersion());

	            Document updatedDocument = documentService.updateDocument(id, documentDetails);
	            return ResponseEntity.ok(convertToResponse(updatedDocument));
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.badRequest().build();
	        }
	    }

	    @DeleteMapping("/{id}")
	    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
	        documentService.deleteDocument(id);
	        return ResponseEntity.ok().build();
	    }

	    @GetMapping("/{id}/download")
	    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) {
	        try {
	            Optional<Document> documentOpt = documentService.getDocumentById(id);
	            if (documentOpt.isEmpty()) {
	                return ResponseEntity.notFound().build();
	            }

	            Document document = documentOpt.get();
	            byte[] data = documentService.getDocumentFile(id);
	            ByteArrayResource resource = new ByteArrayResource(data);

	            documentService.incrementDownloadCount(id);

	            return ResponseEntity.ok()
	                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
	                .contentType(MediaType.parseMediaType(document.getFileType()))
	                .contentLength(data.length)
	                .body(resource);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.internalServerError().build();
	        }
	    }

	    @GetMapping("/stats/storage")
	    public ResponseEntity<Long> getTotalStorageUsed() {
	        Long storage = documentService.getTotalStorageUsed();
	        return ResponseEntity.ok(storage);
	    }

	    @GetMapping("/stats/count/{documentType}")
	    public ResponseEntity<Long> getDocumentCountByType(@PathVariable Document.DocumentType documentType) {
	        Long count = documentService.getDocumentCountByType(documentType);
	        return ResponseEntity.ok(count);
	    }

	    private DocumentResponse convertToResponse(Document document) {
	        DocumentResponse response = new DocumentResponse();
	        response.setId(document.getId());
	        response.setTitle(document.getTitle());
	        response.setDescription(document.getDescription());
	        response.setDocumentType(document.getDocumentType().name());
	        response.setFileName(document.getFileName());
	        response.setFilePath(document.getFilePath());
	        response.setFileSize(document.getFileSize());
	        response.setFileType(document.getFileType());
	        response.setEntityType(document.getEntityType());
	        response.setEntityId(document.getEntityId());

	        if (document.getMachine() != null) {
	            DocumentResponse.MachineInfo machineInfo = new DocumentResponse.MachineInfo();
	            machineInfo.setId(document.getMachine().getId().toString());
	            machineInfo.setName(document.getMachine().getName());
	            machineInfo.setSerialNumber(document.getMachine().getSerialNumber());
	            response.setMachine(machineInfo);
	        }

	        if (document.getUser() != null) {
	            DocumentResponse.UserInfo userInfo = new DocumentResponse.UserInfo();
	            userInfo.setId(document.getUser().getId().toString());
	            userInfo.setName(document.getUser().getName());
	            userInfo.setEmail(document.getUser().getEmail());
	            response.setUser(userInfo);
	        }

	        if (document.getContract() != null) {
	            DocumentResponse.ContractInfo contractInfo = new DocumentResponse.ContractInfo();
	            contractInfo.setId(document.getContract().getId().toString());
	            contractInfo.setContractNumber(document.getContract().getRental().getContactNumber());;
	            response.setContract(contractInfo);
	        }

	        if (document.getUploadedBy() != null) {
	            DocumentResponse.UserInfo uploaderInfo = new DocumentResponse.UserInfo();
	            uploaderInfo.setId(document.getUploadedBy().getId().toString());
	            uploaderInfo.setName(document.getUploadedBy().getName());
	            uploaderInfo.setEmail(document.getUploadedBy().getEmail());
	            response.setUploadedBy(uploaderInfo);
	        }

	        response.setVersion(document.getVersion());
	        response.setStatus(document.getStatus().name());
	        response.setExpiryDate(document.getExpiryDate());
	        response.setTags(document.getTags());
	        response.setIsPublic(document.getIsPublic());
	        response.setDownloadCount(document.getDownloadCount());
	        response.setCreatedAt(document.getCreatedAt());
	        response.setUpdatedAt(document.getUpdatedAt());

	        return response;
	    }
}
