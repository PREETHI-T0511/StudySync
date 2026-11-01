USE student_group_collaboration;

CREATE TABLE IF NOT EXISTS GROUP_INVITATION (
    invitation_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    invited_email VARCHAR(100) NOT NULL,
    invitation_token_hash CHAR(64) NOT NULL UNIQUE,
    invited_by INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, invited_email),
    FOREIGN KEY (group_id) REFERENCES `GROUP`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES STUDENT(student_id) ON DELETE CASCADE
);
