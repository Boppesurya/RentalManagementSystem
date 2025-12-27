package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.User;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
	 List<Machine> findByOwner(User owner);
	    List<Machine> findByRental(User rental);
	    List<Machine> findByStatus(Machine.Status status);
	    boolean existsBySerialNumber(String serialNumber);
	    @Query("SELECT m FROM Machine m LEFT JOIN FETCH m.owner LEFT JOIN FETCH m.rental")
	    List<Machine> findAllWithRelations();
	    
	    @Query("SELECT m FROM Machine m WHERE m.rental.id = :rentalId")
	    List<Machine> findByRentalId(Long rentalId);
	    
	    @Query("SELECT COUNT(m) FROM Machine m WHERE m.owner.id = :ownerId")
	    int countByOwnerId(Long ownerId);

}
