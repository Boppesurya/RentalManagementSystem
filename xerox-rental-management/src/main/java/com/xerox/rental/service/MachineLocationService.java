package com.xerox.rental.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MachineLocation;
import com.xerox.rental.entity.User;
import com.xerox.rental.repository.MachineLocationRepository;
import com.xerox.rental.repository.MachineRepository;
import com.xerox.rental.repository.UserRepository;

@Service
@Transactional
public class MachineLocationService {
	@Autowired
    private MachineLocationRepository machineLocationRepository;

    @Autowired
    private MachineRepository machineRepository;

    @Autowired
    private UserRepository userRepository;

    public List<MachineLocation> getAllLocations() {
        return machineLocationRepository.findAll();
    }

    public Optional<MachineLocation> getLocationById(Long id) {
        return machineLocationRepository.findById(id);
    }

    public List<MachineLocation> getLocationsByMachineId(Long machineId) {
        return machineLocationRepository.findByMachineIdOrderByRecordedAtDesc(machineId);
    }

    public Optional<MachineLocation> getCurrentLocationByMachineId(Long machineId) {
        return machineLocationRepository.findCurrentLocationByMachineId(machineId);
    }

    public List<MachineLocation> getLocationHistoryByMachineId(Long machineId, LocalDateTime startDate, LocalDateTime endDate) {
        return machineLocationRepository.findByMachineIdAndRecordedAtBetweenOrderByRecordedAtDesc(
            machineId, startDate, endDate
        );
    }

    public List<MachineLocation> getLocationsByType(MachineLocation.LocationType locationType) {
        return machineLocationRepository.findByLocationTypeOrderByRecordedAtDesc(locationType);
    }

    public List<MachineLocation> getCurrentLocationsByMachineIds(List<Long> machineIds) {
        return machineLocationRepository.findCurrentLocationsByMachineIds(machineIds);
    }

    public MachineLocation createLocation(MachineLocation location) {
        if (location.getRecordedAt() == null) {
            location.setRecordedAt(LocalDateTime.now());
        }

        MachineLocation savedLocation = machineLocationRepository.save(location);

        if (location.getLocationType() == MachineLocation.LocationType.CURRENT) {
            updateMachineCurrentLocation(location.getMachine(), location);
        }

        return savedLocation;
    }

    public MachineLocation updateLocation(Long id, MachineLocation locationDetails) {
        MachineLocation location = machineLocationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));

        if (locationDetails.getLatitude() != null) {
            location.setLatitude(locationDetails.getLatitude());
        }
        if (locationDetails.getLongitude() != null) {
            location.setLongitude(locationDetails.getLongitude());
        }
        if (locationDetails.getAddress() != null) {
            location.setAddress(locationDetails.getAddress());
        }
        if (locationDetails.getCity() != null) {
            location.setCity(locationDetails.getCity());
        }
        if (locationDetails.getState() != null) {
            location.setState(locationDetails.getState());
        }
        if (locationDetails.getCountry() != null) {
            location.setCountry(locationDetails.getCountry());
        }
        if (locationDetails.getPostalCode() != null) {
            location.setPostalCode(locationDetails.getPostalCode());
        }
        if (locationDetails.getLocationType() != null) {
            location.setLocationType(locationDetails.getLocationType());
        }
        if (locationDetails.getNotes() != null) {
            location.setNotes(locationDetails.getNotes());
        }
        if (locationDetails.getRecordedAt() != null) {
            location.setRecordedAt(locationDetails.getRecordedAt());
        }

        MachineLocation updatedLocation = machineLocationRepository.save(location);

        if (location.getLocationType() == MachineLocation.LocationType.CURRENT) {
            updateMachineCurrentLocation(location.getMachine(), location);
        }

        return updatedLocation;
    }

    public void deleteLocation(Long id) {
        machineLocationRepository.deleteById(id);
    }

    public Long getLocationCountByMachineId(Long machineId) {
        return machineLocationRepository.countLocationsByMachineId(machineId);
    }

    private void updateMachineCurrentLocation(Machine machine, MachineLocation location) {
        try {
            Machine fullMachine = machineRepository.findById(machine.getId())
                .orElseThrow(() -> new RuntimeException("Machine not found"));

            fullMachine.setCurrentLatitude(location.getLatitude());
            fullMachine.setCurrentLongitude(location.getLongitude());
            fullMachine.setCurrentAddress(location.getAddress());
            fullMachine.setLastLocationUpdate(location.getRecordedAt());

            machineRepository.save(fullMachine);
        } catch (Exception e) {
            System.err.println("Error updating machine current location: " + e.getMessage());
        }
    }

    public MachineLocation recordCurrentLocation(Long machineId, MachineLocation locationData, Long userId) {
        Machine machine = machineRepository.findById(machineId)
            .orElseThrow(() -> new RuntimeException("Machine not found with id: " + machineId));

        Optional<User> recordedBy = Optional.empty();
        if (userId != null) {
            recordedBy = userRepository.findById(userId);
        }

        Optional<MachineLocation> existingCurrentLocation = getCurrentLocationByMachineId(machineId);
        if (existingCurrentLocation.isPresent()) {
            MachineLocation existing = existingCurrentLocation.get();
            existing.setLocationType(MachineLocation.LocationType.HISTORICAL);
            machineLocationRepository.save(existing);
        }

        MachineLocation newLocation = new MachineLocation();
        newLocation.setMachine(machine);
        newLocation.setLatitude(locationData.getLatitude());
        newLocation.setLongitude(locationData.getLongitude());
        newLocation.setAddress(locationData.getAddress());
        newLocation.setCity(locationData.getCity());
        newLocation.setState(locationData.getState());
        newLocation.setCountry(locationData.getCountry());
        newLocation.setPostalCode(locationData.getPostalCode());
        newLocation.setLocationType(MachineLocation.LocationType.CURRENT);
        newLocation.setNotes(locationData.getNotes());
        newLocation.setRecordedAt(LocalDateTime.now());
        recordedBy.ifPresent(newLocation::setRecordedBy);

        return createLocation(newLocation);
    }
}
