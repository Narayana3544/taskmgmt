-- ============================================================
-- FEATURE MODULE MIGRATION
-- Adds Feature layer: Project → Feature → Sprint → WorkItem
-- ============================================================

-- 1. Create sequence for feature IDs
CREATE SEQUENCE IF NOT EXISTS feature_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    CACHE 1;

-- 2. Create feature table (exact DDL as specified)
CREATE TABLE IF NOT EXISTS feature (
    id integer NOT NULL DEFAULT nextval('feature_id_seq'),
    name character varying(255) COLLATE pg_catalog."default",
    project_id integer NOT NULL,
    description character varying(255) COLLATE pg_catalog."default",
    status_id integer,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    active boolean NOT NULL DEFAULT true,
    CONSTRAINT feature_pkey PRIMARY KEY (id),
    CONSTRAINT fk5klk2ih7ytb7n4t8myt6msi74 FOREIGN KEY (project_id)
        REFERENCES public.project (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk8av0fvmje5k2diflmoc0vy5h3 FOREIGN KEY (status_id)
        REFERENCES public.status (id) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- 3. Index on feature.project_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_project ON feature (project_id);

-- 4. Insert FEATURE_STATUS master type (if not exists)
INSERT INTO master_type (code, name, description, active, created_at)
SELECT 'FEATURE_STATUS', 'Feature Status', 'Status values for features', true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM master_type WHERE code = 'FEATURE_STATUS');

-- 5. Insert FEATURE_STATUS master values
INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'PROPOSED', 'Proposed', 'Feature has been proposed', 1, true, true, NOW()
FROM master_type mt WHERE mt.code = 'FEATURE_STATUS'
AND NOT EXISTS (SELECT 1 FROM master_value mv WHERE mv.master_type_id = mt.id AND mv.code = 'PROPOSED');

INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'ACTIVE', 'Active', 'Feature is actively being worked on', 2, false, true, NOW()
FROM master_type mt WHERE mt.code = 'FEATURE_STATUS'
AND NOT EXISTS (SELECT 1 FROM master_value mv WHERE mv.master_type_id = mt.id AND mv.code = 'ACTIVE');

INSERT INTO master_value (master_type_id, code, display_name, description, sort_order, is_default, active, created_at)
SELECT mt.id, 'CLOSED', 'Closed', 'Feature is completed/closed', 3, false, true, NOW()
FROM master_type mt WHERE mt.code = 'FEATURE_STATUS'
AND NOT EXISTS (SELECT 1 FROM master_value mv WHERE mv.master_type_id = mt.id AND mv.code = 'CLOSED');

-- 6. Insert FEATURE permission feature (RBAC)
INSERT INTO permission_feature (code, name, created_at)
SELECT 'FEATURE', 'Feature Management', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission_feature WHERE code = 'FEATURE');

-- 7. Insert permission actions for FEATURE (if not already present globally)
-- CREATE, VIEW, UPDATE actions should already exist from other features, but ensure they do
INSERT INTO permission_action (code, name, created_at)
SELECT 'CREATE', 'Create', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission_action WHERE code = 'CREATE');

INSERT INTO permission_action (code, name, created_at)
SELECT 'VIEW', 'View', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission_action WHERE code = 'VIEW');

INSERT INTO permission_action (code, name, created_at)
SELECT 'UPDATE', 'Update', NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission_action WHERE code = 'UPDATE');

-- 8. Grant FEATURE permissions to ADMIN and MANAGER roles
-- ADMIN gets all FEATURE permissions
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 0, NOW()
FROM role r, permission_feature pf, permission_action pa
WHERE r.code = 'ADMIN' AND pf.code = 'FEATURE' AND pa.code IN ('CREATE', 'VIEW', 'UPDATE')
AND NOT EXISTS (
    SELECT 1 FROM role_permission rp
    WHERE rp.role_id = r.id AND rp.feature_id = pf.id AND rp.action_id = pa.id
);

-- MANAGER gets all FEATURE permissions
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 0, NOW()
FROM role r, permission_feature pf, permission_action pa
WHERE r.code = 'MANAGER' AND pf.code = 'FEATURE' AND pa.code IN ('CREATE', 'VIEW', 'UPDATE')
AND NOT EXISTS (
    SELECT 1 FROM role_permission rp
    WHERE rp.role_id = r.id AND rp.feature_id = pf.id AND rp.action_id = pa.id
);

-- DEVELOPER gets VIEW only
INSERT INTO role_permission (role_id, feature_id, action_id, allowed, created_by, created_at)
SELECT r.id, pf.id, pa.id, true, 0, NOW()
FROM role r, permission_feature pf, permission_action pa
WHERE r.code = 'DEVELOPER' AND pf.code = 'FEATURE' AND pa.code = 'VIEW'
AND NOT EXISTS (
    SELECT 1 FROM role_permission rp
    WHERE rp.role_id = r.id AND rp.feature_id = pf.id AND rp.action_id = pa.id
);

-- 9. Create placeholder "Legacy" features for existing projects (for sprint backfill)
INSERT INTO feature (name, project_id, description, status_id, created_by, created_at, active)
SELECT
    'Legacy',
    p.id,
    'Auto-created placeholder for pre-existing sprints',
    (SELECT mv.id FROM master_value mv JOIN master_type mt ON mv.master_type_id = mt.id
     WHERE mt.code = 'FEATURE_STATUS' AND mv.code = 'ACTIVE' LIMIT 1),
    0,
    NOW(),
    true
FROM project p
WHERE NOT EXISTS (
    SELECT 1 FROM feature f WHERE f.project_id = p.id AND f.name = 'Legacy'
);

-- 10. Add feature_id column to sprint table (nullable first for backfill)
ALTER TABLE sprint ADD COLUMN IF NOT EXISTS feature_id integer;

-- 11. Backfill existing sprints with their project's Legacy feature
UPDATE sprint s
SET feature_id = (
    SELECT f.id FROM feature f
    WHERE f.project_id = s.project_id AND f.name = 'Legacy'
    LIMIT 1
)
WHERE s.feature_id IS NULL;

-- 12. Set NOT NULL constraint on feature_id
ALTER TABLE sprint ALTER COLUMN feature_id SET NOT NULL;

-- 13. Add FK constraint for sprint.feature_id → feature.id
ALTER TABLE sprint
ADD CONSTRAINT fk_sprint_feature FOREIGN KEY (feature_id)
    REFERENCES public.feature (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE NO ACTION;

-- 14. Index on sprint.feature_id
CREATE INDEX IF NOT EXISTS idx_sprint_feature ON sprint (feature_id);
