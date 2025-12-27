package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.RentalRequest;
import com.xerox.rental.entity.User;

@Repository
public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {
	 List<RentalRequest> findByOwner(User owner);
	    List<RentalRequest> findByRental(User rental);
	    List<RentalRequest> findByStatus(RentalRequest.Status status);
}
