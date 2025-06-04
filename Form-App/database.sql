CREATE SCHEMA IF NOT EXISTS FormsSystem;

-- Departments table holds the list of departments
CREATE TABLE FormsSystem.Departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Department budgets for each fiscal year
CREATE TABLE FormsSystem.DepartmentBudgets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    department_id INT NOT NULL,
    fiscal_year INT NOT NULL,
    budget_amount DECIMAL(18,2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (department_id) REFERENCES FormsSystem.Departments(id)
);

-- Users table
CREATE TABLE FormsSystem.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    department_id INT NULL,
    role NVARCHAR(50) DEFAULT 'user',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (department_id) REFERENCES FormsSystem.Departments(id)
);

-- Password reset tokens
CREATE TABLE FormsSystem.PasswordResets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token NVARCHAR(500) NOT NULL,
    expiry DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES FormsSystem.Users(id)
);

-- Forms table stores all kinds of forms
CREATE TABLE FormsSystem.Forms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_name NVARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    department_id INT NULL,
    total_amount DECIMAL(18,2) DEFAULT 0,
    details NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'Draft',
    request_date DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES FormsSystem.Users(id),
    FOREIGN KEY (department_id) REFERENCES FormsSystem.Departments(id)
);

-- Useful indexes
CREATE INDEX idx_users_email ON FormsSystem.Users(email);
CREATE INDEX idx_password_resets_token ON FormsSystem.PasswordResets(reset_token);
CREATE INDEX idx_password_resets_user ON FormsSystem.PasswordResets(user_id);
CREATE INDEX idx_forms_user ON FormsSystem.Forms(user_id);
CREATE INDEX idx_forms_status ON FormsSystem.Forms(status);
CREATE INDEX idx_forms_department ON FormsSystem.Forms(department_id);
CREATE INDEX idx_department_budget_year ON FormsSystem.DepartmentBudgets(department_id, fiscal_year);
