package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.InvoiceItem;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {
	
	 List<InvoiceItem> findByInvoiceId(Long invoiceId);
	    List<InvoiceItem> findByMachineId(Long machineId);
	    

}
