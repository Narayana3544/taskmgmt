package com.telusko.demo.masterdata.service;

import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.masterdata.entity.MasterType;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.repository.MasterTypeRepository;
import com.telusko.demo.masterdata.repository.MasterValueRepository;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import com.telusko.demo.role.entity.Role;
import com.telusko.demo.role.repository.RoleRepository;
import com.telusko.demo.rbac.entity.PermissionFeature;
import com.telusko.demo.rbac.entity.PermissionAction;
import com.telusko.demo.rbac.entity.RolePermission;
import com.telusko.demo.rbac.repository.PermissionFeatureRepository;
import com.telusko.demo.rbac.repository.PermissionActionRepository;
import com.telusko.demo.rbac.repository.RolePermissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing master types and values.
 * Master data drives all configurable dropdowns — statuses, types, priorities,
 * etc.
 */
@Service
public class MasterDataService {

    private static final Logger log = LoggerFactory.getLogger(MasterDataService.class);

    private final MasterTypeRepository typeRepository;
    private final MasterValueRepository valueRepository;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final PermissionFeatureRepository featureRepository;
    private final PermissionActionRepository actionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public MasterDataService(MasterTypeRepository typeRepository,
            MasterValueRepository valueRepository,
            OrganizationRepository organizationRepository,
            RoleRepository roleRepository,
            PermissionFeatureRepository featureRepository,
            PermissionActionRepository actionRepository,
            RolePermissionRepository rolePermissionRepository) {
        this.typeRepository = typeRepository;
        this.valueRepository = valueRepository;
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
        this.featureRepository = featureRepository;
        this.actionRepository = actionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Transactional(readOnly = true)
    public List<MasterType> getTypesByOrg(Long orgId) {
        return typeRepository.findByOrganizationIdAndActiveTrue(orgId);
    }

    @Transactional
    public MasterType createType(Long orgId, String code, String name, String description) {
        log.info("Creating master type '{}' for org: {}", code, orgId);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        MasterType type = MasterType.builder()
                .organization(org)
                .code(code)
                .name(name)
                .description(description)
                .active(true)
                .build();
        return typeRepository.save(type);
    }

    @Transactional(readOnly = true)
    public List<MasterValue> getValuesByType(Long typeId) {
        return valueRepository.findByMasterTypeIdAndActiveTrue(typeId);
    }

    @Transactional(readOnly = true)
    public MasterType getTypeByCode(Long orgId, String code) {
        return typeRepository.findByOrganizationIdAndCode(orgId, code).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MasterValue> getValuesByTypeCode(String typeCode) {
        return valueRepository.findByMasterTypeCodeAndActiveTrue(typeCode);
    }

    @Transactional
    public MasterValue createValue(Long typeId, String code, String displayName,
            String description, Integer sortOrder, Boolean isDefault) {
        log.info("Creating master value '{}' for type: {}", code, typeId);
        MasterType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterType", "id", typeId));

        MasterValue value = MasterValue.builder()
                .masterType(type)
                .code(code)
                .displayName(displayName)
                .description(description)
                .sortOrder(sortOrder)
                .isDefault(isDefault != null ? isDefault : false)
                .active(true)
                .build();
        return valueRepository.save(value);
    }

    /**
     * Update a master type's mutable fields (name, description).
     * Code is immutable once created.
     */
    @Transactional
    public MasterType updateType(Long typeId, String name, String description) {
        MasterType type = typeRepository.findById(typeId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterType", "id", typeId));

        if (name != null && !name.isBlank()) {
            type.setName(name);
        }
        if (description != null) {
            type.setDescription(description);
        }
        log.info("Updated master type: id={}, name='{}'", typeId, type.getName());
        return typeRepository.save(type);
    }

    /**
     * Update a master value's mutable fields (displayName, description, sortOrder, isDefault, active).
     * Code is immutable once created.
     */
    @Transactional
    public MasterValue updateValue(Long valueId, String displayName, String description,
                                    Integer sortOrder, Boolean isDefault, Boolean active) {
        MasterValue value = valueRepository.findById(valueId)
                .orElseThrow(() -> new ResourceNotFoundException("MasterValue", "id", valueId));

        if (displayName != null && !displayName.isBlank()) {
            value.setDisplayName(displayName);
        }
        if (description != null) {
            value.setDescription(description);
        }
        if (sortOrder != null) {
            value.setSortOrder(sortOrder);
        }
        if (isDefault != null) {
            value.setIsDefault(isDefault);
        }
        if (active != null) {
            value.setActive(active);
        }
        log.info("Updated master value: id={}, displayName='{}'", valueId, value.getDisplayName());
        return valueRepository.save(value);
    }

    /**
     * Seeds default master data for a new organization.
     * Called after organization creation or on first setup.
     */
    @Transactional
    public void seedDefaultData(Long orgId) {
        log.info("Seeding default master data for org: {}", orgId);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));

        // === Work item statuses (BACKLOG → OPEN → IN_PROGRESS → DONE) ===
        MasterType wiStatus = createTypeIfNotExists(org, "WORK_ITEM_STATUS", "Work Item Status");
        createValueIfNotExists(wiStatus, "BACKLOG", "Backlog", 1, true);
        createValueIfNotExists(wiStatus, "OPEN", "Open", 2, false);
        createValueIfNotExists(wiStatus, "IN_PROGRESS", "In Progress", 3, false);
        createValueIfNotExists(wiStatus, "DONE", "Done", 4, false);

        // === Work item types (TASK, BUG, TEST_CASE) ===
        MasterType wiType = createTypeIfNotExists(org, "WORK_ITEM_TYPE", "Work Item Type");
        createValueIfNotExists(wiType, "TASK", "Task", 1, true);
        createValueIfNotExists(wiType, "BUG", "Bug", 2, false);
        createValueIfNotExists(wiType, "TEST_CASE", "Test Case", 3, false);

        // === Priority ===
        MasterType priority = createTypeIfNotExists(org, "PRIORITY", "Priority");
        createValueIfNotExists(priority, "LOW", "Low", 1, false);
        createValueIfNotExists(priority, "MEDIUM", "Medium", 2, true);
        createValueIfNotExists(priority, "HIGH", "High", 3, false);
        createValueIfNotExists(priority, "CRITICAL", "Critical", 4, false);

        // === Project status (ACTIVE, ON_HOLD, CLOSED) ===
        MasterType projStatus = createTypeIfNotExists(org, "PROJECT_STATUS", "Project Status");
        createValueIfNotExists(projStatus, "ACTIVE", "Active", 1, true);
        createValueIfNotExists(projStatus, "ON_HOLD", "On Hold", 2, false);
        createValueIfNotExists(projStatus, "CLOSED", "Closed", 3, false);

        // === Sprint status (PLANNED → ACTIVE → CLOSED) ===
        MasterType sprintStatus = createTypeIfNotExists(org, "SPRINT_STATUS", "Sprint Status");
        createValueIfNotExists(sprintStatus, "PLANNED", "Planned", 1, true);
        createValueIfNotExists(sprintStatus, "ACTIVE", "Active", 2, false);
        createValueIfNotExists(sprintStatus, "CLOSED", "Closed", 3, false);

        // === Timesheet status ===
        MasterType tsStatus = createTypeIfNotExists(org, "TIMESHEET_STATUS", "Timesheet Status");
        createValueIfNotExists(tsStatus, "DRAFT", "Draft", 1, true);
        createValueIfNotExists(tsStatus, "SUBMITTED", "Submitted", 2, false);
        createValueIfNotExists(tsStatus, "APPROVED", "Approved", 3, false);
        createValueIfNotExists(tsStatus, "REJECTED", "Rejected", 4, false);

        // === Timesheet entry types ===
        MasterType tsEntryType = createTypeIfNotExists(org, "TIMESHEET_ENTRY_TYPE", "Timesheet Entry Type");
        createValueIfNotExists(tsEntryType, "WORK", "Work", 1, true);
        createValueIfNotExists(tsEntryType, "TIME_OFF", "Time Off", 2, false);

        // === Leave types ===
        MasterType leaveType = createTypeIfNotExists(org, "LEAVE_TYPE", "Leave Type");
        createValueIfNotExists(leaveType, "CL", "Casual Leave", 1, false);
        createValueIfNotExists(leaveType, "SL", "Sick Leave", 2, false);
        createValueIfNotExists(leaveType, "PL", "Privileged Leave", 3, false);

        // === Leave status ===
        MasterType leaveStatus = createTypeIfNotExists(org, "LEAVE_STATUS", "Leave Status");
        createValueIfNotExists(leaveStatus, "APPLIED", "Applied", 1, true);
        createValueIfNotExists(leaveStatus, "APPROVED", "Approved", 2, false);
        createValueIfNotExists(leaveStatus, "REJECTED", "Rejected", 3, false);
        createValueIfNotExists(leaveStatus, "CANCELLED", "Cancelled", 4, false);

        // === Notification event types ===
        MasterType notifType = createTypeIfNotExists(org, "NOTIFICATION_EVENT", "Notification Event");
        createValueIfNotExists(notifType, "TASK_ASSIGNED", "Task Assigned", 1, false);
        createValueIfNotExists(notifType, "TASK_HANDOFF", "Task Handoff", 2, false);
        createValueIfNotExists(notifType, "TASK_CLOSED", "Task Closed", 3, false);
        createValueIfNotExists(notifType, "SPRINT_STARTED", "Sprint Started", 4, false);
        createValueIfNotExists(notifType, "SPRINT_CLOSED", "Sprint Closed", 5, false);
        createValueIfNotExists(notifType, "SPILLOVER", "Sprint Spillover", 6, false);
        createValueIfNotExists(notifType, "TIMESHEET_SUBMITTED", "Timesheet Submitted", 7, false);
        createValueIfNotExists(notifType, "TIMESHEET_APPROVED", "Timesheet Approved", 8, false);
        createValueIfNotExists(notifType, "LEAVE_APPLIED", "Leave Applied", 9, false);
        createValueIfNotExists(notifType, "LEAVE_APPROVED", "Leave Approved", 10, false);
        createValueIfNotExists(notifType, "LEAVE_REJECTED", "Leave Rejected", 11, false);
        createValueIfNotExists(notifType, "TIME_OFF_APPROVAL", "Time Off Approval Required", 12, false);

        // === Roles (For UI Data Driven fields) ===
        MasterType roleType = createTypeIfNotExists(org, "ROLE", "Role");
        createValueIfNotExists(roleType, "ADMIN", "Administrator", 1, false);
        createValueIfNotExists(roleType, "MANAGER", "Manager", 2, false);
        createValueIfNotExists(roleType, "EMPLOYEE", "Employee", 3, true);

        // === Leave Reasons (Additional dummy data) ===
        MasterType leaveReason = createTypeIfNotExists(org, "LEAVE_REASON", "Leave Reason");
        createValueIfNotExists(leaveReason, "MEDICAL", "Medical Issue", 1, false);
        createValueIfNotExists(leaveReason, "VACATION", "Vacation / Travel", 2, false);
        createValueIfNotExists(leaveReason, "FAMILY", "Family Emergency", 3, false);
        createValueIfNotExists(leaveReason, "OTHER", "Other", 4, true);

        // === Project Categories (Additional dummy data) ===
        MasterType projCat = createTypeIfNotExists(org, "PROJECT_CATEGORY", "Project Category");
        createValueIfNotExists(projCat, "INTERNAL", "Internal Project", 1, false);
        createValueIfNotExists(projCat, "CLIENT", "Client Project", 2, true);
        createValueIfNotExists(projCat, "RESEARCH", "R&D", 3, false);

        // === Seed EMPLOYEE role + default RBAC permissions ===
        seedRolesAndPermissions(org);

        log.info("Default master data seeded for org: {}", orgId);
    }

    private MasterType createTypeIfNotExists(Organization org, String code, String name) {
        return typeRepository.findByOrganizationIdAndCode(org.getId(), code)
                .orElseGet(() -> typeRepository.save(MasterType.builder()
                        .organization(org).code(code).name(name).active(true).build()));
    }

    private void createValueIfNotExists(MasterType type, String code, String displayName,
            Integer sortOrder, Boolean isDefault) {
        if (valueRepository.findByMasterTypeIdAndCode(type.getId(), code).isEmpty()) {
            valueRepository.save(MasterValue.builder()
                    .masterType(type).code(code).displayName(displayName)
                    .sortOrder(sortOrder).isDefault(isDefault).active(true).build());
        }
    }

    /**
     * Seeds ADMIN and EMPLOYEE roles with default RBAC permissions.
     * ADMIN gets full access, EMPLOYEE gets view + create on most features.
     */
    private void seedRolesAndPermissions(Organization org) {
        // Ensure ADMIN role exists
        Role adminRole = roleRepository.findByOrganizationIdAndCode(org.getId(), "ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .organization(org).code("ADMIN").name("Administrator")
                        .description("Full system access").systemDefined(true).active(true).build()));

        // Ensure EMPLOYEE role exists
        Role empRole = roleRepository.findByOrganizationIdAndCode(org.getId(), "EMPLOYEE")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .organization(org).code("EMPLOYEE").name("Employee")
                        .description("Standard employee access").systemDefined(true).active(true).build()));

        // Ensure MANAGER role exists
        Role mgrRole = roleRepository.findByOrganizationIdAndCode(org.getId(), "MANAGER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .organization(org).code("MANAGER").name("Manager")
                        .description("Team lead / manager access").systemDefined(true).active(true).build()));

        // --- Features ---
        String[] features = { "WORK_ITEM", "PROJECT", "SPRINT", "TIMESHEET", "LEAVE", "USER", "MASTER_DATA", "AUDIT",
                "NOTIFICATION", "HOLIDAY", "PERFORMANCE" };
        for (String fc : features) {
            featureRepository.findByCode(fc)
                    .orElseGet(() -> featureRepository.save(PermissionFeature.builder()
                            .code(fc).name(fc.replace("_", " ")).active(true).build()));
        }

        // --- Actions ---
        String[] actions = { "VIEW", "CREATE", "UPDATE", "DELETE", "ASSIGN", "APPROVE", "CLOSE", "CONFIGURE" };
        for (String ac : actions) {
            actionRepository.findByCode(ac)
                    .orElseGet(() -> actionRepository.save(PermissionAction.builder()
                            .code(ac).name(ac).active(true).build()));
        }

        // --- Grant ADMIN all permissions ---
        for (String fc : features) {
            for (String ac : actions) {
                grantPermission(adminRole, fc, ac, true);
            }
        }

        // --- Grant EMPLOYEE limited permissions ---
        String[] empFeatures = { "WORK_ITEM", "PROJECT", "SPRINT", "TIMESHEET", "LEAVE", "NOTIFICATION" };
        String[] empActions = { "VIEW", "CREATE", "UPDATE" };
        for (String fc : empFeatures) {
            for (String ac : empActions) {
                grantPermission(empRole, fc, ac, true);
            }
        }

        // --- Grant MANAGER permissions (employee + approve + assign + close) ---
        for (String fc : empFeatures) {
            for (String ac : new String[] { "VIEW", "CREATE", "UPDATE", "ASSIGN", "APPROVE", "CLOSE" }) {
                grantPermission(mgrRole, fc, ac, true);
            }
        }
        grantPermission(mgrRole, "USER", "VIEW", true);

        log.info("Roles and permissions seeded for org: {}", org.getId());
    }

    private void grantPermission(Role role, String featureCode, String actionCode, boolean allowed) {
        var feature = featureRepository.findByCode(featureCode);
        var action = actionRepository.findByCode(actionCode);
        if (feature.isEmpty() || action.isEmpty())
            return;

        boolean exists = rolePermissionRepository.existsByRoleIdAndFeatureIdAndActionId(
                role.getId(), feature.get().getId(), action.get().getId());
        if (!exists) {
            rolePermissionRepository.save(RolePermission.builder()
                    .role(role).feature(feature.get()).action(action.get())
                    .allowed(allowed).createdBy(0L).build());
        }
    }
}
