package com.telusko.demo.repo;

import com.telusko.demo.Model.PasswordResetToken;
import com.telusko.demo.Model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for PasswordResetToken entity.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    /**
     * Find token by token string
     */
    Optional<PasswordResetToken> findByToken(String token);
    
    /**
     * Find valid token by token string
     */
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.token = :token AND prt.used = false AND prt.expiryDate > :now")
    Optional<PasswordResetToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);
    
    /**
     * Invalidate all previous tokens for a user
     */
    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.used = true WHERE prt.user = :user AND prt.used = false")
    int invalidateAllTokensForUser(@Param("user") User user);
    
    /**
     * Delete expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.expiryDate < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
}
