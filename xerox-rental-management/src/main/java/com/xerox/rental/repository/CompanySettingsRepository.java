package com.xerox.rental.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.CompanySettings;
import com.xerox.rental.entity.User;

@Repository
public interface CompanySettingsRepository extends JpaRepository<CompanySettings, Long> {
	Optional<CompanySettings> findByOwner(User owner);
    Optional<CompanySettings> findByOwnerId(Long ownerId);
}
