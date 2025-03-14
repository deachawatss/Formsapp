-- สร้างตาราง Users
CREATE TABLE FormsSystem.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    department NVARCHAR(255),
    role NVARCHAR(50) DEFAULT 'user',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- สร้างตาราง PasswordResets
CREATE TABLE FormsSystem.PasswordResets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token NVARCHAR(500) NOT NULL,
    expiry DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES FormsSystem.Users(id)
);

-- สร้างตาราง Forms
CREATE TABLE FormsSystem.Forms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_name NVARCHAR(255) NOT NULL,
    user_name NVARCHAR(255) NOT NULL,
    department NVARCHAR(255),
    details NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'Draft',
    request_date DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- สร้าง index สำหรับการค้นหา
CREATE INDEX idx_users_email ON FormsSystem.Users(email);
CREATE INDEX idx_password_resets_token ON FormsSystem.PasswordResets(reset_token);
CREATE INDEX idx_password_resets_user ON FormsSystem.PasswordResets(user_id);
CREATE INDEX idx_forms_user ON FormsSystem.Forms(user_name);
CREATE INDEX idx_forms_status ON FormsSystem.Forms(status); 