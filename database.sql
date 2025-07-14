-- NWFTH Forms Database Schema
-- Updated for SQL Server compatibility

-- Create schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'FormsSystem')
BEGIN
    EXEC('CREATE SCHEMA FormsSystem')
END
GO

-- Departments table - holds the list of departments
CREATE TABLE FormsSystem.Departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    budget_amount DECIMAL(18,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Department budgets for each fiscal year
CREATE TABLE FormsSystem.DepartmentBudgets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    department_id INT NOT NULL,
    fiscal_year INT NOT NULL,
    budget_amount DECIMAL(18,2) NOT NULL,
    spent_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount AS (budget_amount - spent_amount),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (department_id) REFERENCES FormsSystem.Departments(id)
);
GO

-- Users table - supports both local and Active Directory authentication
CREATE TABLE FormsSystem.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NULL, -- NULL for AD users
    name NVARCHAR(255) NOT NULL,
    department NVARCHAR(255) NULL, -- String-based department name
    role NVARCHAR(50) DEFAULT 'user',
    is_domain_user BIT DEFAULT 0, -- TRUE for Active Directory users
    is_active BIT DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Password reset tokens for local users
CREATE TABLE FormsSystem.PasswordResets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token NVARCHAR(500) NOT NULL,
    expiry DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES FormsSystem.Users(id)
);
GO

-- Forms table - stores all types of forms (Purchase, CAPEX, Travel, Minor, Major)
CREATE TABLE FormsSystem.Forms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_name NVARCHAR(255) NOT NULL,
    form_type NVARCHAR(100) NOT NULL, -- 'purchase', 'capex', 'travel', 'minor', 'major'
    user_name NVARCHAR(255) NOT NULL, -- String-based user name (from AD or local)
    department NVARCHAR(255) NULL, -- String-based department name
    total_amount DECIMAL(18,2) DEFAULT 0,
    details NVARCHAR(MAX), -- JSON or text details of the form
    status NVARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Waiting For Approve', 'Approved', 'Rejected'
    priority NVARCHAR(20) DEFAULT 'Normal', -- 'Low', 'Normal', 'High', 'Urgent'
    request_date DATETIME DEFAULT GETDATE(),
    approved_by NVARCHAR(255) NULL,
    approved_date DATETIME NULL,
    rejected_by NVARCHAR(255) NULL,
    rejected_date DATETIME NULL,
    rejection_reason NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Form attachments table
CREATE TABLE FormsSystem.FormAttachments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type NVARCHAR(100) NOT NULL,
    uploaded_by NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (form_id) REFERENCES FormsSystem.Forms(id) ON DELETE CASCADE
);
GO

-- Form workflow/approval history
CREATE TABLE FormsSystem.FormWorkflow (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_id INT NOT NULL,
    action NVARCHAR(100) NOT NULL, -- 'submitted', 'approved', 'rejected', 'modified'
    performed_by NVARCHAR(255) NOT NULL,
    comments NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (form_id) REFERENCES FormsSystem.Forms(id) ON DELETE CASCADE
);
GO

-- Audit log for tracking changes
CREATE TABLE FormsSystem.AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    table_name NVARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action NVARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    changed_by NVARCHAR(255) NOT NULL,
    old_values NVARCHAR(MAX) NULL,
    new_values NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- System settings table
CREATE TABLE FormsSystem.SystemSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    setting_key NVARCHAR(255) NOT NULL UNIQUE,
    setting_value NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(500) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Performance indexes
CREATE INDEX idx_users_email ON FormsSystem.Users(email);
CREATE INDEX idx_users_department ON FormsSystem.Users(department);
CREATE INDEX idx_users_is_active ON FormsSystem.Users(is_active);
CREATE INDEX idx_password_resets_token ON FormsSystem.PasswordResets(reset_token);
CREATE INDEX idx_password_resets_user ON FormsSystem.PasswordResets(user_id);
CREATE INDEX idx_forms_user_name ON FormsSystem.Forms(user_name);
CREATE INDEX idx_forms_department ON FormsSystem.Forms(department);
CREATE INDEX idx_forms_status ON FormsSystem.Forms(status);
CREATE INDEX idx_forms_type ON FormsSystem.Forms(form_type);
CREATE INDEX idx_forms_request_date ON FormsSystem.Forms(request_date);
CREATE INDEX idx_forms_status_type ON FormsSystem.Forms(status, form_type);
CREATE INDEX idx_form_attachments_form_id ON FormsSystem.FormAttachments(form_id);
CREATE INDEX idx_form_workflow_form_id ON FormsSystem.FormWorkflow(form_id);
CREATE INDEX idx_department_budget_year ON FormsSystem.DepartmentBudgets(department_id, fiscal_year);
CREATE INDEX idx_audit_log_table_record ON FormsSystem.AuditLog(table_name, record_id);
GO

-- Insert default departments
INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES 
('IT Department', 500000.00),
('HR Department', 200000.00),
('Finance Department', 300000.00),
('Operations Department', 400000.00),
('Marketing Department', 250000.00),
('Research & Development', 600000.00),
('Legal Department', 150000.00),
('Facilities Management', 350000.00);
GO

-- Insert default system settings
INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES 
('system_name', 'NWFTH Forms Management System', 'System display name'),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif', 'Allowed file types for attachments'),
('default_currency', 'USD', 'Default currency for amounts'),
('email_notifications', 'true', 'Enable email notifications'),
('auto_approve_threshold', '1000.00', 'Auto-approve forms below this amount'),
('fiscal_year_start', '01-01', 'Fiscal year start date (MM-DD)'),
('backup_retention_days', '90', 'Number of days to retain backups');
GO

-- Insert default fiscal year budgets (current year)
DECLARE @current_year INT = YEAR(GETDATE());
INSERT INTO FormsSystem.DepartmentBudgets (department_id, fiscal_year, budget_amount)
SELECT id, @current_year, budget_amount 
FROM FormsSystem.Departments;
GO

-- Create view for active users
CREATE VIEW FormsSystem.ActiveUsers AS
SELECT u.id, u.email, u.name, u.department, u.role, u.is_domain_user, u.last_login
FROM FormsSystem.Users u
WHERE u.is_active = 1;
GO

-- Create view for pending forms
CREATE VIEW FormsSystem.PendingForms AS
SELECT f.id, f.form_name, f.form_type, f.user_name, f.department, f.total_amount, f.request_date, f.priority
FROM FormsSystem.Forms f
WHERE f.status IN ('Submitted', 'Waiting For Approve');
GO

-- Create view for department budget summary
CREATE VIEW FormsSystem.DepartmentBudgetSummary AS
SELECT 
    d.name AS department_name,
    db.fiscal_year,
    db.budget_amount,
    ISNULL(SUM(f.total_amount), 0) AS spent_amount,
    db.budget_amount - ISNULL(SUM(f.total_amount), 0) AS remaining_amount
FROM FormsSystem.Departments d
LEFT JOIN FormsSystem.DepartmentBudgets db ON d.id = db.department_id
LEFT JOIN FormsSystem.Forms f ON d.name = f.department AND f.status = 'Approved'
GROUP BY d.name, db.fiscal_year, db.budget_amount;
GO

-- Create audit trigger for Forms table
CREATE TRIGGER tr_Forms_Audit
ON FormsSystem.Forms
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        -- UPDATE
        INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, old_values, new_values)
        SELECT 'Forms', i.id, 'UPDATE', SYSTEM_USER, 
               (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO),
               (SELECT * FROM inserted i2 WHERE i2.id = i.id FOR JSON AUTO)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT * FROM inserted)
    BEGIN
        -- INSERT
        INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, new_values)
        SELECT 'Forms', i.id, 'INSERT', SYSTEM_USER, 
               (SELECT * FROM inserted i2 WHERE i2.id = i.id FOR JSON AUTO)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT * FROM deleted)
    BEGIN
        -- DELETE
        INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, old_values)
        SELECT 'Forms', d.id, 'DELETE', SYSTEM_USER, 
               (SELECT * FROM deleted d2 WHERE d2.id = d.id FOR JSON AUTO)
        FROM deleted d;
    END
END;
GO

-- Grant permissions (uncomment and adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::FormsSystem TO [your_app_user];
-- GRANT EXECUTE ON SCHEMA::FormsSystem TO [your_app_user];
GO

-- Database schema documentation
-- This database schema supports:
-- 1. Multi-type form management (Purchase, CAPEX, Travel, Minor, Major)
-- 2. Active Directory and local user authentication
-- 3. Department-based organization with budget tracking
-- 4. File attachment management
-- 5. Workflow and approval tracking
-- 6. Comprehensive audit logging
-- 7. System configuration management
-- 8. Performance optimized with proper indexing

PRINT 'NWFTH Forms Database Schema created successfully!';
GO