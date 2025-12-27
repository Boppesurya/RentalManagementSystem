package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MachineHealth;

@Repository
public interface MachineHealthRepository extends JpaRepository<MachineHealth, Long> {
	 Optional<MachineHealth> findByMachine(Machine machine);
	    List<MachineHealth> findByStatus(MachineHealth.HealthStatus status);
	    List<MachineHealth> findByHealthScoreLessThan(Double healthScore);
	    
	    @Query("SELECT mh FROM MachineHealth mh WHERE mh.nextMaintenance <= :date")
	    List<MachineHealth> findMachinesNeedingMaintenance(LocalDateTime date);
	    
	    @Query("SELECT mh FROM MachineHealth mh WHERE mh.tonerLevel <= :level")
	    List<MachineHealth> findMachinesWithLowToner(Integer level);
	    
	    @Query("SELECT mh FROM MachineHealth mh WHERE mh.paperLevel <= :level")
	    List<MachineHealth> findMachinesWithLowPaper(Integer level);
}
