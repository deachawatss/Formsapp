# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NWFTH-Forms is a full-stack organizational form management system with a Node.js/Express backend and React frontend. The application handles multiple form types (Purchase, CAPEX, Travel, Minor/Major requests) with user authentication, PDF generation, and email notifications.

## Tech Stack

- **Backend**: Node.js/Express with SQL Server integration
- **Frontend**: React 19 with Material-UI (MUI v6)
- **Database**: Microsoft SQL Server
- **Authentication**: JWT + Active Directory
- **PDF Generation**: Puppeteer (headless Chrome)
- **Email**: Nodemailer
- **Charts**: Chart.js

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

### Docker Commands
```bash
npm run build:docker  # Build Docker image
npm run run:docker    # Run Docker container
docker-compose up --build  # Use Docker Compose
```

## Project Structure

### Form-App/ (Backend)
- `server.js` - Main Express server with all routes, database connections, PDF generation, and email logic
- `database.sql` - Complete database schema with tables for users, forms, departments, and workflows
- `fonts/` - Roboto font family for PDF generation
- `.env` - Database connection and email configuration

### form-frontend/ (Frontend)
- `src/components/` - Reusable UI components (Header, Sidebar)
- `src/pages/` - Form pages (Purchase, CAPEX, Travel, Minor, Major requests)
- `src/styles/` - CSS stylesheets for each component
- `public/` - Static assets and HTML template
- `build/` - Production build output (already built)

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
- Travel Request Forms
- Minor Forms
- Major Forms

### Core Functionality
- Multi-tenant department structure
- Role-based access control
- Form workflow management (submit, approve, reject)
- PDF generation from forms
- Email notifications for form actions
- Analytics dashboard with charts
- User authentication with Active Directory

## Database Schema

The SQL Server database includes:
- `Users` - User accounts with department associations
- `Departments` - Organizational departments
- `PurchaseRequests`, `CapexRequests`, `TravelRequests`, `MinorForms`, `MajorForms` - Form-specific tables
- Workflow and approval tracking fields in each form table

## Development Notes

- The application is production-ready with existing build artifacts
- All database schema is defined in `Form-App/database.sql`
- Environment variables are configured in `Form-App/.env`
- PDF generation uses Puppeteer with custom fonts in `Form-App/fonts/`
- Frontend build output is already present in `form-frontend/build/`
- Authentication integrates with Active Directory for user management