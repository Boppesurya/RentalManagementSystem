package com.xerox.rental.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Entity
@Table(name = "tickets")
@AllArgsConstructor
@NoArgsConstructor
public class Ticket {
	  @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id;
	    
	    @Column(nullable = false)
	    private String title;
	    
	    @Column( nullable = false)
	    private String description;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Priority priority = Priority.MEDIUM;
	    
	    @Enumerated(EnumType.STRING)
	    @Column(nullable = false)
	    private Status status = Status.OPEN;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "created_by", nullable = false)
	    private User createdBy;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "assigned_to")
	    private User assignedTo;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "machine_id")
	    private Machine machine;

	    @Column(name = "image_url", length = 500)
	    private String imageUrl;
	    
	    @Column(name="technician_Note")
	    private String technicianNote;

	    @Column(name = "image_file_name")
	    private String imageFileName;

	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "owner_id")
	    private User owner;

	    @Column(name = "email_sent")
	    private Boolean emailSent = false;

	    @CreationTimestamp
	    @Column(name = "created_at")
	    private LocalDateTime createdAt;

	    @UpdateTimestamp
	    @Column(name = "updated_at")
	    private LocalDateTime updatedAt;
	    
	    public enum Priority {
	        LOW, MEDIUM, HIGH
	    }
	    
	    public enum Status {
	        OPEN, IN_PROGRESS, RESOLVED, CLOSED
	    }
}
