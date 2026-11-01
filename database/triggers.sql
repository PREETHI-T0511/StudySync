USE student_group_collaboration;

DELIMITER //

CREATE TRIGGER check_task_assignment_hours
BEFORE INSERT ON TASK_ASSIGNMENT
FOR EACH ROW
BEGIN
    DECLARE total_hours DECIMAL(10,2);
    DECLARE estimated_hours DECIMAL(10,2);

    SELECT estimated_hrs
    INTO estimated_hours
    FROM TASK
    WHERE task_id = NEW.task_id;

    SELECT COALESCE(SUM(assigned_hours), 0)
    INTO total_hours
    FROM TASK_ASSIGNMENT
    WHERE task_id = NEW.task_id;

    IF total_hours + NEW.assigned_hours > estimated_hours THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Assigned hours exceed estimated task hours';
    END IF;
END//

DELIMITER ;
