package com.xerox.rental.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
	List<Document> findByDocumentTypeOrderByCreatedAtDesc(Document.DocumentType documentType);

    List<Document> findByStatusOrderByCreatedAtDesc(Document.Status status);

    List<Document> findByMachineIdOrderByCreatedAtDesc(Long machineId);

    List<Document> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Document> findByContractIdOrderByCreatedAtDesc(Long contractId);

    List<Document> findByUploadedByIdOrderByCreatedAtDesc(Long uploadedById);

    @Query("SELECT d FROM Document d WHERE d.entityType = :entityType AND d.entityId = :entityId ORDER BY d.createdAt DESC")
    List<Document> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") Long entityId);

    @Query("SELECT d FROM Document d WHERE d.expiryDate IS NOT NULL AND d.expiryDate <= :date AND d.status = 'ACTIVE' ORDER BY d.expiryDate ASC")
    List<Document> findExpiringDocuments(@Param("date") LocalDate date);

    @Query("SELECT d FROM Document d WHERE d.isPublic = true AND d.status = 'ACTIVE' ORDER BY d.createdAt DESC")
    List<Document> findPublicDocuments();

    @Query("SELECT d FROM Document d WHERE LOWER(d.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(d.tags) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY d.createdAt DESC")
    List<Document> searchDocuments(@Param("searchTerm") String searchTerm);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.documentType = :documentType")
    Long countByDocumentType(@Param("documentType") Document.DocumentType documentType);

    @Query("SELECT SUM(d.fileSize) FROM Document d WHERE d.status = 'ACTIVE'")
    Long getTotalStorageUsed();
}
