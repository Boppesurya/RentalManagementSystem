package com.xerox.rental.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.xerox.rental.entity.MachineLocation;

public interface MachineLocationRepository extends JpaRepository<MachineLocation, Long> {
	List<MachineLocation> findByMachineIdOrderByRecordedAtDesc(Long machineId);

    @Query("SELECT ml FROM MachineLocation ml WHERE ml.machine.id = :machineId AND ml.locationType = 'CURRENT' ORDER BY ml.recordedAt DESC")
    Optional<MachineLocation> findCurrentLocationByMachineId(@Param("machineId") Long machineId);

    List<MachineLocation> findByMachineIdAndRecordedAtBetweenOrderByRecordedAtDesc(
        Long machineId,
        LocalDateTime startDate,
        LocalDateTime endDate
    );

    List<MachineLocation> findByLocationTypeOrderByRecordedAtDesc(MachineLocation.LocationType locationType);

    @Query("SELECT ml FROM MachineLocation ml WHERE ml.machine.id IN :machineIds AND ml.locationType = 'CURRENT' ORDER BY ml.recordedAt DESC")
    List<MachineLocation> findCurrentLocationsByMachineIds(@Param("machineIds") List<Long> machineIds);

    List<MachineLocation> findByRecordedByIdOrderByRecordedAtDesc(Long userId);

    @Query("SELECT COUNT(ml) FROM MachineLocation ml WHERE ml.machine.id = :machineId")
    Long countLocationsByMachineId(@Param("machineId") Long machineId);

}
