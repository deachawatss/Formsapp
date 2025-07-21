-- NWFTH Forms Database Schema
-- Updated for SQL Server compatibility

-- Create schema if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'FormsSystem')
BEGIN
    EXEC('CREATE SCHEMA FormsSystem')
END
GO

-- ===== DATABASE MIGRATION SECTION =====
-- Handle existing database updates for custom form names

-- Check if Forms table exists and perform migrations
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Forms' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    PRINT 'Migrating existing Forms table...'
    
    -- Add custom_name column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'custom_name')
    BEGIN
        ALTER TABLE FormsSystem.Forms ADD custom_name NVARCHAR(255) NULL
        PRINT 'Added custom_name column'
    END
    
    -- Add form_category column if it doesn't exist  
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'form_category')
    BEGIN
        ALTER TABLE FormsSystem.Forms ADD form_category NVARCHAR(100) NULL
        PRINT 'Added form_category column'
    END
    
    -- Rename form_name to form_type if form_name exists and form_type doesn't
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'form_name')
       AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'form_type')
    BEGIN
        EXEC sp_rename 'FormsSystem.Forms.form_name', 'form_type', 'COLUMN'
        PRINT 'Renamed form_name to form_type'
    END
    
    -- Update form_category data based on existing form_type values
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'form_category')
    BEGIN
        EXEC('UPDATE FormsSystem.Forms 
        SET form_category = CASE 
            WHEN form_type LIKE ''%Purchase%'' THEN ''purchase''
            WHEN form_type LIKE ''%Travel%'' THEN ''travel''
            WHEN form_type LIKE ''%CAPEX%'' THEN ''capex''
            WHEN form_type LIKE ''%Major%'' THEN ''major''
            WHEN form_type LIKE ''%Minor%'' THEN ''minor''
            ELSE ''other''
        END');
        PRINT 'Updated form_category data'
    END
    
    PRINT 'Forms table migration completed'
END
GO

-- Drop and recreate views that reference the updated columns
IF EXISTS (SELECT * FROM sys.views WHERE name = 'PendingForms' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    DROP VIEW FormsSystem.PendingForms
    PRINT 'Dropped existing PendingForms view'
END
GO

-- ===== POST-MIGRATION OPERATIONS =====
-- Create indexes and views for newly added columns

-- Create indexes for new columns (only if they exist)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'form_category')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_category')
        CREATE INDEX idx_forms_category ON FormsSystem.Forms(form_category);
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_status_category')
        CREATE INDEX idx_forms_status_category ON FormsSystem.Forms(status, form_category);
    PRINT 'Created form_category indexes'
END

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'custom_name')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_custom_name')
        CREATE INDEX idx_forms_custom_name ON FormsSystem.Forms(custom_name);
    PRINT 'Created custom_name index'
END

-- Recreate PendingForms view with new columns (only if Forms table has new columns)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'custom_name')
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('FormsSystem.Forms') AND name = 'form_category')
BEGIN
    -- Create the PendingForms view with new structure using dynamic SQL
    EXEC('CREATE VIEW FormsSystem.PendingForms AS
    SELECT f.id, f.form_type, f.custom_name, f.form_category, f.user_name, f.department, f.total_amount, f.request_date, f.priority
    FROM FormsSystem.Forms f
    WHERE f.status IN (''Submitted'', ''Waiting For Approve'')')
    PRINT 'Created PendingForms view with new columns'
END
GO

-- ===== END POST-MIGRATION OPERATIONS =====

-- Departments table - holds the list of departments
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    CREATE TABLE FormsSystem.Departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL UNIQUE,
        budget_amount DECIMAL(18,2) DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Departments table'
END
GO

-- Department budgets for each fiscal year
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DepartmentBudgets' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
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
    PRINT 'Created DepartmentBudgets table'
END
GO

-- Users table - supports both local and Active Directory authentication
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
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
    PRINT 'Created Users table'
END
GO

-- Password reset tokens for local users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResets' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    CREATE TABLE FormsSystem.PasswordResets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        reset_token NVARCHAR(500) NOT NULL,
        expiry DATETIME NOT NULL,
        used BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES FormsSystem.Users(id)
    );
    PRINT 'Created PasswordResets table'
END
GO

-- Forms table - stores all types of forms (Purchase, CAPEX, Travel, Minor, Major)
-- Note: This table structure is handled by the migration section above if it already exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Forms' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    CREATE TABLE FormsSystem.Forms (
        id INT IDENTITY(1,1) PRIMARY KEY,
        form_type NVARCHAR(255) NOT NULL, -- 'Purchase Request', 'Travel Request', etc.
        custom_name NVARCHAR(255) NULL, -- User-defined custom form name
        form_category NVARCHAR(100) NOT NULL, -- 'purchase', 'capex', 'travel', 'minor', 'major'
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
    PRINT 'Created Forms table'
END
GO

-- Form attachments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormAttachments' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
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
    PRINT 'Created FormAttachments table'
END
GO

-- Form workflow/approval history
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormWorkflow' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    CREATE TABLE FormsSystem.FormWorkflow (
        id INT IDENTITY(1,1) PRIMARY KEY,
        form_id INT NOT NULL,
        action NVARCHAR(100) NOT NULL, -- 'submitted', 'approved', 'rejected', 'modified'
        performed_by NVARCHAR(255) NOT NULL,
        comments NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (form_id) REFERENCES FormsSystem.Forms(id) ON DELETE CASCADE
    );
    PRINT 'Created FormWorkflow table'
END
GO

-- Audit log for tracking changes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
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
    PRINT 'Created AuditLog table'
END
GO

-- System settings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemSettings' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    CREATE TABLE FormsSystem.SystemSettings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        setting_key NVARCHAR(255) NOT NULL UNIQUE,
        setting_value NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(500) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created SystemSettings table'
END
GO

-- Performance indexes (create only if they don't exist)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email')
    CREATE INDEX idx_users_email ON FormsSystem.Users(email);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_department')
    CREATE INDEX idx_users_department ON FormsSystem.Users(department);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_is_active')
    CREATE INDEX idx_users_is_active ON FormsSystem.Users(is_active);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_resets_token')
    CREATE INDEX idx_password_resets_token ON FormsSystem.PasswordResets(reset_token);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_password_resets_user')
    CREATE INDEX idx_password_resets_user ON FormsSystem.PasswordResets(user_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_user_name')
    CREATE INDEX idx_forms_user_name ON FormsSystem.Forms(user_name);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_department')
    CREATE INDEX idx_forms_department ON FormsSystem.Forms(department);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_status')
    CREATE INDEX idx_forms_status ON FormsSystem.Forms(status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_type')
    CREATE INDEX idx_forms_type ON FormsSystem.Forms(form_type);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_request_date')
    CREATE INDEX idx_forms_request_date ON FormsSystem.Forms(request_date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_forms_status_type')
    CREATE INDEX idx_forms_status_type ON FormsSystem.Forms(status, form_type);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_form_attachments_form_id')
    CREATE INDEX idx_form_attachments_form_id ON FormsSystem.FormAttachments(form_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_form_workflow_form_id')
    CREATE INDEX idx_form_workflow_form_id ON FormsSystem.FormWorkflow(form_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_department_budget_year')
    CREATE INDEX idx_department_budget_year ON FormsSystem.DepartmentBudgets(department_id, fiscal_year);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_log_table_record')
    CREATE INDEX idx_audit_log_table_record ON FormsSystem.AuditLog(table_name, record_id);
GO

-- Insert default departments (only if they don't exist)
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'IT Department')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('IT Department', 500000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'HR Department')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('HR Department', 200000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'Finance Department')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('Finance Department', 300000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'Operations Department')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('Operations Department', 400000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'Marketing Department')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('Marketing Department', 250000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'Research & Development')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('Research & Development', 600000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'Legal Department')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('Legal Department', 150000.00);
IF NOT EXISTS (SELECT * FROM FormsSystem.Departments WHERE name = 'Facilities Management')
    INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES ('Facilities Management', 350000.00);
GO

-- Insert default system settings (only if they don't exist)
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'system_name')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('system_name', 'NWFTH Forms Management System', 'System display name');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'max_file_size')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'allowed_file_types')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('allowed_file_types', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif', 'Allowed file types for attachments');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'default_currency')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('default_currency', 'USD', 'Default currency for amounts');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'email_notifications')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('email_notifications', 'true', 'Enable email notifications');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'auto_approve_threshold')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('auto_approve_threshold', '1000.00', 'Auto-approve forms below this amount');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'fiscal_year_start')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('fiscal_year_start', '01-01', 'Fiscal year start date (MM-DD)');
IF NOT EXISTS (SELECT * FROM FormsSystem.SystemSettings WHERE setting_key = 'backup_retention_days')
    INSERT INTO FormsSystem.SystemSettings (setting_key, setting_value, description) VALUES ('backup_retention_days', '90', 'Number of days to retain backups');
GO

-- Insert default fiscal year budgets (current year)
DECLARE @current_year INT = YEAR(GETDATE());
INSERT INTO FormsSystem.DepartmentBudgets (department_id, fiscal_year, budget_amount)
SELECT id, @current_year, budget_amount 
FROM FormsSystem.Departments;
GO

-- Create view for active users
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'ActiveUsers' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    EXEC('CREATE VIEW FormsSystem.ActiveUsers AS
    SELECT u.id, u.email, u.name, u.department, u.role, u.is_domain_user, u.last_login
    FROM FormsSystem.Users u
    WHERE u.is_active = 1')
    PRINT 'Created ActiveUsers view'
END
GO

-- Create view for pending forms (handled in post-migration section above)
-- This view is created conditionally after the Forms table migration completes
GO

-- Create view for department budget summary
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'DepartmentBudgetSummary' AND SCHEMA_NAME(schema_id) = 'FormsSystem')
BEGIN
    EXEC('CREATE VIEW FormsSystem.DepartmentBudgetSummary AS
    SELECT 
        d.name AS department_name,
        db.fiscal_year,
        db.budget_amount,
        ISNULL(SUM(f.total_amount), 0) AS spent_amount,
        db.budget_amount - ISNULL(SUM(f.total_amount), 0) AS remaining_amount
    FROM FormsSystem.Departments d
    LEFT JOIN FormsSystem.DepartmentBudgets db ON d.id = db.department_id
    LEFT JOIN FormsSystem.Forms f ON d.name = f.department AND f.status = ''Approved''
    GROUP BY d.name, db.fiscal_year, db.budget_amount')
    PRINT 'Created DepartmentBudgetSummary view'
END
GO

-- Create audit trigger for Forms table
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_Forms_Audit')
BEGIN
    EXEC('CREATE TRIGGER tr_Forms_Audit
    ON FormsSystem.Forms
    FOR INSERT, UPDATE, DELETE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        BEGIN
            -- UPDATE
            INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, old_values, new_values)
            SELECT ''Forms'', i.id, ''UPDATE'', SYSTEM_USER, 
                   (SELECT * FROM deleted d WHERE d.id = i.id FOR JSON AUTO),
                   (SELECT * FROM inserted i2 WHERE i2.id = i.id FOR JSON AUTO)
            FROM inserted i;
        END
        ELSE IF EXISTS (SELECT * FROM inserted)
        BEGIN
            -- INSERT
            INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, new_values)
            SELECT ''Forms'', i.id, ''INSERT'', SYSTEM_USER, 
                   (SELECT * FROM inserted i2 WHERE i2.id = i.id FOR JSON AUTO)
            FROM inserted i;
        END
        ELSE IF EXISTS (SELECT * FROM deleted)
        BEGIN
            -- DELETE
            INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, old_values)
            SELECT ''Forms'', d.id, ''DELETE'', SYSTEM_USER, 
                   (SELECT * FROM deleted d2 WHERE d2.id = d.id FOR JSON AUTO)
            FROM deleted d;
        END
    END')
    PRINT 'Created tr_Forms_Audit trigger'
END
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