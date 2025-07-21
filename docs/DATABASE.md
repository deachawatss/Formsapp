# Database Documentation

This document provides comprehensive information about the NWFTH Forms Management System database architecture, schema, and operations.

## 📊 Database Overview

**Database System**: Microsoft SQL Server  
**Schema**: `FormsSystem`  
**Compatibility**: SQL Server 2016+  
**Character Set**: UTF-8 (NVARCHAR for international support)

### Architecture Principles
- **Schema-First Design**: All objects under `FormsSystem` schema
- **Migration-Driven**: Comprehensive migration system for schema evolution
- **Performance-Optimized**: Strategic indexing and computed columns
- **Audit-Ready**: Complete change tracking and audit logging
- **Security-Focused**: Parameterized queries and role-based access

---

## 🏗️ Schema Architecture

### Core Entity Relationships

```
Users (1) ──────── (N) Forms
  │                    │
  │                    │
  └── (N) PasswordResets
                       │
Departments (1) ── (N) DepartmentBudgets
                       │
                       └── (1) Forms (department field)

Forms (1) ──────── (N) FormAttachments
  │
  └── (1) ──────── (N) FormWorkflow
  │
  └── (1) ──────── (N) AuditLog
```

---

## 📋 Table Specifications

### 1. Users Table
**Purpose**: User account management with dual authentication support

```sql
CREATE TABLE FormsSystem.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NULL,        -- NULL for AD users
    name NVARCHAR(255) NOT NULL,
    department NVARCHAR(255) NULL,      -- String-based department
    role NVARCHAR(50) DEFAULT 'user',   -- 'user', 'admin', 'manager'
    is_domain_user BIT DEFAULT 0,       -- TRUE for Active Directory
    is_active BIT DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

**Key Features**:
- **Dual Authentication**: Supports both local and Active Directory users
- **Role-Based Access**: User, Admin, Manager roles
- **Audit Trail**: Login tracking and account lifecycle
- **Soft Delete**: `is_active` flag for account deactivation

**Indexes**:
- `idx_users_email` - Fast email lookup for authentication
- `idx_users_department` - Department-based queries
- `idx_users_is_active` - Active user filtering

### 2. Departments Table
**Purpose**: Organizational structure and budget management

```sql
CREATE TABLE FormsSystem.Departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    budget_amount DECIMAL(18,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

**Sample Data**:
```sql
INSERT INTO FormsSystem.Departments (name, budget_amount) VALUES 
('IT Department', 500000.00),
('HR Department', 200000.00),
('Finance Department', 300000.00),
('Operations Department', 400000.00),
('Marketing Department', 250000.00),
('Research & Development', 600000.00);
```

### 3. DepartmentBudgets Table
**Purpose**: Fiscal year budget tracking with real-time calculations

```sql
CREATE TABLE FormsSystem.DepartmentBudgets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    department_id INT NOT NULL,
    fiscal_year INT NOT NULL,
    budget_amount DECIMAL(18,2) NOT NULL,
    spent_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount AS (budget_amount - spent_amount), -- Computed column
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (department_id) REFERENCES FormsSystem.Departments(id)
);
```

**Key Features**:
- **Computed Columns**: Automatic remaining budget calculation
- **Fiscal Year Support**: Multi-year budget tracking
- **Real-time Updates**: Spent amount updated via triggers

### 4. Forms Table (Core Entity)
**Purpose**: Unified storage for all form types

```sql
CREATE TABLE FormsSystem.Forms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_type NVARCHAR(255) NOT NULL,     -- 'Purchase Request', 'Travel Request', etc.
    custom_name NVARCHAR(255) NULL,       -- User-defined form name
    form_category NVARCHAR(100) NOT NULL, -- 'purchase', 'capex', 'travel', 'minor', 'major'
    user_name NVARCHAR(255) NOT NULL,     -- String-based user name
    department NVARCHAR(255) NULL,        -- String-based department
    total_amount DECIMAL(18,2) DEFAULT 0,
    details NVARCHAR(MAX),                -- JSON details storage
    status NVARCHAR(50) DEFAULT 'Draft',  -- Workflow status
    priority NVARCHAR(20) DEFAULT 'Normal', -- Priority level
    request_date DATETIME DEFAULT GETDATE(),
    approved_by NVARCHAR(255) NULL,
    approved_date DATETIME NULL,
    rejected_by NVARCHAR(255) NULL,
    rejected_date DATETIME NULL,
    rejection_reason NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

**Status Values**:
- `Draft` - Form being created/edited
- `Submitted` - Submitted for approval
- `Waiting For Approve` - In approval process
- `Approved` - Approved for processing
- `Rejected` - Rejected with reason

**Priority Values**:
- `Low` - Non-urgent requests
- `Normal` - Standard processing
- `High` - Expedited processing
- `Urgent` - Critical/emergency requests

**Form Categories**:
- `purchase` - Purchase Request Forms
- `capex` - Capital Expenditure Forms
- `travel` - Travel Request Forms
- `minor` - Minor Request Forms
- `major` - Major Request Forms

**JSON Details Structure**:
```json
{
    "justification": "Business justification text",
    "items": [
        {
            "description": "Item description",
            "quantity": 2,
            "unit_price": 500.00,
            "total_price": 1000.00
        }
    ],
    "vendor": "Supplier name",
    "delivery_date": "2024-02-01",
    "attachments": ["file1.pdf", "file2.jpg"],
    "form_specific_field": "value"
}
```

**Indexes**:
- `idx_forms_user_name` - User's forms lookup
- `idx_forms_department` - Department reports
- `idx_forms_status` - Workflow queries
- `idx_forms_type` - Form type filtering
- `idx_forms_category` - Category-based queries
- `idx_forms_request_date` - Date range queries
- `idx_forms_status_type` - Combined status/type queries
- `idx_forms_status_category` - Combined status/category queries

### 5. FormAttachments Table
**Purpose**: File attachment management

```sql
CREATE TABLE FormsSystem.FormAttachments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    original_name NVARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type NVARCHAR(100) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    uploaded_by NVARCHAR(255) NOT NULL,
    uploaded_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (form_id) REFERENCES FormsSystem.Forms(id)
);
```

### 6. FormWorkflow Table
**Purpose**: Workflow history and approval tracking

```sql
CREATE TABLE FormsSystem.FormWorkflow (
    id INT IDENTITY(1,1) PRIMARY KEY,
    form_id INT NOT NULL,
    action NVARCHAR(50) NOT NULL,         -- 'Submitted', 'Approved', 'Rejected', etc.
    performed_by NVARCHAR(255) NOT NULL,
    comments NVARCHAR(MAX) NULL,
    performed_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (form_id) REFERENCES FormsSystem.Forms(id)
);
```

### 7. PasswordResets Table
**Purpose**: Secure password reset system

```sql
CREATE TABLE FormsSystem.PasswordResets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    reset_token NVARCHAR(500) NOT NULL,
    expiry DATETIME NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES FormsSystem.Users(id)
);
```

### 8. AuditLog Table
**Purpose**: Complete system audit trail

```sql
CREATE TABLE FormsSystem.AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    table_name NVARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action NVARCHAR(50) NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'
    changed_by NVARCHAR(255) NOT NULL,
    old_values NVARCHAR(MAX) NULL,        -- JSON of old values
    new_values NVARCHAR(MAX) NULL,        -- JSON of new values
    changed_at DATETIME DEFAULT GETDATE()
);
```

### 9. SystemSettings Table
**Purpose**: Application configuration management

```sql
CREATE TABLE FormsSystem.SystemSettings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    setting_key NVARCHAR(100) NOT NULL UNIQUE,
    setting_value NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(500) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
```

**Default Settings**:
```sql
INSERT INTO FormsSystem.SystemSettings VALUES 
('system_name', 'NWFTH Forms Management System', 'System display name'),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif', 'Allowed file types'),
('default_currency', 'USD', 'Default currency for amounts'),
('email_notifications', 'true', 'Enable email notifications'),
('auto_approve_threshold', '1000.00', 'Auto-approve forms below this amount'),
('fiscal_year_start', '01-01', 'Fiscal year start date (MM-DD)'),
('backup_retention_days', '90', 'Number of days to retain backups');
```

---

## 📈 Database Views

### 1. ActiveUsers View
**Purpose**: Quick access to active user accounts

```sql
CREATE VIEW FormsSystem.ActiveUsers AS
SELECT 
    id, email, name, department, role, 
    is_domain_user, last_login, created_at
FROM FormsSystem.Users 
WHERE is_active = 1;
```

### 2. PendingForms View
**Purpose**: Forms awaiting approval

```sql
CREATE VIEW FormsSystem.PendingForms AS
SELECT 
    f.id, f.form_type, f.custom_name, f.form_category,
    f.user_name, f.department, f.total_amount, 
    f.request_date, f.priority
FROM FormsSystem.Forms f
WHERE f.status IN ('Submitted', 'Waiting For Approve');
```

### 3. DepartmentBudgetSummary View
**Purpose**: Real-time department budget overview

```sql
CREATE VIEW FormsSystem.DepartmentBudgetSummary AS
SELECT 
    d.name AS department_name,
    db.fiscal_year,
    db.budget_amount,
    db.spent_amount,
    db.remaining_amount,
    CASE 
        WHEN db.budget_amount > 0 
        THEN (db.spent_amount / db.budget_amount) * 100 
        ELSE 0 
    END AS utilization_percentage
FROM FormsSystem.Departments d
JOIN FormsSystem.DepartmentBudgets db ON d.id = db.department_id;
```

---

## 🔄 Database Triggers

### 1. Audit Triggers
**Purpose**: Automatic audit logging for all table changes

```sql
-- Forms table audit trigger
CREATE TRIGGER FormsSystem.tr_Forms_Audit
ON FormsSystem.Forms
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Handle INSERT
    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, new_values)
        SELECT 'Forms', id, 'INSERT', SYSTEM_USER, 
               (SELECT * FROM inserted WHERE id = i.id FOR JSON AUTO)
        FROM inserted i;
    END
    
    -- Handle UPDATE
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, old_values, new_values)
        SELECT 'Forms', i.id, 'UPDATE', SYSTEM_USER,
               (SELECT * FROM deleted WHERE id = i.id FOR JSON AUTO),
               (SELECT * FROM inserted WHERE id = i.id FOR JSON AUTO)
        FROM inserted i;
    END
    
    -- Handle DELETE
    IF NOT EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
    BEGIN
        INSERT INTO FormsSystem.AuditLog (table_name, record_id, action, changed_by, old_values)
        SELECT 'Forms', id, 'DELETE', SYSTEM_USER,
               (SELECT * FROM deleted WHERE id = d.id FOR JSON AUTO)
        FROM deleted d;
    END
END;
```

### 2. Budget Update Trigger
**Purpose**: Automatic budget spent amount updates

```sql
CREATE TRIGGER FormsSystem.tr_Forms_BudgetUpdate
ON FormsSystem.Forms
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update spent amount when form is approved
    IF UPDATE(status)
    BEGIN
        UPDATE db
        SET spent_amount = spent_amount + i.total_amount,
            updated_at = GETDATE()
        FROM FormsSystem.DepartmentBudgets db
        JOIN FormsSystem.Departments d ON db.department_id = d.id
        JOIN inserted i ON d.name = i.department
        WHERE i.status = 'Approved' 
        AND NOT EXISTS (
            SELECT 1 FROM deleted del 
            WHERE del.id = i.id AND del.status = 'Approved'
        );
    END
END;
```

---

## 🔍 Query Examples

### User Management Queries

#### Create New User
```sql
INSERT INTO FormsSystem.Users (email, password, name, department, role)
VALUES ('john.doe@company.com', '$2b$10$hashed_password', 'John Doe', 'IT Department', 'user');
```

#### Find User by Email
```sql
SELECT id, email, name, department, role, is_domain_user, is_active
FROM FormsSystem.Users 
WHERE email = 'john.doe@company.com' AND is_active = 1;
```

#### Update User Role
```sql
UPDATE FormsSystem.Users 
SET role = 'manager', updated_at = GETDATE()
WHERE email = 'john.doe@company.com';
```

### Form Management Queries

#### Get User's Forms
```sql
SELECT id, form_type, custom_name, status, total_amount, request_date
FROM FormsSystem.Forms 
WHERE user_name = 'John Doe'
ORDER BY request_date DESC;
```

#### Get Forms by Status
```sql
SELECT f.id, f.form_type, f.custom_name, f.user_name, f.department, 
       f.total_amount, f.request_date, f.priority
FROM FormsSystem.Forms f
WHERE f.status = 'Submitted'
ORDER BY f.priority DESC, f.request_date ASC;
```

#### Get Department Forms Summary
```sql
SELECT 
    department,
    COUNT(*) as total_forms,
    SUM(CASE WHEN status = 'Approved' THEN total_amount ELSE 0 END) as approved_amount,
    SUM(CASE WHEN status = 'Pending' THEN total_amount ELSE 0 END) as pending_amount
FROM FormsSystem.Forms 
WHERE department = 'IT Department'
AND request_date >= '2024-01-01'
GROUP BY department;
```

### Budget Analysis Queries

#### Department Budget Status
```sql
SELECT 
    d.name,
    db.budget_amount,
    db.spent_amount,
    db.remaining_amount,
    ROUND((db.spent_amount / db.budget_amount) * 100, 2) as utilization_percent
FROM FormsSystem.Departments d
JOIN FormsSystem.DepartmentBudgets db ON d.id = db.department_id
WHERE db.fiscal_year = YEAR(GETDATE());
```

#### Top Spending Departments
```sql
SELECT TOP 5
    d.name,
    SUM(f.total_amount) as total_spent
FROM FormsSystem.Departments d
JOIN FormsSystem.Forms f ON d.name = f.department
WHERE f.status = 'Approved'
AND f.request_date >= DATEADD(MONTH, -12, GETDATE())
GROUP BY d.name
ORDER BY total_spent DESC;
```

### Audit and Reporting Queries

#### Form Workflow History
```sql
SELECT 
    fw.action,
    fw.performed_by,
    fw.comments,
    fw.performed_at
FROM FormsSystem.FormWorkflow fw
WHERE fw.form_id = 123
ORDER BY fw.performed_at ASC;
```

#### Recent Audit Activity
```sql
SELECT 
    al.table_name,
    al.record_id,
    al.action,
    al.changed_by,
    al.changed_at
FROM FormsSystem.AuditLog al
WHERE al.changed_at >= DATEADD(DAY, -7, GETDATE())
ORDER BY al.changed_at DESC;
```

#### Monthly Form Statistics
```sql
SELECT 
    YEAR(request_date) as year,
    MONTH(request_date) as month,
    form_category,
    COUNT(*) as form_count,
    SUM(total_amount) as total_amount
FROM FormsSystem.Forms
WHERE request_date >= DATEADD(MONTH, -12, GETDATE())
GROUP BY YEAR(request_date), MONTH(request_date), form_category
ORDER BY year DESC, month DESC, form_category;
```

---

## 🎯 Performance Optimization

### Index Strategy

#### Core Performance Indexes
```sql
-- User authentication
CREATE INDEX idx_users_email_active ON FormsSystem.Users(email, is_active);

-- Form queries
CREATE INDEX idx_forms_user_status ON FormsSystem.Forms(user_name, status);
CREATE INDEX idx_forms_dept_date ON FormsSystem.Forms(department, request_date);
CREATE INDEX idx_forms_status_priority ON FormsSystem.Forms(status, priority, request_date);

-- Audit queries
CREATE INDEX idx_audit_table_date ON FormsSystem.AuditLog(table_name, changed_at);
CREATE INDEX idx_audit_user_date ON FormsSystem.AuditLog(changed_by, changed_at);

-- Budget analysis
CREATE INDEX idx_budget_dept_year ON FormsSystem.DepartmentBudgets(department_id, fiscal_year);
```

#### Query Optimization Examples

**Before Optimization:**
```sql
-- Slow: Full table scan
SELECT * FROM FormsSystem.Forms 
WHERE department = 'IT Department' 
AND status = 'Submitted';
```

**After Optimization:**
```sql
-- Fast: Uses composite index
SELECT id, form_type, custom_name, total_amount, request_date
FROM FormsSystem.Forms 
WHERE status = 'Submitted' 
AND department = 'IT Department'
ORDER BY priority DESC, request_date ASC;
```

### Query Performance Analysis

#### Enable Query Statistics
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Your query here
SELECT * FROM FormsSystem.Forms WHERE status = 'Submitted';

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
```

#### Execution Plan Analysis
```sql
-- View execution plan
SET SHOWPLAN_ALL ON;
SELECT * FROM FormsSystem.Forms WHERE department = 'IT Department';
SET SHOWPLAN_ALL OFF;

-- Or use SQL Server Management Studio's graphical execution plan (Ctrl+M)
```

---

## 🔒 Security Implementation

### Access Control

#### User Roles and Permissions
```sql
-- Create database roles
CREATE ROLE FormsUser;
CREATE ROLE FormsManager;
CREATE ROLE FormsAdmin;

-- Grant permissions to roles
GRANT SELECT, INSERT, UPDATE ON FormsSystem.Forms TO FormsUser;
GRANT SELECT ON FormsSystem.Departments TO FormsUser;

GRANT SELECT, INSERT, UPDATE, DELETE ON FormsSystem.Forms TO FormsManager;
GRANT SELECT ON FormsSystem.AuditLog TO FormsManager;

GRANT ALL ON SCHEMA::FormsSystem TO FormsAdmin;
```

#### Row-Level Security (RLS)
```sql
-- Enable RLS on Forms table
ALTER TABLE FormsSystem.Forms ENABLE ROW LEVEL SECURITY;

-- Create security policy
CREATE FUNCTION FormsSystem.fn_securitypredicate(@user_name NVARCHAR(255))
RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_securitypredicate_result
    WHERE @user_name = USER_NAME() OR IS_MEMBER('FormsAdmin') = 1;

-- Apply policy
CREATE SECURITY POLICY FormsSystem.FormsSecurityPolicy
ADD FILTER PREDICATE FormsSystem.fn_securitypredicate(user_name) ON FormsSystem.Forms
WITH (STATE = ON);
```

### Data Encryption

#### Sensitive Data Encryption
```sql
-- Create master key
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'StrongPassword123!';

-- Create certificate
CREATE CERTIFICATE FormsCert WITH SUBJECT = 'Forms Data Encryption';

-- Create symmetric key
CREATE SYMMETRIC KEY FormsKey
WITH ALGORITHM = AES_256
ENCRYPTION BY CERTIFICATE FormsCert;

-- Encrypt sensitive data
OPEN SYMMETRIC KEY FormsKey DECRYPTION BY CERTIFICATE FormsCert;
UPDATE FormsSystem.Users 
SET password = ENCRYPTBYKEY(KEY_GUID('FormsKey'), password);
CLOSE SYMMETRIC KEY FormsKey;
```

---

## 🔄 Migration Management

### Schema Migration Process

#### 1. Version Control
```sql
-- Create migration tracking table
CREATE TABLE FormsSystem.SchemaMigrations (
    migration_id NVARCHAR(50) PRIMARY KEY,
    description NVARCHAR(255) NOT NULL,
    applied_at DATETIME DEFAULT GETDATE()
);
```

#### 2. Migration Template
```sql
-- Migration: 001_add_custom_form_fields.sql
-- Description: Add custom form fields support

-- Check if migration already applied
IF NOT EXISTS (SELECT 1 FROM FormsSystem.SchemaMigrations WHERE migration_id = '001')
BEGIN
    -- Migration code here
    ALTER TABLE FormsSystem.Forms ADD custom_field1 NVARCHAR(255) NULL;
    ALTER TABLE FormsSystem.Forms ADD custom_field2 DECIMAL(18,2) NULL;
    
    -- Create indexes
    CREATE INDEX idx_forms_custom_field1 ON FormsSystem.Forms(custom_field1);
    
    -- Record migration
    INSERT INTO FormsSystem.SchemaMigrations (migration_id, description)
    VALUES ('001', 'Add custom form fields support');
    
    PRINT 'Migration 001 applied successfully';
END
ELSE
BEGIN
    PRINT 'Migration 001 already applied, skipping';
END
```

#### 3. Rollback Scripts
```sql
-- Rollback: 001_add_custom_form_fields_rollback.sql
-- Remove custom form fields

IF EXISTS (SELECT 1 FROM FormsSystem.SchemaMigrations WHERE migration_id = '001')
BEGIN
    -- Rollback code
    DROP INDEX idx_forms_custom_field1 ON FormsSystem.Forms;
    ALTER TABLE FormsSystem.Forms DROP COLUMN custom_field1;
    ALTER TABLE FormsSystem.Forms DROP COLUMN custom_field2;
    
    -- Remove migration record
    DELETE FROM FormsSystem.SchemaMigrations WHERE migration_id = '001';
    
    PRINT 'Migration 001 rolled back successfully';
END
```

---

## 📊 Monitoring and Maintenance

### Performance Monitoring

#### Database Health Queries
```sql
-- Check index fragmentation
SELECT 
    t.name AS table_name,
    i.name AS index_name,
    s.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') s
JOIN sys.tables t ON s.object_id = t.object_id
JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE s.avg_fragmentation_in_percent > 10
ORDER BY s.avg_fragmentation_in_percent DESC;
```

#### Table Size Analysis
```sql
SELECT 
    t.name AS table_name,
    SUM(p.rows) AS row_count,
    SUM(a.total_pages) * 8 AS total_space_kb,
    SUM(a.used_pages) * 8 AS used_space_kb
FROM sys.tables t
JOIN sys.indexes i ON t.object_id = i.object_id
JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.schema_id = SCHEMA_ID('FormsSystem')
GROUP BY t.name
ORDER BY used_space_kb DESC;
```

### Maintenance Scripts

#### Update Statistics
```sql
-- Update statistics for all tables
EXEC sp_updatestats;

-- Update specific table statistics
UPDATE STATISTICS FormsSystem.Forms;
```

#### Rebuild Indexes
```sql
-- Rebuild all indexes for Forms table
ALTER INDEX ALL ON FormsSystem.Forms REBUILD;

-- Reorganize specific index
ALTER INDEX idx_forms_status ON FormsSystem.Forms REORGANIZE;
```

#### Database Backup
```sql
-- Full backup
BACKUP DATABASE TFCPILOT 
TO DISK = 'C:\Backups\TFCPILOT_Full.bak'
WITH COMPRESSION, CHECKSUM, INIT;

-- Transaction log backup
BACKUP LOG TFCPILOT 
TO DISK = 'C:\Backups\TFCPILOT_Log.trn'
WITH COMPRESSION, CHECKSUM;
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Slow Query Performance
```sql
-- Find expensive queries
SELECT TOP 10
    qs.total_elapsed_time / qs.execution_count AS avg_duration,
    qs.execution_count,
    SUBSTRING(qt.text, qs.statement_start_offset/2 + 1,
        (CASE WHEN qs.statement_end_offset = -1
            THEN LEN(CONVERT(NVARCHAR(MAX), qt.text)) * 2
            ELSE qs.statement_end_offset END - qs.statement_start_offset)/2) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%FormsSystem%'
ORDER BY avg_duration DESC;
```

#### 2. Blocking Issues
```sql
-- Find blocking sessions
SELECT 
    blocking.session_id AS blocking_session,
    blocked.session_id AS blocked_session,
    blocking.login_name AS blocking_user,
    blocked.login_name AS blocked_user,
    blocked.wait_type,
    blocked.wait_time,
    blocked.last_request_end_time
FROM sys.dm_exec_sessions blocking
JOIN sys.dm_exec_requests blocked ON blocking.session_id = blocked.blocking_session_id;
```

#### 3. Deadlock Analysis
```sql
-- Enable deadlock trace flag
DBCC TRACEON(1222, -1);

-- Query deadlock graph from system health session
SELECT 
    xed.value('@timestamp', 'datetime2(3)') AS creation_date,
    xed.query('.') AS deadlock_graph
FROM (
    SELECT CAST(target_data AS XML) AS target_data
    FROM sys.dm_xe_sessions s
    JOIN sys.dm_xe_session_targets t ON s.address = t.event_session_address
    WHERE s.name = 'system_health'
) AS tab
CROSS APPLY target_data.nodes('//RingBufferTarget/event') AS x(xed)
WHERE xed.value('@name', 'varchar(60)') = 'xml_deadlock_report';
```

---

## 📚 References and Resources

### SQL Server Documentation
- [SQL Server Index Design Guide](https://docs.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide)
- [Query Performance Tuning](https://docs.microsoft.com/en-us/sql/relational-databases/performance/query-performance-insight)
- [Security Best Practices](https://docs.microsoft.com/en-us/sql/relational-databases/security/sql-server-security-best-practices)

### Tools
- **SQL Server Management Studio (SSMS)** - Database administration
- **Azure Data Studio** - Cross-platform database tool
- **SQL Server Profiler** - Query monitoring and analysis
- **Database Engine Tuning Advisor** - Performance recommendations

### Best Practices
1. **Always use parameterized queries** to prevent SQL injection
2. **Implement proper indexing strategy** based on query patterns
3. **Regular maintenance** including statistics updates and index rebuilds
4. **Monitor performance** using built-in DMVs and tools
5. **Implement proper backup strategy** with regular testing
6. **Use row-level security** for multi-tenant applications
7. **Regular security audits** and access reviews

---

This database documentation provides comprehensive coverage of the NWFTH Forms Management System database architecture. For specific implementation questions or troubleshooting, refer to the corresponding sections or consult the development team.