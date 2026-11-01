USE student_group_collaboration;

CREATE INDEX idx_task_group
    ON TASK (group_id);

CREATE INDEX idx_task_deadline
    ON TASK (deadline);

CREATE INDEX idx_meeting_group_date
    ON MEETING (group_id, meeting_date);
