USE student_group_collaboration;

CREATE TABLE IF NOT EXISTS STUDENT_SESSION (
    session_id CHAR(64) PRIMARY KEY,
    student_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_session_expiry (student_id, expires_at),
    CONSTRAINT fk_student_session_student
        FOREIGN KEY (student_id)
        REFERENCES STUDENT(student_id)
        ON DELETE CASCADE
);
