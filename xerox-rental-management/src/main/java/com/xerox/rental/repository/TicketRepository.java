package com.xerox.rental.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Ticket;
import com.xerox.rental.entity.User;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

	List<Ticket> findByCreatedBy(User createdBy);
    List<Ticket> findByAssignedTo(User assignedTo);
    List<Ticket> findByStatus(Ticket.Status status);
    List<Ticket> findByPriority(Ticket.Priority priority);
    List<Ticket> findByOwner(User owner);
}
