package com.telusko.demo.audit.service;

import com.telusko.demo.audit.entity.AuditLog;
import com.telusko.demo.audit.repository.AuditLogRepository;
import com.telusko.demo.user.entity.User;
import com.telusko.demo.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Append-only audit log service.
 * Records WHO did WHAT on WHICH entity WHEN.
 * Audit entries are NEVER modified or deleted.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Log an audit event. This is fire-and-forget to not block business operations.
     */
    @Async
    @Transactional
    public void logAction(String entityType, Long entityId, String action,
            String oldValue, String newValue, Long performedById) {
        try {
            User performer = performedById != null && performedById > 0
                    ? userRepository.findById(performedById).orElse(null)
                    : null;

            AuditLog entry = AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .performedBy(performer)
                    .performedAt(LocalDateTime.now())
                    .source(performer == null ? "SYSTEM" : "USER")
                    .build();

            auditLogRepository.save(entry);
            log.debug("Audit logged: {} {} on {}#{}", action, entityType, entityType, entityId);
        } catch (Exception ex) {
            // Audit logging should NEVER break business flow
            log.error("Failed to write audit log: {} {} on {}#{}",
                    action, entityType, entityType, entityId, ex);
        }
    }

    /** Convenience method for system-triggered actions. */
    public void logSystemAction(String entityType, Long entityId, String action,
            String oldValue, String newValue) {
        logAction(entityType, entityId, action, oldValue, newValue, 0L);
    }
}
