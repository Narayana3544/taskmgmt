package com.telusko.demo.repo;

import com.telusko.demo.Model.RefreshToken;
import com.telusko.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for RefreshToken entity.
 * Supports token lookup, revocation, and cleanup.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    /**
     * Find token by token string
     */
    Optional<RefreshToken> findByToken(String token);
    
    /**
     * Find all valid tokens for a user
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.expiryDate > :now")
    List<RefreshToken> findValidTokensByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * Find all tokens for a user
     */
    List<RefreshToken> findByUser(User user);
    
    /**
     * Revoke all tokens for a user (logout from all devices)
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user")
    int revokeAllTokensForUser(@Param("user") User user);
    
    /**
     * Revoke a specific token
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.token = :token")
    int revokeToken(@Param("token") String token);
    
    /**
     * Delete expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * Count active sessions for a user
     */
    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = :user AND rt.revoked = false AND rt.expiryDate > :now")
    long countActiveSessionsForUser(@Param("user") User user, @Param("now") LocalDateTime now);
}
