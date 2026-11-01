USE student_group_collaboration;

-- List each group's members.
SELECT
    g.group_id,
    g.group_name,
    s.student_id,
    s.student_name,
    gm.role,
    gm.joined_date
FROM `GROUP` AS g
JOIN GROUP_MEMBER AS gm ON gm.group_id = g.group_id
JOIN STUDENT AS s ON s.student_id = gm.student_id
ORDER BY g.group_name, s.student_name;

-- Show pending and in-progress tasks with their assignments.
SELECT
    t.task_id,
    t.task_title,
    t.priority,
    t.deadline,
    t.status,
    s.student_name AS assigned_student,
    ta.assigned_hours,
    ta.assignment_status
FROM TASK AS t
LEFT JOIN TASK_ASSIGNMENT AS ta ON ta.task_id = t.task_id
LEFT JOIN STUDENT AS s ON s.student_id = ta.student_id
WHERE t.status <> 'Completed'
ORDER BY t.deadline, t.priority DESC;

-- Summarize estimated and assigned hours for each task.
SELECT
    t.task_id,
    t.task_title,
    t.estimated_hrs,
    COALESCE(SUM(ta.assigned_hours), 0) AS total_assigned_hours
FROM TASK AS t
LEFT JOIN TASK_ASSIGNMENT AS ta ON ta.task_id = t.task_id
GROUP BY t.task_id, t.task_title, t.estimated_hrs
ORDER BY t.task_id;

-- List upcoming meetings and participant attendance.
SELECT
    m.meeting_id,
    g.group_name,
    m.meeting_title,
    m.meeting_date,
    m.start_time,
    m.end_time,
    s.student_name,
    mp.attendance_status
FROM MEETING AS m
JOIN `GROUP` AS g ON g.group_id = m.group_id
LEFT JOIN MEETING_PARTICIPANT AS mp ON mp.meeting_id = m.meeting_id
LEFT JOIN STUDENT AS s ON s.student_id = mp.student_id
WHERE m.meeting_date >= CURRENT_DATE
ORDER BY m.meeting_date, m.start_time;

-- Find overlapping availability for students in the same group.
SELECT
    g.group_name,
    a1.available_date,
    a1.student_id AS first_student_id,
    a2.student_id AS second_student_id,
    GREATEST(a1.start_time, a2.start_time) AS overlap_start,
    LEAST(a1.end_time, a2.end_time) AS overlap_end
FROM GROUP_MEMBER AS gm1
JOIN GROUP_MEMBER AS gm2
    ON gm2.group_id = gm1.group_id
   AND gm2.student_id > gm1.student_id
JOIN AVAILABILITY AS a1
    ON a1.student_id = gm1.student_id
JOIN AVAILABILITY AS a2
    ON a2.student_id = gm2.student_id
   AND a2.available_date = a1.available_date
   AND a1.start_time < a2.end_time
   AND a2.start_time < a1.end_time
JOIN `GROUP` AS g ON g.group_id = gm1.group_id
ORDER BY g.group_name, a1.available_date, overlap_start;
