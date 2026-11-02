-- ============================================================
-- IDEMPOTENT MASTER DATA MIGRATION SCRIPT
-- Target: PostgreSQL 17 / Spring Boot Flyway
-- Ensures immutable codes, editable display names, and safe re-execution
-- ============================================================

BEGIN;

-- 1. Ensure unique constraint on master_type (code)
CREATE UNIQUE INDEX IF NOT EXISTS uq_master_type_code ON master_type (code);

-- 2. Ensure unique constraint on master_value (master_type_id, code)
CREATE UNIQUE INDEX IF NOT EXISTS uq_master_value_type_code ON master_value (master_type_id, code);

-- 3. Ensure unique constraint on permission_feature (code)
CREATE UNIQUE INDEX IF NOT EXISTS uq_permission_feature_code ON permission_feature (code);

-- 4. Ensure unique constraint on permission_action (code)
CREATE UNIQUE INDEX IF NOT EXISTS uq_permission_action_code ON permission_action (code);

-- 5. Insert Master Types (Idempotent)
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('WORK_ITEM_STATUS', 'Work Item Status', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('WORK_ITEM_TYPE', 'Work Item Type', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('PRIORITY', 'Priority', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('PROJECT_STATUS', 'Project Status', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('SPRINT_STATUS', 'Sprint Status', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('TIMESHEET_STATUS', 'Timesheet Status', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('TIMESHEET_ENTRY_TYPE', 'Timesheet Entry Type', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('LEAVE_TYPE', 'Leave Type', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('LEAVE_STATUS', 'Leave Status', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('NOTIFICATION_EVENT', 'Notification Event', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('ROLE', 'Role', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('LEAVE_REASON', 'Leave Reason', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('PROJECT_CATEGORY', 'Project Category', '', true, NOW()) ON CONFLICT (code) DO NOTHING;
INSERT INTO master_type (code, name, description, active, created_at) VALUES ('FEATURE_STATUS', 'feature status', 'Feature status', true, NOW()) ON CONFLICT (code) DO NOTHING;

-- 6. Insert Master Values (Idempotent: matches by type_id + code, preserves user edited display names)
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'OPEN', 'Open', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'FEATURE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CLOSED', 'Closed', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'FEATURE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'PENDING', 'Pending', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'FEATURE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'MEDICAL', 'Medical Issue', NULL, 1, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_REASON'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'VACATION', 'Vacation / Travel', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_REASON'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'FAMILY', 'Family Emergency', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_REASON'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'OTHER', 'Other', NULL, 4, true, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_REASON'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'APPLIED', 'Applied', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'APPROVED', 'Approved', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'REJECTED', 'Rejected', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CANCELLED', 'Cancelled', NULL, 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CL', 'Casual Leave', NULL, 1, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'SL', 'Sick Leave', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'PL', 'Privileged Leave', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'LEAVE_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TASK_ASSIGNED', 'Task Assigned', NULL, 1, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TASK_HANDOFF', 'Task Handoff', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TASK_CLOSED', 'Task Closed', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'SPRINT_STARTED', 'Sprint Started', NULL, 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'SPRINT_CLOSED', 'Sprint Closed', NULL, 5, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'SPILLOVER', 'Sprint Spillover', NULL, 6, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TIMESHEET_SUBMITTED', 'Timesheet Submitted', NULL, 7, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TIMESHEET_APPROVED', 'Timesheet Approved', NULL, 8, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'LEAVE_APPLIED', 'Leave Applied', NULL, 9, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'LEAVE_APPROVED', 'Leave Approved', NULL, 10, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'LEAVE_REJECTED', 'Leave Rejected', NULL, 11, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TIME_OFF_APPROVAL', 'Time Off Approval Required', NULL, 12, false, true, NOW()
FROM master_type mt WHERE mt.code = 'NOTIFICATION_EVENT'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'LOW', 'Low', NULL, 1, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PRIORITY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'MEDIUM', 'Medium', NULL, 2, true, true, NOW()
FROM master_type mt WHERE mt.code = 'PRIORITY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'HIGH', 'High', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PRIORITY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CRITICAL', 'Critical', NULL, 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PRIORITY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'INTERNAL', 'Internal Project', NULL, 1, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PROJECT_CATEGORY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CLIENT', 'Client Project', NULL, 2, true, true, NOW()
FROM master_type mt WHERE mt.code = 'PROJECT_CATEGORY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'RESEARCH', 'R&D', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PROJECT_CATEGORY'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'ACTIVE', 'Active', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'PROJECT_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'ON_HOLD', 'On Hold', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PROJECT_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CLOSED', 'Closed', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'PROJECT_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'ADMIN', 'Administrator', NULL, 1, false, true, NOW()
FROM master_type mt WHERE mt.code = 'ROLE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'MANAGER', 'Manager', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'ROLE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'EMPLOYEE', 'Employee', NULL, 3, true, true, NOW()
FROM master_type mt WHERE mt.code = 'ROLE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'HR', 'HR', 'HR', 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'ROLE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'PLANNED', 'Planned', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'SPRINT_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'ACTIVE', 'Active', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'SPRINT_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CLOSED', 'Closed', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'SPRINT_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'WORK', 'Work', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'TIMESHEET_ENTRY_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TIME_OFF', 'Time Off', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'TIMESHEET_ENTRY_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'DRAFT', 'Draft', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'TIMESHEET_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'SUBMITTED', 'Submitted', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'TIMESHEET_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'APPROVED', 'Approved', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'TIMESHEET_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'REJECTED', 'Rejected', NULL, 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'TIMESHEET_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'BACKLOG', 'Backlog', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'OPEN', 'Open', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'IN_PROGRESS', 'In Progress', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'DONE', 'Done', NULL, 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'IN_REVIEW', 'In Review', NULL, 4, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_STATUS'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TASK', 'Task', NULL, 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'BUG', 'Bug', NULL, 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'TEST_CASE', 'Test Case', NULL, 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'WORK_ITEM_TYPE'
ON CONFLICT (master_type_id, code) DO NOTHING;

-- 7. Insert Permission Features (Idempotent)
INSERT INTO permission_feature (code, name, description, active) VALUES ('WORK_ITEM', 'WORK ITEM', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('PROJECT', 'PROJECT', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('SPRINT', 'SPRINT', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('TIMESHEET', 'TIMESHEET', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('LEAVE', 'LEAVE', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('USER', 'USER', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('MASTER_DATA', 'MASTER DATA', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('AUDIT', 'AUDIT', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('NOTIFICATION', 'NOTIFICATION', NULL, true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_feature (code, name, description, active) VALUES ('FEATURE', 'FEATURE', 'Feature management', true) ON CONFLICT (code) DO NOTHING;

-- 8. Insert Permission Actions (Idempotent)
INSERT INTO permission_action (code, name, active) VALUES ('VIEW', 'VIEW', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('CREATE', 'CREATE', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('UPDATE', 'UPDATE', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('DELETE', 'DELETE', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('ASSIGN', 'ASSIGN', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('APPROVE', 'APPROVE', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('CLOSE', 'CLOSE', true) ON CONFLICT (code) DO NOTHING;
INSERT INTO permission_action (code, name, active) VALUES ('CONFIGURE', 'CONFIGURE', true) ON CONFLICT (code) DO NOTHING;

-- 9. Insert Default Roles for Organization 1 (Idempotent)
INSERT INTO role (organization_id, code, name, description, system_defined, active, created_at)
SELECT 1, 'ADMIN', 'Administrator', 'Full system access', true, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM role WHERE organization_id = 1 AND code = 'ADMIN');
INSERT INTO role (organization_id, code, name, description, system_defined, active, created_at)
SELECT 1, 'EMPLOYEE', 'Employee', 'Standard employee access', true, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM role WHERE organization_id = 1 AND code = 'EMPLOYEE');
INSERT INTO role (organization_id, code, name, description, system_defined, active, created_at)
SELECT 1, 'MANAGER', 'Manager', 'Team lead / manager access', true, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM role WHERE organization_id = 1 AND code = 'MANAGER');
INSERT INTO role (organization_id, code, name, description, system_defined, active, created_at)
SELECT 1, 'HR', 'HR', 'HR', false, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM role WHERE organization_id = 1 AND code = 'HR');
INSERT INTO role (organization_id, code, name, description, system_defined, active, created_at)
SELECT 1, 'TESTER', 'Tester', 'Tester', false, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM role WHERE organization_id = 1 AND code = 'TESTER');

COMMIT;
