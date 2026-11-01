-- ============================================================
-- WORK ITEM ASSIGNMENT & RBAC MIGRATION
-- Ensures TESTER and employee roles have WORK_ITEM VIEW, CREATE, UPDATE
-- so RBAC permission checks succeed alongside domain ownership rules.
-- ============================================================

INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_at, created_by)
SELECT r.id, f.id, a.id, true, NOW(), 1
FROM role r
CROSS JOIN permission_feature f
CROSS JOIN permission_action a
WHERE f.code = 'WORK_ITEM'
  AND a.code IN ('VIEW', 'CREATE', 'UPDATE')
  AND r.code IN ('TESTER', 'EMPLOYEE', 'DEVELOPER', 'QA')
  AND NOT EXISTS (
      SELECT 1 FROM role_permission rp 
      WHERE rp.role_id = r.id AND rp.feature_id = f.id AND rp.action_id = a.id
  );

