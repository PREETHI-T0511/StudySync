USE student_group_collaboration;

DROP TRIGGER IF EXISTS check_task_assignment_hours;
DROP TRIGGER IF EXISTS check_task_assignment_hours_update;
DROP TRIGGER IF EXISTS check_task_project_estimate_insert;
DROP TRIGGER IF EXISTS check_task_project_estimate_update;
DROP TRIGGER IF EXISTS check_group_project_estimate_update;

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

CREATE TRIGGER check_task_assignment_hours_update
BEFORE UPDATE ON TASK_ASSIGNMENT
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
    WHERE task_id = NEW.task_id
      AND assignment_id <> OLD.assignment_id;

    IF total_hours + NEW.assigned_hours > estimated_hours THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Assigned hours exceed estimated task hours';
    END IF;
END//

CREATE TRIGGER check_task_project_estimate_insert
BEFORE INSERT ON TASK
FOR EACH ROW
BEGIN
    DECLARE project_hours DECIMAL(10,2);
    DECLARE planned_hours DECIMAL(10,2);

    SELECT project_estimated_hrs
    INTO project_hours
    FROM `GROUP`
    WHERE group_id = NEW.group_id;

    SELECT COALESCE(SUM(estimated_hrs), 0)
    INTO planned_hours
    FROM TASK
    WHERE group_id = NEW.group_id;

    IF planned_hours + NEW.estimated_hrs > project_hours THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Task estimates exceed the project estimate';
    END IF;
END//

CREATE TRIGGER check_task_project_estimate_update
BEFORE UPDATE ON TASK
FOR EACH ROW
BEGIN
    DECLARE project_hours DECIMAL(10,2);
    DECLARE planned_hours DECIMAL(10,2);

    SELECT project_estimated_hrs
    INTO project_hours
    FROM `GROUP`
    WHERE group_id = NEW.group_id;

    SELECT COALESCE(SUM(estimated_hrs), 0)
    INTO planned_hours
    FROM TASK
    WHERE group_id = NEW.group_id
      AND task_id <> OLD.task_id;

    IF planned_hours + NEW.estimated_hrs > project_hours THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Task estimates exceed the project estimate';
    END IF;
END//

CREATE TRIGGER check_group_project_estimate_update
BEFORE UPDATE ON `GROUP`
FOR EACH ROW
BEGIN
    DECLARE planned_hours DECIMAL(10,2);

    SELECT COALESCE(SUM(estimated_hrs), 0)
    INTO planned_hours
    FROM TASK
    WHERE group_id = OLD.group_id;

    IF NEW.project_estimated_hrs < planned_hours THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Project estimate is below planned task hours';
    END IF;
END//

DELIMITER ;
