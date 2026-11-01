USE student_group_collaboration;

DELIMITER //

CREATE PROCEDURE GetGroupTasks(IN gid INT)
BEGIN
    SELECT
        task_id,
        task_title,
        task_description,
        deadline,
        priority,
        status,
        estimated_hrs
    FROM TASK
    WHERE group_id = gid;
END//

DELIMITER ;
