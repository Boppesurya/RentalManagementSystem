package com.xerox.rental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.xerox.rental.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{
	 Optional<User> findByEmail(String email);
	    List<User> findByRole(User.Role role);
	    boolean existsByEmail(String email);
	    
	    @Query("SELECT u FROM User u LEFT JOIN FETCH u.owner")
	    List<User> findAllWithOwner();
	    
	    @Query("SELECT u FROM User u LEFT JOIN FETCH u.owner WHERE u.role = :role")
	    List<User> findByRoleWithOwner(User.Role role);
	    
	    @Query("SELECT u FROM User u LEFT JOIN FETCH u.owner WHERE u.owner.id = :ownerId")
	    List<User> findByOwnerId(Long ownerId);
	    
	    @Query("SELECT u FROM User u WHERE u.owner.id = :ownerId AND u.role IN :roles")
	    List<User> findByOwner_IdAndRoleIn(@Param("ownerId") Long ownerId, @Param("roles") List<User.Role> roles);
	    // ✅ Get all technicians belonging to a specific owner
	    List<User> findByOwnerAndRole(User owner, User.Role role);

}
