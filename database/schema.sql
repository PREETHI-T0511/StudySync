CREATE DATABASE IF NOT EXISTS student_group_collaboration;

USE student_group_collaboration;

CREATE TABLE STUDENT (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    semester INT,
    cgpa DECIMAL(3,2),
    CONSTRAINT chk_cgpa CHECK (cgpa BETWEEN 0 AND 10)
);

CREATE TABLE `GROUP` (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_date DATE NOT NULL,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES STUDENT(student_id)
);

CREATE TABLE GROUP_MEMBER (
    group_id INT,
    student_id INT,
    role VARCHAR(30) DEFAULT 'Member',
    joined_date DATE,
    PRIMARY KEY (group_id, student_id),
    FOREIGN KEY (group_id) REFERENCES `GROUP`(group_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
);

CREATE TABLE AVAILABILITY (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    CONSTRAINT chk_availability_time CHECK (end_time > start_time)
);

CREATE TABLE TASK (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    task_title VARCHAR(150) NOT NULL,
    task_description TEXT,
    deadline DATE,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(30) DEFAULT 'Pending',
    estimated_hrs DECIMAL(5,2),
    FOREIGN KEY (group_id) REFERENCES `GROUP`(group_id),
    CONSTRAINT chk_estimated_hrs CHECK (estimated_hrs > 0),
    CONSTRAINT chk_priority CHECK (priority IN ('Low', 'Medium', 'High')),
    CONSTRAINT chk_task_status CHECK (
        status IN ('Pending', 'In Progress', 'Completed')
    )
);

CREATE TABLE MEETING (
    meeting_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    meeting_title VARCHAR(150) NOT NULL,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_location VARCHAR(150),
    FOREIGN KEY (group_id) REFERENCES `GROUP`(group_id),
    CONSTRAINT chk_meeting_time CHECK (end_time > start_time)
);

CREATE TABLE MEETING_AGENDA (
    agenda_id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    agenda_title VARCHAR(150) NOT NULL,
    agenda_description TEXT,
    FOREIGN KEY (meeting_id) REFERENCES MEETING(meeting_id)
);

CREATE TABLE MEETING_PARTICIPANT (
    meeting_id INT,
    student_id INT,
    attendance_status VARCHAR(30) DEFAULT 'Invited',
    PRIMARY KEY (meeting_id, student_id),
    FOREIGN KEY (meeting_id) REFERENCES MEETING(meeting_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
);

CREATE TABLE TASK_ASSIGNMENT (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_date DATE,
    assigned_hours DECIMAL(5,2),
    assignment_status VARCHAR(30) DEFAULT 'Assigned',
    FOREIGN KEY (task_id) REFERENCES TASK(task_id),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    CONSTRAINT chk_assigned_hours CHECK (assigned_hours > 0)
);
