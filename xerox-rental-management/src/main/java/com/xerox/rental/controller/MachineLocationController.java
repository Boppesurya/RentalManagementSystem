package com.xerox.rental.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.xerox.rental.dto.MachineLocationRequest;
import com.xerox.rental.dto.MachineLocationResponse;
import com.xerox.rental.entity.Machine;
import com.xerox.rental.entity.MachineLocation;
import com.xerox.rental.entity.User;
import com.xerox.rental.service.MachineLocationService;
import com.xerox.rental.service.MachineService;
import com.xerox.rental.service.UserService;

@RestController
@RequestMapping("/api/machine-locations")
@CrossOrigin(origins = "*")
public class MachineLocationController {
	@Autowired
    private MachineLocationService machineLocationService;

    @Autowired
    private MachineService machineService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<MachineLocationResponse>> getAllLocations() {
        List<MachineLocation> locations = machineLocationService.getAllLocations();
        List<MachineLocationResponse> responses = locations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MachineLocationResponse> getLocationById(@PathVariable Long id) {
        return machineLocationService.getLocationById(id)
            .map(this::convertToResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/machine/{machineId}")
    public ResponseEntity<List<MachineLocationResponse>> getLocationsByMachineId(@PathVariable Long machineId) {
        List<MachineLocation> locations = machineLocationService.getLocationsByMachineId(machineId);
        List<MachineLocationResponse> responses = locations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/machine/{machineId}/current")
    public ResponseEntity<MachineLocationResponse> getCurrentLocationByMachineId(@PathVariable Long machineId) {
        return machineLocationService.getCurrentLocationByMachineId(machineId)
            .map(this::convertToResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/machine/{machineId}/history")
    public ResponseEntity<List<MachineLocationResponse>> getLocationHistory(
        @PathVariable Long machineId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<MachineLocation> locations = machineLocationService.getLocationHistoryByMachineId(
            machineId, startDate, endDate
        );
        List<MachineLocationResponse> responses = locations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/type/{locationType}")
    public ResponseEntity<List<MachineLocationResponse>> getLocationsByType(
        @PathVariable MachineLocation.LocationType locationType
    ) {
        List<MachineLocation> locations = machineLocationService.getLocationsByType(locationType);
        List<MachineLocationResponse> responses = locations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    public ResponseEntity<MachineLocationResponse> createLocation(@RequestBody MachineLocationRequest request) {
        try {
            MachineLocation location = new MachineLocation();

            Optional<Machine> machine = machineService.getMachineById(request.getMachineId());
            if (machine.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            location.setMachine(machine.get());

            location.setLatitude(request.getLatitude());
            location.setLongitude(request.getLongitude());
            location.setAddress(request.getAddress());
            location.setCity(request.getCity());
            location.setState(request.getState());
            location.setCountry(request.getCountry());
            location.setPostalCode(request.getPostalCode());
            location.setNotes(request.getNotes());
            location.setRecordedAt(request.getRecordedAt() != null ? request.getRecordedAt() : LocalDateTime.now());

            if (request.getLocationType() != null) {
                location.setLocationType(MachineLocation.LocationType.valueOf(request.getLocationType().toUpperCase()));
            }

            if (request.getRecordedBy() != null) {
                Optional<User> recordedBy = userService.getUserById(request.getRecordedBy());
                recordedBy.ifPresent(location::setRecordedBy);
            }

            MachineLocation createdLocation = machineLocationService.createLocation(location);
            return ResponseEntity.ok(convertToResponse(createdLocation));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/machine/{machineId}/record-current")
    public ResponseEntity<MachineLocationResponse> recordCurrentLocation(
        @PathVariable Long machineId,
        @RequestBody MachineLocationRequest request
    ) {
        try {
            MachineLocation locationData = new MachineLocation();
            locationData.setLatitude(request.getLatitude());
            locationData.setLongitude(request.getLongitude());
            locationData.setAddress(request.getAddress());
            locationData.setCity(request.getCity());
            locationData.setState(request.getState());
            locationData.setCountry(request.getCountry());
            locationData.setPostalCode(request.getPostalCode());
            locationData.setNotes(request.getNotes());

            MachineLocation recordedLocation = machineLocationService.recordCurrentLocation(
                machineId, locationData, request.getRecordedBy()
            );

            return ResponseEntity.ok(convertToResponse(recordedLocation));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<MachineLocationResponse> updateLocation(
        @PathVariable Long id,
        @RequestBody MachineLocationRequest request
    ) {
        try {
            MachineLocation locationDetails = new MachineLocation();
            locationDetails.setLatitude(request.getLatitude());
            locationDetails.setLongitude(request.getLongitude());
            locationDetails.setAddress(request.getAddress());
            locationDetails.setCity(request.getCity());
            locationDetails.setState(request.getState());
            locationDetails.setCountry(request.getCountry());
            locationDetails.setPostalCode(request.getPostalCode());
            locationDetails.setNotes(request.getNotes());
            locationDetails.setRecordedAt(request.getRecordedAt());

            if (request.getLocationType() != null) {
                locationDetails.setLocationType(MachineLocation.LocationType.valueOf(request.getLocationType().toUpperCase()));
            }

            MachineLocation updatedLocation = machineLocationService.updateLocation(id, locationDetails);
            return ResponseEntity.ok(convertToResponse(updatedLocation));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Long id) {
        machineLocationService.deleteLocation(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/machine/{machineId}/count")
    public ResponseEntity<Long> getLocationCount(@PathVariable Long machineId) {
        Long count = machineLocationService.getLocationCountByMachineId(machineId);
        return ResponseEntity.ok(count);
    }

    private MachineLocationResponse convertToResponse(MachineLocation location) {
        MachineLocationResponse response = new MachineLocationResponse();
        response.setId(location.getId());

        if (location.getMachine() != null) {
            MachineLocationResponse.MachineInfo machineInfo = new MachineLocationResponse.MachineInfo();
            machineInfo.setId(location.getMachine().getId().toString());
            machineInfo.setName(location.getMachine().getName());
            machineInfo.setModel(location.getMachine().getModel());
            machineInfo.setSerialNumber(location.getMachine().getSerialNumber());
            response.setMachine(machineInfo);
        }

        response.setLatitude(location.getLatitude());
        response.setLongitude(location.getLongitude());
        response.setAddress(location.getAddress());
        response.setCity(location.getCity());
        response.setState(location.getState());
        response.setCountry(location.getCountry());
        response.setPostalCode(location.getPostalCode());
        response.setLocationType(location.getLocationType().name());
        response.setNotes(location.getNotes());
        response.setRecordedAt(location.getRecordedAt());

        if (location.getRecordedBy() != null) {
            MachineLocationResponse.UserInfo userInfo = new MachineLocationResponse.UserInfo();
            userInfo.setId(location.getRecordedBy().getId().toString());
            userInfo.setName(location.getRecordedBy().getName());
            response.setRecordedBy(userInfo);
        }

        response.setCreatedAt(location.getCreatedAt());
        response.setUpdatedAt(location.getUpdatedAt());

        return response;
    }

}
