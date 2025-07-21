# Security Documentation

This document outlines the comprehensive security measures, best practices, and implementation details for the NWFTH Forms Management System.

## 🛡️ Security Overview

**Security Philosophy**: Defense in depth with multiple layers of protection  
**Compliance**: OWASP Top 10 mitigation, enterprise security standards  
**Authentication**: Multi-modal (Local + Active Directory)  
**Data Protection**: Encryption at rest and in transit  

### Security Architecture
```
┌─────────────────────────────────────────────────┐
│                 Client Layer                    │
│  • HTTPS/TLS Encryption                        │
│  • Content Security Policy                     │
│  • XSS Protection Headers                      │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│               Application Layer                 │
│  • JWT Authentication                          │
│  • Role-Based Access Control                   │
│  • Input Validation & Sanitization             │
│  • CORS Protection                             │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│                Database Layer                   │
│  • Parameterized Queries                       │
│  • Row-Level Security                          │
│  • Audit Logging                               │
│  • Encrypted Sensitive Data                    │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### 1. Dual Authentication System

#### Local Authentication
```javascript
// Password hashing with bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 12;

const hashPassword = async (plainPassword) => {
    return await bcrypt.hash(plainPassword, saltRounds);
};

const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};
```

#### Active Directory Integration
```javascript
const ActiveDirectory = require('activedirectory2');

const adConfig = {
    url: process.env.AD_URL,
    baseDN: process.env.AD_BASE_DN,
    username: process.env.AD_USERNAME,
    password: process.env.AD_PASSWORD,
    attributes: {
        user: ['dn', 'distinguishedName', 'userPrincipalName', 'sAMAccountName', 'mail', 'lockoutTime', 'whenCreated', 'pwdLastSet'],
        group: ['dn', 'cn', 'description']
    }
};

const ad = new ActiveDirectory(adConfig);

const authenticateADUser = (username, password) => {
    return new Promise((resolve, reject) => {
        ad.authenticate(username, password, (err, auth) => {
            if (err) reject(err);
            else resolve(auth);
        });
    });
};
```

### 2. JWT Token Management

#### Token Generation
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        is_domain_user: user.is_domain_user
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'nwfth-forms',
        audience: 'nwfth-forms-users'
    });
};
```

#### Token Validation Middleware
```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
        
        req.user = user;
        next();
    });
};
```

### 3. Role-Based Access Control (RBAC)

#### User Roles
- **User**: Standard form creation and management
- **Manager**: Department-level approval and oversight
- **Admin**: System-wide administration and configuration

#### Authorization Middleware
```javascript
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }

        next();
    };
};

// Usage examples
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), getUsersHandler);
app.get('/api/manager/forms', authenticateToken, requireRole(['admin', 'manager']), getFormsHandler);
```

#### Resource-Level Authorization
```javascript
const authorizeFormAccess = async (req, res, next) => {
    const formId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const form = await getFormById(formId);
        
        if (!form) {
            return res.status(404).json({ 
                success: false, 
                message: 'Form not found' 
            });
        }

        // Admin can access all forms
        if (userRole === 'admin') {
            return next();
        }

        // Manager can access department forms
        if (userRole === 'manager' && form.department === req.user.department) {
            return next();
        }

        // User can only access their own forms
        if (form.user_id === userId) {
            return next();
        }

        return res.status(403).json({ 
            success: false, 
            message: 'Access denied to this form' 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Authorization check failed' 
        });
    }
};
```

---

## 🔒 Input Validation & Sanitization

### 1. Request Validation
```javascript
const validator = require('validator');
const xss = require('xss');

const validateFormInput = (req, res, next) => {
    const { form_type, total_amount, details, custom_name } = req.body;
    const errors = [];

    // Form type validation
    if (!form_type || !validator.isLength(form_type, { min: 1, max: 255 })) {
        errors.push('Form type is required and must be 1-255 characters');
    }

    // Amount validation
    if (total_amount !== undefined) {
        if (!validator.isNumeric(total_amount.toString()) || total_amount < 0) {
            errors.push('Total amount must be a positive number');
        }
        if (total_amount > 999999.99) {
            errors.push('Total amount exceeds maximum allowed value');
        }
    }

    // Custom name validation and sanitization
    if (custom_name) {
        if (!validator.isLength(custom_name, { min: 1, max: 255 })) {
            errors.push('Custom name must be 1-255 characters');
        }
        req.body.custom_name = xss(custom_name.trim());
    }

    // Details validation (JSON)
    if (details) {
        try {
            const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
            req.body.details = JSON.stringify(sanitizeObject(parsedDetails));
        } catch (error) {
            errors.push('Invalid JSON format in details');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Validation failed', 
            errors 
        });
    }

    next();
};

const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? xss(obj) : obj;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            sanitized[key] = value.map(item => sanitizeObject(item));
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else if (typeof value === 'string') {
            sanitized[key] = xss(value.trim());
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};
```

### 2. Email Validation
```javascript
const validateEmail = (email) => {
    if (!validator.isEmail(email)) {
        return false;
    }
    
    // Additional domain validation if needed
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
    if (allowedDomains.length > 0) {
        const domain = email.split('@')[1];
        return allowedDomains.includes(domain);
    }
    
    return true;
};
```

---

## 🌐 Network Security

### 1. CORS Configuration
```javascript
const cors = require('cors');

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'https://your-domain.com',
            'https://www.your-domain.com'
        ];
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
```

### 2. Security Headers
```javascript
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Strict rate limiting for authentication
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    }
});

// PDF generation rate limiting
const pdfLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 PDF generations per 5 minutes
    message: {
        success: false,
        message: 'PDF generation rate limit exceeded'
    }
});

app.use('/api/', apiLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forms/*/pdf', pdfLimiter);
```

---

## 🗄️ Database Security

### 1. SQL Injection Prevention
```javascript
// Always use parameterized queries
const getUserForms = async (userId, status) => {
    const query = `
        SELECT id, form_type, custom_name, status, total_amount, request_date
        FROM FormsSystem.Forms 
        WHERE user_id = @userId 
        AND (@status IS NULL OR status = @status)
        ORDER BY request_date DESC
    `;
    
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('status', sql.NVarChar, status)
        .query(query);
    
    return result.recordset;
};

// NEVER do this (vulnerable to SQL injection)
// const query = `SELECT * FROM Forms WHERE user_id = ${userId}`;
```

### 2. Database Connection Security
```javascript
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true, // Use encryption
        trustServerCertificate: false, // Verify server certificate
        requestTimeout: 30000,
        connectionTimeout: 30000,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    }
};
```

### 3. Row-Level Security Implementation
```sql
-- Create security function
CREATE FUNCTION FormsSystem.fn_securitypredicate(@user_name NVARCHAR(255))
RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_securitypredicate_result
    WHERE @user_name = USER_NAME() 
    OR IS_MEMBER('FormsManager') = 1 
    OR IS_MEMBER('FormsAdmin') = 1;

-- Apply security policy
CREATE SECURITY POLICY FormsSystem.FormsSecurityPolicy
ADD FILTER PREDICATE FormsSystem.fn_securitypredicate(user_name) ON FormsSystem.Forms,
ADD BLOCK PREDICATE FormsSystem.fn_securitypredicate(user_name) ON FormsSystem.Forms AFTER INSERT
WITH (STATE = ON);
```

---

## 🔍 Audit & Logging

### 1. Security Event Logging
```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'nwfth-forms-security' },
    transports: [
        new winston.transports.File({ filename: 'logs/security.log' }),
        new winston.transports.File({ filename: 'logs/security-error.log', level: 'error' })
    ]
});

const logSecurityEvent = (eventType, details, req) => {
    securityLogger.info({
        eventType,
        details,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        email: req.user?.email
    });
};

// Usage examples
logSecurityEvent('LOGIN_SUCCESS', { email: user.email }, req);
logSecurityEvent('LOGIN_FAILURE', { email: attemptedEmail, reason: 'Invalid credentials' }, req);
logSecurityEvent('UNAUTHORIZED_ACCESS', { endpoint: req.path, method: req.method }, req);
logSecurityEvent('FORM_ACCESS', { formId: req.params.id, action: 'view' }, req);
```

### 2. Database Audit Triggers
```sql
-- Comprehensive audit trigger for Forms table
CREATE TRIGGER FormsSystem.tr_Forms_SecurityAudit
ON FormsSystem.Forms
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @action NVARCHAR(10);
    DECLARE @user NVARCHAR(255) = SYSTEM_USER;
    
    IF EXISTS(SELECT * FROM inserted) AND NOT EXISTS(SELECT * FROM deleted)
        SET @action = 'INSERT';
    ELSE IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE
        SET @action = 'DELETE';
    
    -- Log sensitive field changes
    IF @action = 'UPDATE'
    BEGIN
        INSERT INTO FormsSystem.SecurityAudit (
            table_name, record_id, action, user_name, changed_at,
            old_values, new_values, sensitive_change
        )
        SELECT 
            'Forms', 
            COALESCE(i.id, d.id),
            @action,
            @user,
            GETDATE(),
            (SELECT d.* FOR JSON AUTO),
            (SELECT i.* FOR JSON AUTO),
            CASE 
                WHEN d.total_amount != i.total_amount OR d.status != i.status THEN 1
                ELSE 0
            END
        FROM inserted i
        FULL OUTER JOIN deleted d ON i.id = d.id;
    END
END;
```

---

## 🔐 Data Protection

### 1. Sensitive Data Encryption
```javascript
const crypto = require('crypto');

const algorithm = 'aes-256-gcm';
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

const encrypt = (text) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher(algorithm, secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
};

const decrypt = (encryptedData) => {
    const decipher = crypto.createDecipher(
        algorithm, 
        secretKey, 
        Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};
```

### 2. Password Security
```javascript
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

const validatePasswordStrength = (password) => {
    const result = zxcvbn(password);
    
    // Require score of 3 or higher (out of 4)
    if (result.score < 3) {
        return {
            valid: false,
            message: 'Password is too weak. Please use a stronger password.',
            suggestions: result.feedback.suggestions
        };
    }
    
    return { valid: true };
};

const hashPasswordSecure = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};
```

### 3. File Upload Security
```javascript
const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files per request
    }
});
```

---

## 🚨 Incident Response

### 1. Security Monitoring
```javascript
const monitorSuspiciousActivity = (req, res, next) => {
    const suspiciousPatterns = [
        /(\<script|\<iframe|\<object)/i,
        /(union|select|insert|delete|drop|create|alter)\s/i,
        /(\.\./){3,}/,
        /(wget|curl|nc|netcat)/i
    ];
    
    const checkValue = (value) => {
        if (typeof value === 'string') {
            return suspiciousPatterns.some(pattern => pattern.test(value));
        }
        return false;
    };
    
    const isSuspicious = Object.values(req.body || {}).some(checkValue) ||
                        Object.values(req.query || {}).some(checkValue) ||
                        Object.values(req.params || {}).some(checkValue);
    
    if (isSuspicious) {
        logSecurityEvent('SUSPICIOUS_REQUEST', {
            body: req.body,
            query: req.query,
            params: req.params,
            url: req.url
        }, req);
        
        return res.status(400).json({
            success: false,
            message: 'Request blocked due to suspicious content'
        });
    }
    
    next();
};
```

### 2. Brute Force Protection
```javascript
const loginAttempts = new Map();

const bruteForceProtection = (req, res, next) => {
    const key = `${req.ip}_${req.body.email}`;
    const now = Date.now();
    const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: now };
    
    // Reset attempts after 15 minutes
    if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
    }
    
    // Block after 5 failed attempts
    if (attempts.count >= 5) {
        logSecurityEvent('BRUTE_FORCE_DETECTED', {
            email: req.body.email,
            attempts: attempts.count
        }, req);
        
        return res.status(429).json({
            success: false,
            message: 'Too many failed login attempts. Please try again later.'
        });
    }
    
    req.loginAttempts = attempts;
    next();
};

const updateLoginAttempts = (req, success) => {
    const key = `${req.ip}_${req.body.email}`;
    
    if (success) {
        loginAttempts.delete(key);
    } else {
        const attempts = req.loginAttempts;
        attempts.count++;
        attempts.lastAttempt = Date.now();
        loginAttempts.set(key, attempts);
    }
};
```

---

## 🔧 Security Configuration

### 1. Environment Variables Security
```bash
# .env file should contain:
# Database credentials
DB_USER=secure_db_user
DB_PASSWORD=complex_secure_password_123!@#

# JWT secret (use a long, random string)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-256-bits-long

# Encryption keys
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data

# Active Directory credentials
AD_USERNAME=service-account
AD_PASSWORD=service-account-password

# Session secrets
SESSION_SECRET=another-long-random-string-for-sessions

# API keys (if any)
EMAIL_API_KEY=your-email-service-api-key
```

### 2. SSL/TLS Configuration
```javascript
// For production deployment with HTTPS
const https = require('https');
const fs = require('fs');

const sslOptions = {
    key: fs.readFileSync('/path/to/private-key.pem'),
    cert: fs.readFileSync('/path/to/certificate.pem'),
    ca: fs.readFileSync('/path/to/ca-bundle.pem') // if using intermediate certificates
};

const server = https.createServer(sslOptions, app);
server.listen(443, () => {
    console.log('HTTPS Server running on port 443');
});

// Redirect HTTP to HTTPS
const httpApp = express();
httpApp.use((req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
});
httpApp.listen(80);
```

---

## 📋 Security Checklist

### Pre-Deployment Security Audit

#### Application Security
- [ ] All input validated and sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection enabled
- [ ] CSRF protection configured
- [ ] Authentication and authorization working
- [ ] Password hashing implemented
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] File upload restrictions in place
- [ ] Error handling doesn't leak sensitive info

#### Database Security
- [ ] Parameterized queries used throughout
- [ ] Row-level security configured
- [ ] Database user has minimal required permissions
- [ ] Audit logging enabled
- [ ] Sensitive data encrypted
- [ ] Database connection encrypted
- [ ] Regular security updates applied
- [ ] Backup encryption enabled

#### Infrastructure Security
- [ ] HTTPS/TLS configured
- [ ] Firewall rules configured
- [ ] Server hardening completed
- [ ] Log monitoring set up
- [ ] Intrusion detection configured
- [ ] Regular security scans scheduled
- [ ] Access logs monitored
- [ ] Security incident response plan ready

#### Compliance
- [ ] Data privacy requirements met
- [ ] Audit trail requirements satisfied
- [ ] User consent mechanisms in place
- [ ] Data retention policies implemented
- [ ] Security documentation complete
- [ ] Security training completed
- [ ] Penetration testing performed
- [ ] Vulnerability assessment completed

---

## 🛡️ Best Practices Summary

### Development Security
1. **Never trust user input** - Validate and sanitize everything
2. **Use parameterized queries** - Prevent SQL injection
3. **Implement proper authentication** - Strong passwords, secure tokens
4. **Follow least privilege principle** - Minimal required permissions
5. **Keep dependencies updated** - Regular security updates
6. **Use HTTPS everywhere** - Encrypt data in transit
7. **Implement proper logging** - Monitor security events
8. **Handle errors securely** - Don't leak sensitive information

### Operational Security
1. **Regular security audits** - Periodic security assessments
2. **Monitor security logs** - Active threat detection
3. **Backup and recovery** - Secure backup procedures
4. **Incident response plan** - Prepared for security incidents
5. **Access control reviews** - Regular permission audits
6. **Security training** - Keep team updated on threats
7. **Patch management** - Timely security updates
8. **Network segmentation** - Isolate critical systems

---

## 📞 Security Contacts

### Internal Security Team
- **Security Officer**: security@yourcompany.com
- **IT Administrator**: admin@yourcompany.com
- **Development Lead**: dev-lead@yourcompany.com

### External Resources
- **Security Consultant**: [Contact Information]
- **Penetration Testing**: [Contact Information]
- **Incident Response**: [Contact Information]

### Emergency Procedures
1. **Security Incident**: Immediately contact security officer
2. **Data Breach**: Follow data breach response plan
3. **System Compromise**: Isolate affected systems
4. **Unauthorized Access**: Revoke access, investigate source

---

This security documentation provides comprehensive coverage of security measures for the NWFTH Forms Management System. Regular reviews and updates of these security practices are essential to maintain a robust security posture.