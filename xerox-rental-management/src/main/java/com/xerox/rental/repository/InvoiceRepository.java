package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Invoice;
import com.xerox.rental.entity.User;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
	 List<Invoice> findByOwner(User owner);
	    List<Invoice> findByRental(User rental);
	    List<Invoice> findByStatus(Invoice.Status status);
	    boolean existsByInvoiceNumber(String invoiceNumber);

	    @Query("SELECT i FROM Invoice i WHERE i.machine.id = :machineId AND i.owner.id = :ownerId ORDER BY i.createdAt DESC")
	    List<Invoice> findByMachineIdAndOwnerIdOrderByCreatedAtDesc(
	        @Param("machineId") Long machineId,
	        @Param("ownerId") Long ownerId
	    );

	    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.owner.id = :ownerId")
	    long countByOwnerId(@Param("ownerId") Long ownerId);

	    @Query("SELECT i FROM Invoice i LEFT JOIN FETCH i.rental LEFT JOIN FETCH i.owner LEFT JOIN FETCH i.machine")
	    List<Invoice> findAllWithRelations();

	 @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(i.invoiceNumber, " +
	            "LOCATE('-', i.invoiceNumber, LOCATE('-', i.invoiceNumber)+1)+1) AS int)), 0) " +
	            "FROM Invoice i " +
	            "WHERE i.owner.id = :ownerId " +
	            "AND SUBSTRING(i.invoiceNumber, LOCATE('-', i.invoiceNumber)+1, 4) = :year")
	 Integer findHighestSeqByOwnerAndYear(@Param("ownerId") Long ownerId,
	                                          @Param("year") int year);
}
