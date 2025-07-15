# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NWFTH-Forms is an enterprise-grade organizational form management system with a Node.js/Express backend and React frontend. The application provides comprehensive form lifecycle management for multiple form types (Purchase, CAPEX, Travel, Minor/Major requests) with advanced features including dual authentication (Local + Active Directory), executive dashboard analytics, automated PDF generation, email notifications, and production-ready Docker deployment.

## Tech Stack

- **Backend**: Node.js/Express with SQL Server integration
- **Frontend**: React 18 with Material-UI (MUI v6) + React Router v7
- **Database**: Microsoft SQL Server with FormsSystem schema
- **Authentication**: JWT + Active Directory (dual authentication)
- **PDF Generation**: Puppeteer (headless Chrome) with complete Roboto font family
- **Email**: Nodemailer with HTML templates
- **Analytics**: Chart.js with react-chartjs-2 for dashboard visualizations
- **Deployment**: Docker with multi-stage builds and health checks
- **Security**: bcrypt, cross-env, non-root containers

## Development Commands

### Quick Start (Recommended)
```bash
npm run dev    # Start both frontend and backend in development mode
npm run build  # Build frontend for production
npm start      # Start production server
```

### Individual Services
#### Backend (Form-App)
```bash
cd Form-App
npm run dev    # Development with nodemon
npm start      # Production mode
```

#### Frontend (form-frontend)
```bash
cd form-frontend
npm run dev    # Development server
npm run build  # Production build
npm test       # React testing
```

### Docker Commands (Production Ready)
```bash
# Build and run with npm scripts
npm run build:docker  # Build Docker image
npm run run:docker    # Run Docker container

# Direct Docker commands
docker build -t nwfth-forms .
docker run -p 5000:5000 nwfth-forms

# Docker Compose (Recommended for production)
docker-compose up --build  # Build and start with compose
docker-compose up -d       # Start in detached mode
docker-compose down        # Stop and remove containers
docker-compose logs -f     # Follow logs

# Health check
curl http://localhost:5000/health
```

## Project Structure

### Root Level
- `Dockerfile` - Multi-stage production build with Puppeteer dependencies
- `docker-compose.yml` - Production orchestration with environment variables
- `database.sql` - Complete FormsSystem schema with advanced features
- `package.json` - Root package with Docker scripts and project coordination

### Form-App/ (Backend)
- `server.js` - Main Express server with all routes, database connections, PDF generation, and email logic
- `fonts/` - Complete Roboto font family (Regular, Bold, Italic, etc.) for PDF generation
- `package.json` - Backend dependencies including Puppeteer, Active Directory, and email
- `.env` - Database, email, and Active Directory configuration

### form-frontend/ (Frontend)
- `src/components/` - Reusable UI components (Header, Sidebar)
- `src/pages/` - Form pages (Purchase, CAPEX, Travel, Minor, Major requests) + Dashboard
- `src/styles/` - CSS stylesheets for each component including Dashboard analytics
- `public/` - Static assets and HTML template
- `build/` - Production build output (served by backend in Docker)

## Architecture Patterns

### Backend Architecture
- **Single File Server**: All routes, middleware, and business logic in `server.js`
- **Database-First**: SQL Server with comprehensive schema in `database.sql`
- **JWT Authentication**: Token-based auth with Active Directory integration
- **PDF Generation Pipeline**: Puppeteer generates PDFs from form data
- **Email Notifications**: Automated notifications for form submissions and approvals

### Frontend Architecture
- **Component-based React**: Modular page and component structure
- **Protected Routes**: JWT-based authentication wrapper
- **Material-UI Design**: Consistent UI components with MUI v6
- **Form-specific Pages**: Dedicated pages for each form type with view/edit capabilities
- **Dashboard Analytics**: Chart.js integration for data visualization

## Key Features

### Form Types Supported
- Purchase Request Forms
- CAPEX Request Forms  
- Travel Request Forms (with multi-trip support and remove trip functionality)
- Minor Forms
- Major Forms

### Core Functionality
- Multi-tenant department structure with budget tracking
- Role-based access control (user, admin, manager roles)
- Form workflow management (submit, approve, reject, draft)
- Professional PDF generation with Puppeteer and custom fonts
- Automated email notifications with HTML templates
- Executive dashboard with Chart.js analytics
- Dual authentication: Local users + Active Directory integration

### Advanced Features
- **Executive Dashboard**: Comprehensive analytics with bar charts, pie charts, and trend analysis
- **Financial Tracking**: Real-time budget monitoring and spending analysis
- **Active Directory Integration**: Auto-provisioning and domain user management
- **Multi-trip Travel Forms**: Dynamic trip management with add/remove functionality
- **PDF Email System**: Automated form delivery with professional email templates
- **Production Deployment**: Docker containerization with health checks
- **Audit Logging**: Complete form history and change tracking
- **Responsive Design**: Mobile-friendly interface with Material-UI components

## Database Schema

The SQL Server database uses the **FormsSystem** schema with advanced features:

### Core Tables
- `FormsSystem.Users` - Enhanced user accounts supporting both local and Active Directory authentication
- `FormsSystem.Departments` - Organizational departments with budget tracking
- `FormsSystem.DepartmentBudgets` - Fiscal year budget management with spent/remaining calculations
- `FormsSystem.Forms` - Unified forms table supporting all form types with JSON details storage

### Advanced Features
- **Audit Logging**: Automatic change tracking with triggers
- **Budget Management**: Real-time budget calculations with computed columns
- **Performance Optimization**: 15+ strategic indexes for query performance
- **Data Views**: Business intelligence views for analytics and reporting
- **Password Reset**: Secure token-based password reset system
- **Form Workflow**: Complete status tracking (Draft, Submitted, Approved, Rejected)

### Security & Performance
- Parameterized queries preventing SQL injection
- Optimized indexes for dashboard analytics
- Computed columns for real-time calculations
- Foreign key constraints ensuring data integrity

## Development Notes

### Production Readiness
- **Docker Deployment**: Multi-stage builds with production optimizations
- **Health Monitoring**: Built-in health check endpoints for container orchestration
- **Security Hardening**: Non-root containers, environment variable configuration
- **Performance**: Optimized database queries with strategic indexing
- **Font Management**: Complete Roboto font family for consistent PDF output

### Environment Configuration
- Database schema defined in root-level `database.sql` with FormsSystem schema
- Environment variables configured in `Form-App/.env` for all services
- Docker environment variables in `docker-compose.yml` for production deployment
- Frontend build artifacts integrated into Docker container for single-container deployment

### Key Technical Details
- **PDF Generation**: Puppeteer with headless Chrome for high-quality PDF output
- **Authentication**: Dual system supporting both local users and Active Directory
- **Analytics**: Chart.js integration with real-time data visualization
- **Email System**: Professional HTML email templates with automated PDF attachments
- **Database**: Advanced SQL Server features including triggers, views, and computed columns

### Deployment Workflows
- **Development**: `npm run dev` for concurrent frontend/backend development
- **Production**: Docker Compose with health checks and environment management
- **Testing**: Integrated testing with React Testing Library and Jest
- **Build Process**: Automated frontend builds integrated into Docker containers