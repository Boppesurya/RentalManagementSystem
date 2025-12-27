package com.xerox.rental.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.xerox.rental.entity.Document;
import com.xerox.rental.repository.ContractRepository;
import com.xerox.rental.repository.DocumentRepository;
import com.xerox.rental.repository.MachineRepository;
import com.xerox.rental.repository.UserRepository;

@Service
@Transactional
public class DocumentService {
	 @Autowired
	    private DocumentRepository documentRepository;

	    @Autowired
	    private UserRepository userRepository;

	    @Autowired
	    private MachineRepository machineRepository;

	    @Autowired
	    private ContractRepository contractRepository;

	    @Value("${document.upload.dir:uploads/documents}")
	    private String uploadDir;

	    public List<Document> getAllDocuments() {
	        return documentRepository.findAll();
	    }

	    public Optional<Document> getDocumentById(Long id) {
	        return documentRepository.findById(id);
	    }

	    public List<Document> getDocumentsByType(Document.DocumentType documentType) {
	        return documentRepository.findByDocumentTypeOrderByCreatedAtDesc(documentType);
	    }

	    public List<Document> getDocumentsByStatus(Document.Status status) {
	        return documentRepository.findByStatusOrderByCreatedAtDesc(status);
	    }

	    public List<Document> getDocumentsByMachine(Long machineId) {
	        return documentRepository.findByMachineIdOrderByCreatedAtDesc(machineId);
	    }

	    public List<Document> getDocumentsByUser(Long userId) {
	        return documentRepository.findByUserIdOrderByCreatedAtDesc(userId);
	    }

	    public List<Document> getDocumentsByContract(Long contractId) {
	        return documentRepository.findByContractIdOrderByCreatedAtDesc(contractId);
	    }

	    public List<Document> getDocumentsByEntity(String entityType, Long entityId) {
	        return documentRepository.findByEntityTypeAndEntityId(entityType, entityId);
	    }

	    public List<Document> getExpiringDocuments(LocalDate date) {
	        return documentRepository.findExpiringDocuments(date);
	    }

	    public List<Document> getPublicDocuments() {
	        return documentRepository.findPublicDocuments();
	    }

	    public List<Document> searchDocuments(String searchTerm) {
	        return documentRepository.searchDocuments(searchTerm);
	    }

	    public Document uploadDocument(MultipartFile file, Document documentMetadata) throws IOException {
	        String originalFilename = file.getOriginalFilename();
	        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
	        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

	        File uploadDirectory = new File(uploadDir);
	        if (!uploadDirectory.exists()) {
	            uploadDirectory.mkdirs();
	        }

	        Path filePath = Paths.get(uploadDir, uniqueFilename);
	        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

	        documentMetadata.setFileName(originalFilename);
	        documentMetadata.setFilePath(filePath.toString());
	        documentMetadata.setFileSize(file.getSize());
	        documentMetadata.setFileType(file.getContentType());

	        return documentRepository.save(documentMetadata);
	    }

	    public Document createDocument(Document document) {
	        return documentRepository.save(document);
	    }

	    public Document updateDocument(Long id, Document documentDetails) {
	        Document document = documentRepository.findById(id)
	            .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

	        if (documentDetails.getTitle() != null) {
	            document.setTitle(documentDetails.getTitle());
	        }
	        if (documentDetails.getDescription() != null) {
	            document.setDescription(documentDetails.getDescription());
	        }
	        if (documentDetails.getDocumentType() != null) {
	            document.setDocumentType(documentDetails.getDocumentType());
	        }
	        if (documentDetails.getStatus() != null) {
	            document.setStatus(documentDetails.getStatus());
	        }
	        if (documentDetails.getExpiryDate() != null) {
	            document.setExpiryDate(documentDetails.getExpiryDate());
	        }
	        if (documentDetails.getTags() != null) {
	            document.setTags(documentDetails.getTags());
	        }
	        if (documentDetails.getIsPublic() != null) {
	            document.setIsPublic(documentDetails.getIsPublic());
	        }
	        if (documentDetails.getVersion() != null) {
	            document.setVersion(documentDetails.getVersion());
	        }

	        return documentRepository.save(document);
	    }

	    public void deleteDocument(Long id) {
	        Document document = documentRepository.findById(id)
	            .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

	        try {
	            Path filePath = Paths.get(document.getFilePath());
	            Files.deleteIfExists(filePath);
	        } catch (IOException e) {
	            System.err.println("Error deleting file: " + e.getMessage());
	        }

	        documentRepository.deleteById(id);
	    }

	    public void incrementDownloadCount(Long id) {
	        Document document = documentRepository.findById(id)
	            .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
	        document.setDownloadCount(document.getDownloadCount() + 1);
	        documentRepository.save(document);
	    }

	    public byte[] getDocumentFile(Long id) throws IOException {
	        Document document = documentRepository.findById(id)
	            .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

	        Path filePath = Paths.get(document.getFilePath());
	        return Files.readAllBytes(filePath);
	    }

	    public Long getTotalStorageUsed() {
	        Long storage = documentRepository.getTotalStorageUsed();
	        return storage != null ? storage : 0L;
	    }

	    public Long getDocumentCountByType(Document.DocumentType documentType) {
	        return documentRepository.countByDocumentType(documentType);
	    }
}
