# Development Setup Guide

This guide provides comprehensive instructions for setting up a development environment for the NWFTH Forms Management System.

## 🛠️ Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 8+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **SQL Server** (Express/Developer Edition)
- **Visual Studio Code** (recommended IDE)

### Recommended Tools
- **Docker Desktop** (for containerized development)
- **Postman** (for API testing)
- **SQL Server Management Studio** (SSMS)
- **Browser Developer Tools** (Chrome DevTools recommended)

---

## 🚀 Quick Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd NWFTH-Forms
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Or install individually
npm install                           # Root dependencies
cd Form-App && npm install && cd ..   # Backend dependencies
cd form-frontend && npm install       # Frontend dependencies
```

### 3. Database Setup

#### Option A: Local SQL Server
1. Install SQL Server Express/Developer
2. Create database and run schema:
   ```sql
   CREATE DATABASE TFCPILOT;
   GO
   USE TFCPILOT;
   GO
   -- Run the entire database.sql script
   ```

#### Option B: Docker SQL Server
```bash
# Run SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sqlserver \
   -d mcr.microsoft.com/mssql/server:2019-latest

# Connect and create database
docker exec -it sqlserver /opt/mssql-tools/bin/sqlcmd \
   -S localhost -U sa -P "YourStrong@Passw0rd" \
   -Q "CREATE DATABASE TFCPILOT"

# Run schema script
docker exec -i sqlserver /opt/mssql-tools/bin/sqlcmd \
   -S localhost -U sa -P "YourStrong@Passw0rd" -d TFCPILOT \
   < database.sql
```

### 4. Environment Configuration
```bash
# Copy environment template
cp Form-App/.env.example Form-App/.env

# Edit configuration
nano Form-App/.env
```

**Form-App/.env:**
```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=TFCPILOT
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
DB_PORT=1433

# JWT Configuration
JWT_SECRET=your-development-jwt-secret

# Email Configuration (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Development Settings
NODE_ENV=development
PORT=5000
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend    # Backend only (http://localhost:5000)
npm run dev:frontend   # Frontend only (http://localhost:3000)
```

### 6. Verify Setup
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

---

## 📁 Project Structure Deep Dive

```
NWFTH-Forms/
├── Form-App/                    # Backend Application
│   ├── server.js               # Main Express server
│   ├── fonts/                  # Roboto fonts for PDF generation
│   │   ├── Roboto-Regular.ttf
│   │   ├── Roboto-Bold.ttf
│   │   └── ...
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── .env.example          # Environment template
├── form-frontend/             # React Frontend
│   ├── public/               # Static assets
│   │   ├── index.html       # HTML template
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Header.js    # Navigation header
│   │   │   ├── Header.css
│   │   │   ├── Sidebar.js   # Navigation sidebar
│   │   │   └── Sidebar.css
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.js         # Analytics dashboard
│   │   │   ├── Home.js              # Home page
│   │   │   ├── login.js             # Authentication
│   │   │   ├── MyForms.js           # User's forms
│   │   │   ├── PurchaseRequestForm.js
│   │   │   ├── CapexRequestForm.js
│   │   │   ├── TravelRequestForm.js
│   │   │   ├── MinorForm.js
│   │   │   ├── MajorForm.js
│   │   │   ├── ViewForm.js          # Generic form viewer
│   │   │   ├── ViewPRForm.js        # Purchase request viewer
│   │   │   ├── ViewTravelRequest.js
│   │   │   ├── ViewMinorForm.js
│   │   │   └── ViewMajorForm.js
│   │   ├── styles/          # CSS stylesheets
│   │   │   ├── common.css           # Shared styles
│   │   │   ├── bandci-variables.css # Brand variables
│   │   │   ├── Dashboard.css
│   │   │   ├── Login.css
│   │   │   └── ...
│   │   ├── App.js           # Main application component
│   │   ├── App.css
│   │   └── index.js         # Application entry point
│   └── package.json         # Frontend dependencies
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── DEVELOPMENT.md      # This file
│   └── ...
├── database.sql            # Database schema
├── docker-compose.yml      # Docker orchestration
├── Dockerfile             # Container definition
├── package.json           # Root package scripts
├── README.md              # Project overview
└── CLAUDE.md              # Claude AI instructions
```

---

## 🔧 Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-form-type

# Make changes and commit
git add .
git commit -m "feat: add new form type support"

# Push and create pull request
git push origin feature/new-form-type
```

### Backend Development

#### Adding New API Endpoint
```javascript
// In Form-App/server.js
app.get('/api/new-endpoint', authenticateToken, async (req, res) => {
    try {
        // Your logic here
        const result = await pool.request()
            .query('SELECT * FROM FormsSystem.YourTable');
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
```

#### Database Queries
```javascript
// Using parameterized queries (security best practice)
const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('formType', sql.NVarChar, formType)
    .query(`
        SELECT * FROM FormsSystem.Forms 
        WHERE user_id = @userId AND form_type = @formType
    `);
```

### Frontend Development

#### Creating New Component
```javascript
// src/components/NewComponent.js
import React, { useState, useEffect } from 'react';
import './NewComponent.css';

const NewComponent = ({ prop1, prop2 }) => {
    const [state, setState] = useState(null);

    useEffect(() => {
        // Component logic
    }, []);

    return (
        <div className="new-component">
            {/* Component JSX */}
        </div>
    );
};

export default NewComponent;
```

#### Adding New Route
```javascript
// In src/App.js
import NewPage from './pages/NewPage';

// Add route in Routes component
<Route path="/new-page" element={
    <ProtectedRoute>
        <NewPage />
    </ProtectedRoute>
} />
```

#### API Integration
```javascript
// Making API calls
const fetchData = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/endpoint', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            setData(data);
        }
    } catch (error) {
        console.error('API Error:', error);
    }
};
```

---

## 🧪 Testing

### Backend Testing Setup
```bash
# Install testing dependencies
cd Form-App
npm install --save-dev jest supertest

# Create test directory
mkdir tests
```

**tests/api.test.js:**
```javascript
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
    test('Health check should return 200', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('Protected route should require authentication', async () => {
        const response = await request(app).get('/api/forms');
        expect(response.status).toBe(401);
    });
});
```

### Frontend Testing
```bash
# Run React tests
cd form-frontend
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- NewComponent.test.js
```

**src/components/__tests__/Header.test.js:**
```javascript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

test('renders header component', () => {
    render(
        <BrowserRouter>
            <Header />
        </BrowserRouter>
    );
    
    expect(screen.getByText('NWFTH Forms')).toBeInTheDocument();
});
```

---

## 🔍 Debugging

### Backend Debugging

#### Using Node.js Debugger
```bash
# Start server with debugger
node --inspect Form-App/server.js

# With nodemon
nodemon --inspect Form-App/server.js
```

#### Console Logging
```javascript
// Structured logging
console.log('📝 Form created:', { formId, userId, timestamp: new Date() });
console.error('❌ Database error:', error.message);
console.warn('⚠️  Deprecated API call:', endpoint);
```

#### Database Debugging
```javascript
// Log SQL queries
const result = await pool.request()
    .input('id', sql.Int, formId)
    .query('SELECT * FROM FormsSystem.Forms WHERE id = @id');

console.log('🗄️  Query result:', result.recordset.length, 'records');
```

### Frontend Debugging

#### React Developer Tools
1. Install React DevTools browser extension
2. Use Components and Profiler tabs
3. Inspect component state and props

#### Console Debugging
```javascript
// Debug component state
useEffect(() => {
    console.log('🔍 Component state:', { forms, loading, error });
}, [forms, loading, error]);

// Debug API calls
const apiCall = async () => {
    console.log('📡 Making API call to:', endpoint);
    const response = await fetch(endpoint);
    console.log('📡 API response:', response.status, await response.json());
};
```

#### Network Tab
- Monitor API calls in browser DevTools
- Check request/response headers
- Verify authentication tokens

---

## 📊 Performance Optimization

### Backend Performance

#### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_forms_user_status ON FormsSystem.Forms(user_name, status);
CREATE INDEX idx_forms_date_range ON FormsSystem.Forms(request_date, department);

-- Analyze query performance
SET STATISTICS IO ON;
SELECT * FROM FormsSystem.Forms WHERE status = 'Submitted';
```

#### Memory Management
```javascript
// PDF generation optimization
const generatePDF = async (formData) => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });
    
    try {
        const page = await browser.newPage();
        // PDF generation logic
    } finally {
        await browser.close(); // Always close browser
    }
};
```

### Frontend Performance

#### Bundle Analysis
```bash
# Analyze bundle size
cd form-frontend
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

#### Code Splitting
```javascript
// Lazy load components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PurchaseForm = React.lazy(() => import('./pages/PurchaseRequestForm'));

// Wrap with Suspense
<Suspense fallback={<div>Loading...</div>}>
    <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
</Suspense>
```

#### Optimize Re-renders
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
    return <div>{/* Complex rendering */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);
```

---

## 🛡️ Security Best Practices

### Backend Security
```javascript
// Input validation
const validateFormInput = (req, res, next) => {
    const { form_type, total_amount } = req.body;
    
    if (!form_type || typeof form_type !== 'string') {
        return res.status(400).json({ error: 'Invalid form_type' });
    }
    
    if (total_amount && (isNaN(total_amount) || total_amount < 0)) {
        return res.status(400).json({ error: 'Invalid total_amount' });
    }
    
    next();
};

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Frontend Security
```javascript
// XSS Prevention
const sanitizeInput = (input) => {
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
};

// Secure token storage
const setToken = (token) => {
    // Use httpOnly cookies in production
    localStorage.setItem('token', token);
};

// CSRF protection
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
```

---

## 📝 Code Style Guidelines

### Backend Style
```javascript
// Use consistent naming
const getUserForms = async (userId) => { /* ... */ };
const createNewForm = async (formData) => { /* ... */ };

// Error handling
try {
    const result = await databaseOperation();
    return { success: true, data: result };
} catch (error) {
    console.error('Operation failed:', error);
    throw new Error('Database operation failed');
}

// Async/await over promises
const fetchData = async () => {
    const data = await apiCall();
    return data;
};
```

### Frontend Style
```javascript
// Component naming (PascalCase)
const FormSubmissionButton = () => { /* ... */ };

// Hook naming (camelCase with 'use' prefix)
const useFormValidation = () => { /* ... */ };

// Event handlers
const handleSubmit = (event) => { /* ... */ };
const handleInputChange = (event) => { /* ... */ };

// State destructuring
const [formData, setFormData] = useState({});
const [loading, setLoading] = useState(false);
```

### CSS Guidelines
```css
/* BEM methodology */
.form-component { }
.form-component__input { }
.form-component__input--error { }

/* CSS custom properties */
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --error-color: #dc3545;
}

/* Mobile-first responsive design */
.container {
    width: 100%;
    padding: 1rem;
}

@media (min-width: 768px) {
    .container {
        max-width: 750px;
        margin: 0 auto;
    }
}
```

---

## 🔄 Hot Reload & Live Development

### Backend Hot Reload
```bash
# Using nodemon (already configured)
npm run dev:backend

# Manual setup
npm install -g nodemon
nodemon Form-App/server.js
```

### Frontend Hot Reload
```bash
# React development server (built-in)
npm run dev:frontend

# Automatically opens http://localhost:3000
# Changes reflect immediately
```

### Full Stack Development
```bash
# Run both with concurrently
npm run dev

# This starts:
# - Backend on http://localhost:5000
# - Frontend on http://localhost:3000
# - Proxy configured for API calls
```

---

## 📦 Package Management

### Adding Dependencies

#### Backend
```bash
cd Form-App
npm install package-name
npm install --save-dev dev-package-name
```

#### Frontend
```bash
cd form-frontend
npm install package-name
npm install --save-dev dev-package-name
```

### Updating Dependencies
```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest
```

### Security Auditing
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Force fix (use with caution)
npm audit fix --force
```

---

## 🚀 Build Process

### Development Build
```bash
# Frontend development build
cd form-frontend
npm run dev        # Development server
npm run build      # Production build

# Backend (no build needed)
cd Form-App
npm run dev        # Development with nodemon
npm start          # Production mode
```

### Production Build
```bash
# Full production build
npm run build      # Builds frontend only
npm start          # Starts production server

# Docker production build
docker build -t nwfth-forms .
docker run -p 5000:5000 nwfth-forms
```

---

## 🎯 Common Development Tasks

### Adding New Form Type

1. **Update database schema**
   ```sql
   -- Add to form_category enum values
   ALTER TABLE FormsSystem.Forms 
   ADD CONSTRAINT chk_form_category 
   CHECK (form_category IN ('purchase', 'capex', 'travel', 'minor', 'major', 'new_type'));
   ```

2. **Create form component**
   ```bash
   # Create new form component
   touch form-frontend/src/pages/NewTypeForm.js
   touch form-frontend/src/styles/NewTypeForm.css
   ```

3. **Add route**
   ```javascript
   // In App.js
   <Route path="/form/new-type" element={
       <ProtectedRoute><NewTypeForm /></ProtectedRoute>
   } />
   ```

4. **Update navigation**
   ```javascript
   // In Sidebar.js
   <Link to="/form/new-type">New Type Form</Link>
   ```

### Adding Authentication Provider

1. **Install provider package**
   ```bash
   cd Form-App
   npm install passport passport-google-oauth20
   ```

2. **Configure strategy**
   ```javascript
   // In server.js
   const GoogleStrategy = require('passport-google-oauth20').Strategy;
   
   passport.use(new GoogleStrategy({
       clientID: process.env.GOOGLE_CLIENT_ID,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       callbackURL: "/auth/google/callback"
   }, async (accessToken, refreshToken, profile, done) => {
       // Handle user authentication
   }));
   ```

### Database Migration

1. **Create migration file**
   ```sql
   -- migrations/001_add_new_column.sql
   ALTER TABLE FormsSystem.Forms 
   ADD new_column NVARCHAR(255) NULL;
   ```

2. **Run migration**
   ```bash
   sqlcmd -S localhost -d TFCPILOT -i migrations/001_add_new_column.sql
   ```

---

## 📚 Resources & References

### Documentation
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Material-UI Documentation](https://mui.com/)
- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/sql-server/)

### Tools
- [Postman Collection](./postman/NWFTH-Forms.postman_collection.json)
- [VS Code Extensions](./.vscode/extensions.json)
- [ESLint Configuration](./.eslintrc.js)
- [Prettier Configuration](./.prettierrc)

### Community
- [Project Issues](../../issues)
- [Discussions](../../discussions)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

## 🤝 Getting Help

1. **Check documentation** - README.md, API.md, DEPLOYMENT.md
2. **Search existing issues** - Someone might have faced the same problem
3. **Create detailed issue** - Include steps to reproduce, environment details
4. **Join discussions** - Ask questions in project discussions

Happy coding! 🚀