package com.telusko.demo.Model;

/**
 * Enum representing the status of a timesheet.
 * Defines the workflow: DRAFT → SUBMITTED → APPROVED/REJECTED.
 */
public enum TimesheetStatus {
    DRAFT("Draft - Not Submitted"),
    SUBMITTED("Submitted for Approval"),
    APPROVED("Approved"),
    REJECTED("Rejected - Needs Revision"),
    PARTIALLY_APPROVED("Partially Approved");
    
    private final String displayName;
    
    TimesheetStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
