package com.telusko.demo.Model;

/**
 * Enum representing the status of a leave request.
 * Defines the workflow: PENDING → APPROVED/REJECTED, with CANCELLED option.
 */
public enum LeaveStatus {
    PENDING("Pending Manager Approval"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    CANCELLED("Cancelled by Employee"),
    PARTIALLY_APPROVED("Partially Approved");  // When only some days are approved
    
    private final String displayName;
    
    LeaveStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
