# NWFTH Forms Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)](https://www.docker.com/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-Compatible-orange.svg)](https://www.microsoft.com/en-us/sql-server)

An enterprise-grade organizational form management system with Node.js/Express backend and React frontend. Provides comprehensive form lifecycle management for multiple form types with advanced features including dual authentication, executive dashboard analytics, automated PDF generation, and production-ready Docker deployment.

## 🌟 Features

### Core Functionality
- **Multiple Form Types**: Purchase Request, CAPEX Request, Travel Request, Minor Forms, Major Forms
- **Dual Authentication**: Local users + Active Directory integration
- **Executive Dashboard**: Real-time analytics with Chart.js visualizations
- **PDF Generation**: Professional document output with Puppeteer and custom fonts
- **Email Notifications**: Automated notifications with HTML templates
- **Role-Based Access**: User, Admin, Manager permissions
- **Budget Tracking**: Real-time department budget monitoring

### Advanced Features
- **Multi-Trip Travel Forms**: Dynamic trip management with add/remove functionality
- **Form Workflow Management**: Draft, Submit, Approve, Reject, tracking
- **Audit Logging**: Complete form history and change tracking
- **Professional Email System**: Automated form delivery with PDF attachments
- **Responsive Design**: Mobile-friendly interface with Material-UI components
- **Health Monitoring**: Built-in health check endpoints for container orchestration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQL Server
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NWFTH-Forms
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp Form-App/.env.example Form-App/.env
   # Edit Form-App/.env with your database and email settings
   ```

4. **Setup database**
   ```bash
   # Run the database.sql script on your SQL Server instance
   sqlcmd -S your-server -d your-database -i database.sql
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:3000) and backend (http://localhost:5000)

### Production Deployment

#### Using Docker (Recommended)

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Or build manually**
   ```bash
   npm run build:docker
   npm run run:docker
   ```

#### Manual Deployment

1. **Build frontend**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
NWFTH-Forms/
├── Form-App/                 # Backend Node.js/Express server
│   ├── server.js            # Main server file with all routes
│   ├── fonts/               # Roboto font family for PDF generation
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment configuration
├── form-frontend/           # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Form pages and views
│   │   └── styles/          # CSS stylesheets
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── database.sql             # Complete database schema
├── docker-compose.yml       # Production orchestration
├── Dockerfile              # Multi-stage production build
└── package.json            # Root package scripts
```

## 🔧 Configuration

### Environment Variables

Create `Form-App/.env` with the following variables:

```env
# Database Configuration
DB_SERVER=your-sql-server
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
DB_PORT=1433

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password

# Active Directory (Optional)
AD_URL=ldap://your-domain-controller
AD_BASE_DN=DC=yourdomain,DC=com
AD_USERNAME=ad-service-account
AD_PASSWORD=ad-service-password

# Application Settings
NODE_ENV=production
PORT=5000
```

## 📊 Database Schema

The system uses SQL Server with the `FormsSystem` schema:

### Core Tables
- **Users**: Enhanced user accounts (local + Active Directory)
- **Departments**: Organizational structure with budget tracking
- **DepartmentBudgets**: Fiscal year budget management
- **Forms**: Unified forms table supporting all form types
- **FormAttachments**: File attachment management
- **AuditLog**: Complete change tracking

### Key Features
- **Migration System**: Automatic schema evolution
- **Performance Optimization**: 15+ strategic indexes
- **Data Integrity**: Foreign key constraints and computed columns
- **Audit Capabilities**: Automatic change tracking with triggers

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Active Directory Integration**: Enterprise authentication support
- **CORS Protection**: Configurable cross-origin resource sharing
- **SQL Injection Prevention**: Parameterized queries throughout
- **Role-Based Access Control**: User, Admin, Manager permissions
- **Secure Password Reset**: Token-based password reset system

## 📈 API Endpoints

### Authentication
- `POST /api/login` - User authentication
- `POST /api/register` - User registration
- `POST /api/reset-password-request` - Request password reset
- `POST /api/reset-password` - Reset password with token

### Forms Management
- `GET /api/forms` - Get all forms (admin)
- `GET /api/forms/my-forms` - Get user's forms
- `POST /api/forms` - Create new form
- `GET /api/forms/:id` - Get specific form
- `PUT /api/forms/:id` - Update form
- `PUT /api/forms/:id/custom-name` - Update form custom name

### PDF & Email
- `GET /api/forms/:id/pdf` - Generate PDF for form
- `POST /api/forms/pdf-email` - Email PDF to recipients
- `POST /api/send-email` - Send general email

### System
- `GET /health` - Health check endpoint

## 🧪 Testing

### Frontend Testing
```bash
cd form-frontend
npm test                    # Run React tests
npm run test:coverage      # Run with coverage report
```

### Backend Testing
```bash
cd Form-App
npm test                   # Run backend tests (when implemented)
```

## 📦 Deployment

### Docker Production Setup

1. **Environment Configuration**
   ```bash
   # Create production environment file
   cp Form-App/.env.example Form-App/.env.production
   ```

2. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Health Check**
   ```bash
   curl http://localhost:5000/health
   ```

### Manual Production Setup

1. **Build Frontend**
   ```bash
   cd form-frontend
   npm run build:prod
   ```

2. **Install Production Dependencies**
   ```bash
   cd Form-App
   npm ci --only=production
   ```

3. **Start with Process Manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name nwfth-forms
   ```

## 🔍 Monitoring & Logging

### Health Monitoring
- **Health Check**: `GET /health` endpoint
- **Docker Health**: Built-in container health checks
- **Database Connection**: Automatic connection monitoring

### Logging
- **Application Logs**: Console logging with environment-based levels
- **Audit Logs**: Database-stored audit trail for all form changes
- **Error Tracking**: Comprehensive error logging and handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure Docker builds successfully

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
- **Database Connection**: Verify SQL Server is running and accessible
- **Authentication Issues**: Check JWT_SECRET configuration
- **PDF Generation**: Ensure all Roboto fonts are present in Form-App/fonts/
- **Email Delivery**: Verify SMTP configuration and credentials

### Getting Help
1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review [API Documentation](docs/API.md)
3. Check [Deployment Guide](docs/DEPLOYMENT.md)
4. Create an issue for bugs or feature requests

## 🔄 Changelog

### Version 1.0.0
- Initial release with core form management functionality
- Dual authentication (Local + Active Directory)
- PDF generation and email notifications
- Executive dashboard with analytics
- Docker containerization
- Complete audit logging system

---

**Built with ❤️ for enterprise form management**