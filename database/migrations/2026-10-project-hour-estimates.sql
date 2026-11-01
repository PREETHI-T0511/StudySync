USE student_group_collaboration;

-- Run once on databases created before project and task hour estimates were added.
ALTER TABLE `GROUP`
    ADD COLUMN project_estimated_hrs DECIMAL(8,2) NULL;

UPDATE TASK
SET estimated_hrs = 1
WHERE estimated_hrs IS NULL OR estimated_hrs <= 0;

UPDATE `GROUP` AS g
LEFT JOIN (
    SELECT group_id, SUM(estimated_hrs) AS planned_hours
    FROM TASK
    GROUP BY group_id
) AS task_totals ON task_totals.group_id = g.group_id
SET g.project_estimated_hrs = GREATEST(COALESCE(task_totals.planned_hours, 0), 1);

ALTER TABLE TASK
    MODIFY estimated_hrs DECIMAL(8,2) NOT NULL;

ALTER TABLE `GROUP`
    MODIFY project_estimated_hrs DECIMAL(8,2) NOT NULL,
    ADD CONSTRAINT chk_project_estimated_hrs CHECK (project_estimated_hrs > 0);
