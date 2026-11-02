-- ============================================================
-- IDEMPOTENT ROLE PERMISSIONS MIGRATION SCRIPT
-- Target: PostgreSQL 17 / Spring Boot Flyway
-- Ensures all roles receive proper RBAC permissions across all features
-- ============================================================

BEGIN;

-- 1. Ensure unique constraint on role_permission (role_id, feature_id, action_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_permission_role_feature_action 
ON role_permission (role_id, feature_id, action_id);

-- 2. Ensure master_type has organization_id set
UPDATE master_type SET organization_id = 1 WHERE organization_id IS NULL;

-- 3. ADMIN: Grant all actions on all active features
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 1, NOW()
FROM role r
CROSS JOIN permission_feature pf
CROSS JOIN permission_action pa
WHERE r.code = 'ADMIN' AND pf.active = true
ON CONFLICT (role_id, feature_id, action_id) DO UPDATE SET allowed = true;

-- 4. MANAGER: Grant management actions on standard features
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 1, NOW()
FROM role r
CROSS JOIN permission_feature pf
CROSS JOIN permission_action pa
WHERE r.code = 'MANAGER'
  AND pf.code IN ('WORK_ITEM', 'PROJECT', 'SPRINT', 'TIMESHEET', 'LEAVE', 'NOTIFICATION', 'FEATURE')
  AND pa.code IN ('VIEW', 'CREATE', 'UPDATE', 'ASSIGN', 'APPROVE', 'CLOSE')
ON CONFLICT (role_id, feature_id, action_id) DO UPDATE SET allowed = true;

-- Manager also gets USER VIEW
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 1, NOW()
FROM role r
CROSS JOIN permission_feature pf
CROSS JOIN permission_action pa
WHERE r.code = 'MANAGER' AND pf.code = 'USER' AND pa.code = 'VIEW'
ON CONFLICT (role_id, feature_id, action_id) DO UPDATE SET allowed = true;

-- 5. EMPLOYEE: Grant standard actions
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 1, NOW()
FROM role r
CROSS JOIN permission_feature pf
CROSS JOIN permission_action pa
WHERE r.code = 'EMPLOYEE'
  AND pf.code IN ('WORK_ITEM', 'PROJECT', 'SPRINT', 'TIMESHEET', 'LEAVE', 'NOTIFICATION', 'FEATURE')
  AND pa.code IN ('VIEW', 'CREATE', 'UPDATE')
ON CONFLICT (role_id, feature_id, action_id) DO UPDATE SET allowed = true;

-- 6. TESTER: Grant work item and feature actions (including ASSIGN per Round 2/3 fix)
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 1, NOW()
FROM role r
CROSS JOIN permission_feature pf
CROSS JOIN permission_action pa
WHERE r.code = 'TESTER'
  AND ((pf.code = 'WORK_ITEM' AND pa.code IN ('VIEW', 'CREATE', 'UPDATE', 'ASSIGN'))
       OR (pf.code = 'FEATURE' AND pa.code = 'VIEW'))
ON CONFLICT (role_id, feature_id, action_id) DO UPDATE SET allowed = true;

-- 7. HR: Grant leave, user, and notification view/approve actions
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 1, NOW()
FROM role r
CROSS JOIN permission_feature pf
CROSS JOIN permission_action pa
WHERE r.code = 'HR'
  AND ((pf.code = 'LEAVE' AND pa.code IN ('VIEW', 'CREATE', 'UPDATE', 'APPROVE'))
       OR (pf.code = 'USER' AND pa.code IN ('VIEW', 'CREATE', 'UPDATE'))
       OR (pf.code = 'NOTIFICATION' AND pa.code IN ('VIEW', 'CREATE'))
       OR (pf.code = 'FEATURE' AND pa.code = 'VIEW'))
ON CONFLICT (role_id, feature_id, action_id) DO UPDATE SET allowed = true;

COMMIT;
