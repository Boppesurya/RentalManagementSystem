package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MaintenanceSchedule;
import com.xerox.rental.entity.User;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {
	 List<MaintenanceSchedule> findByMachine(Machine machine);
	    List<MaintenanceSchedule> findByTechnician(User technician);
	    List<MaintenanceSchedule> findByStatus(MaintenanceSchedule.MaintenanceStatus status);
	    
	    @Query("SELECT ms FROM MaintenanceSchedule ms WHERE ms.scheduledDate BETWEEN :start AND :end")
	    List<MaintenanceSchedule> findByScheduledDateBetween(LocalDateTime start, LocalDateTime end);
	    
	    @Query("SELECT ms FROM MaintenanceSchedule ms WHERE ms.scheduledDate <= :date AND ms.status = 'SCHEDULED'")
	    List<MaintenanceSchedule> findOverdueMaintenance(LocalDateTime date);
}
