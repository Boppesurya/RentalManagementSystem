package com.xerox.rental.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;


@Component
public class JwtUtil {
	 @Value("${jwt.secret:xerox-rental-management-secret-key-minimum-256-bits-for-hs256-algorithm}")
	    private String secret;

	    @Value("${jwt.expiration:86400000}")
	    private Long expiration;

	    private SecretKey getSigningKey() {
	        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
	        return Keys.hmacShaKeyFor(keyBytes);
	    }

	    public String extractUsername(String token) {
	        return extractClaim(token, Claims::getSubject);
	    }

	    public Date extractExpiration(String token) {
	        return extractClaim(token, Claims::getExpiration);
	    }

	    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
	        final Claims claims = extractAllClaims(token);
	        return claimsResolver.apply(claims);
	    }

	    private Claims extractAllClaims(String token) {
	        return Jwts.parserBuilder()
	                .setSigningKey(getSigningKey())
	                .build()
	                .parseClaimsJws(token)
	                .getBody();
	    }

	    private Boolean isTokenExpired(String token) {
	        return extractExpiration(token).before(new Date());
	    }

	    public String generateToken(String email, Long userId, String role) {
	        Map<String, Object> claims = new HashMap<>();
	        claims.put("userId", userId);
	        claims.put("role", role);
	        return createToken(claims, email);
	    }

	    private String createToken(Map<String, Object> claims, String subject) {
	        Date now = new Date();
	        Date expiryDate = new Date(now.getTime() + expiration);

	        return Jwts.builder()
	                .setClaims(claims)
	                .setSubject(subject)
	                .setIssuedAt(now)
	                .setExpiration(expiryDate)
	                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
	                .compact();
	    }

	    public Boolean validateToken(String token, String email) {
	        final String username = extractUsername(token);
	        return (username.equals(email) && !isTokenExpired(token));
	    }

	    public Long extractUserId(String token) {
	        Claims claims = extractAllClaims(token);
	        return claims.get("userId", Long.class);
	    }

	    public String extractRole(String token) {
	        Claims claims = extractAllClaims(token);
	        return claims.get("role", String.class);
	    }
}
