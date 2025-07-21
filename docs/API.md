# API Documentation

## Overview

The NWFTH Forms Management System provides a RESTful API for managing organizational forms, user authentication, and system operations. All API endpoints use JSON for request/response bodies and require proper authentication where specified.

**Base URL**: `http://localhost:5000/api` (development) | `http://your-domain.com/api` (production)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle
- **Expiration**: Tokens expire after 24 hours
- **Storage**: Store securely in localStorage or secure cookies
- **Refresh**: Re-authenticate when token expires

---

## Authentication Endpoints

### POST /api/login
Authenticate user with email and password or Active Directory credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "isDomainUser": false  // Optional: true for Active Directory users
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "department": "IT Department",
    "role": "user",
    "is_domain_user": false
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### POST /api/register
Register a new local user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "name": "Jane Smith",
  "department": "HR Department"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "department": "HR Department",
    "role": "user"
  }
}
```

### POST /api/reset-password-request
Request password reset token for local users.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## Forms Management

### GET /api/forms
Get all forms (admin/manager access only).

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by form status (Draft, Submitted, Approved, Rejected)
- `department` (optional): Filter by department
- `form_type` (optional): Filter by form type
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Results per page (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "forms": [
    {
      "id": 1,
      "form_type": "Purchase Request",
      "custom_name": "Office Supplies Q1",
      "form_category": "purchase",
      "user_name": "John Doe",
      "department": "IT Department",
      "total_amount": 1250.00,
      "status": "Submitted",
      "priority": "Normal",
      "request_date": "2024-01-15T10:30:00.000Z",
      "details": "{\"items\":[{\"description\":\"Laptops\",\"quantity\":2,\"price\":500.00}]}"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET /api/forms/my-forms
Get current user's forms.

**Headers:**
```http
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "forms": [
    {
      "id": 1,
      "form_type": "Purchase Request",
      "custom_name": "Office Supplies Q1",
      "total_amount": 1250.00,
      "status": "Submitted",
      "request_date": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST /api/forms
Create a new form.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "form_type": "Purchase Request",
  "custom_name": "Office Supplies Q1",
  "form_category": "purchase",
  "department": "IT Department",
  "total_amount": 1250.00,
  "priority": "Normal",
  "status": "Draft",
  "details": {
    "justification": "Need new equipment for team expansion",
    "items": [
      {
        "description": "Laptop computers",
        "quantity": 2,
        "unit_price": 500.00,
        "total_price": 1000.00
      },
      {
        "description": "Office chairs",
        "quantity": 2,
        "unit_price": 125.00,
        "total_price": 250.00
      }
    ],
    "vendor": "Tech Solutions Inc",
    "delivery_date": "2024-02-01"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Form created successfully",
  "formId": 1,
  "form": {
    "id": 1,
    "form_type": "Purchase Request",
    "custom_name": "Office Supplies Q1",
    "status": "Draft",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/forms/:id
Get specific form by ID.

**Headers:**
```http
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Form ID (integer)

**Success Response (200):**
```json
{
  "success": true,
  "form": {
    "id": 1,
    "form_type": "Purchase Request",
    "custom_name": "Office Supplies Q1",
    "form_category": "purchase",
    "user_name": "John Doe",
    "department": "IT Department",
    "total_amount": 1250.00,
    "details": "{\"items\":[...],\"justification\":\"...\"}",
    "status": "Submitted",
    "priority": "Normal",
    "request_date": "2024-01-15T10:30:00.000Z",
    "approved_by": null,
    "approved_date": null,
    "rejected_by": null,
    "rejected_date": null,
    "rejection_reason": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### PUT /api/forms/:id
Update form (owner only, or admin/manager).

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "custom_name": "Updated Office Supplies Q1",
  "total_amount": 1350.00,
  "status": "Submitted",
  "priority": "High",
  "details": {
    "justification": "Updated requirements",
    "items": [...]
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Form updated successfully"
}
```

### PUT /api/forms/:id/custom-name
Update form custom name only.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "custom_name": "New Custom Form Name"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Form name updated successfully"
}
```

---

## PDF Generation & Email

### GET /api/forms/:id/pdf
Generate PDF for a specific form.

**Headers:**
```http
Authorization: Bearer <token>
```

**URL Parameters:**
- `id`: Form ID (integer)

**Success Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="form-{id}-{timestamp}.pdf"

[PDF Binary Data]
```

### POST /api/forms/pdf-email
Generate PDF and email to recipients.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "formId": 1,
  "recipients": [
    "manager@company.com",
    "finance@company.com"
  ],
  "subject": "Purchase Request for Review",
  "message": "Please review the attached purchase request form."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "PDF generated and email sent successfully"
}
```

### POST /api/send-email
Send general email notification.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": ["recipient@company.com"],
  "subject": "Form Status Update",
  "message": "Your form has been approved.",
  "formId": 1  // Optional: for context
}
```

---

## System Endpoints

### GET /health
Health check endpoint for monitoring.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## Error Responses

### Common Error Codes

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Authentication**: 5 login attempts per minute per IP
- **PDF Generation**: 10 PDF generations per minute per user

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

---

## Data Models

### User Model
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "department": "IT Department",
  "role": "user|admin|manager",
  "is_domain_user": false,
  "is_active": true,
  "last_login": "2024-01-15T10:30:00.000Z",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Form Model
```json
{
  "id": 1,
  "form_type": "Purchase Request",
  "custom_name": "Office Supplies Q1",
  "form_category": "purchase|capex|travel|minor|major",
  "user_name": "John Doe",
  "department": "IT Department",
  "total_amount": 1250.00,
  "details": "JSON string with form-specific data",
  "status": "Draft|Submitted|Waiting For Approve|Approved|Rejected",
  "priority": "Low|Normal|High|Urgent",
  "request_date": "2024-01-15T10:30:00.000Z",
  "approved_by": "Manager Name",
  "approved_date": "2024-01-16T14:00:00.000Z",
  "rejected_by": null,
  "rejected_date": null,
  "rejection_reason": null,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class NWFTHFormsAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getMyForms() {
    const response = await this.client.get('/forms/my-forms');
    return response.data;
  }

  async createForm(formData) {
    const response = await this.client.post('/forms', formData);
    return response.data;
  }

  async generatePDF(formId) {
    const response = await this.client.get(`/forms/${formId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

// Usage
const api = new NWFTHFormsAPI('http://localhost:5000/api', 'your-jwt-token');
const forms = await api.getMyForms();
```

### Python
```python
import requests

class NWFTHFormsAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_my_forms(self):
        response = requests.get(f'{self.base_url}/forms/my-forms', 
                              headers=self.headers)
        return response.json()
    
    def create_form(self, form_data):
        response = requests.post(f'{self.base_url}/forms', 
                               json=form_data, headers=self.headers)
        return response.json()

# Usage
api = NWFTHFormsAPI('http://localhost:5000/api', 'your-jwt-token')
forms = api.get_my_forms()
```

---

## Testing

### API Testing with curl

**Login:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Create Form:**
```bash
curl -X POST http://localhost:5000/api/forms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"form_type":"Purchase Request","total_amount":1000}'
```

**Get Forms:**
```bash
curl -X GET http://localhost:5000/api/forms/my-forms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Changelog

### Version 1.0.0
- Initial API release
- Authentication endpoints
- Forms CRUD operations
- PDF generation
- Email notifications
- Health monitoring