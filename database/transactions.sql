USE student_group_collaboration;

-- COMMIT: mark a task and its assignments complete.
START TRANSACTION;

UPDATE TASK
SET status = 'Completed'
WHERE task_id = 1;

UPDATE TASK_ASSIGNMENT
SET assignment_status = 'Completed'
WHERE task_id = 1;

COMMIT;

-- ROLLBACK: this task update is discarded.
START TRANSACTION;

UPDATE TASK
SET status = 'In Progress'
WHERE task_id = 2;

ROLLBACK;

-- SAVEPOINT: revert the priority change, then commit the status change.
START TRANSACTION;

UPDATE TASK
SET status = 'In Progress'
WHERE task_id = 1;

SAVEPOINT task_update;

UPDATE TASK
SET priority = 'Low'
WHERE task_id = 1;

ROLLBACK TO task_update;

COMMIT;
