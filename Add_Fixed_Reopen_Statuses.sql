-- ============================================================
-- Migration: Add 'Fixed' and 'Reopen' task statuses
-- These statuses belong to status_code = 1 (Task statuses)
-- ============================================================

-- Existing task statuses (status_code = 1):
--   id  1 = In Progress
--   id  2 = Done
--   id  3 = To Do
--   id 12 = Backlog
--
-- Role-based visibility (enforced in the frontend):
--   Developer      -> Backlog, To Do, In Progress, Fixed
--   Admin / Tester -> Backlog, To Do, In Progress, Fixed, Reopen, Done

INSERT INTO status (id, decription, sequence, status_code)
VALUES
  (14, 'Fixed',  4, 1),
  (15, 'Reopen', 5, 1);

-- Verify
-- SELECT * FROM status WHERE status_code = 1 ORDER BY id;
