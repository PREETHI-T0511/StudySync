USE student_group_collaboration;

CREATE OR REPLACE VIEW task_group_details AS
SELECT
    TASK.task_id,
    TASK.task_title,
    TASK.deadline,
    TASK.priority,
    TASK.status,
    `GROUP`.group_id,
    `GROUP`.group_name
FROM TASK
INNER JOIN `GROUP`
    ON TASK.group_id = `GROUP`.group_id;

CREATE OR REPLACE VIEW v_group_overview AS
SELECT
    g.group_id,
    g.group_name,
    g.description AS group_description,
    g.created_by,
    g.created_date,
    g.project_estimated_hrs,
    COALESCE(member_counts.member_count, 0) AS member_count,
    COALESCE(task_counts.task_count, 0) AS task_count,
    COALESCE(task_counts.completed_task_count, 0) AS completed_task_count
FROM `GROUP` AS g
LEFT JOIN (
    SELECT group_id, COUNT(*) AS member_count
    FROM GROUP_MEMBER
    GROUP BY group_id
) AS member_counts ON member_counts.group_id = g.group_id
LEFT JOIN (
    SELECT
        group_id,
        COUNT(*) AS task_count,
        SUM(status = 'Completed') AS completed_task_count
    FROM TASK
    GROUP BY group_id
) AS task_counts ON task_counts.group_id = g.group_id;
