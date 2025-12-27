package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Contract;
import com.xerox.rental.entity.User;
@Repository
public interface ContractRepository extends JpaRepository<Contract, Long> {

    
List<Contract> findByOwner(User owner);
List<Contract> findByRental(User rental);
List<Contract> findByStatus(Contract.Status status);
}
