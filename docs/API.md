# API Documentation

## Base URL
```
Development: http://localhost:3001
Production: https://api.insurance.com
```

## Authentication

### Register Customer
**POST** `/api/v2/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "1234567890",
  "dob": "1990-01-01",
  "address": "123 Main St"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "customer_id": "CUST_1234567890",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Customer Login
**POST** `/api/v2/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "customer_id": "CUST_1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  }
}
```

### Admin Login
**POST** `/api/v2/auth/admin/login`

**Request Body:**
```json
{
  "email": "admin@insurance.com",
  "password": "AdminPass123!"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "admin_id": "ADM001",
      "name": "Admin User",
      "email": "admin@insurance.com",
      "role": "System Admin",
      "isAdmin": true
    }
  }
}
```

### Refresh Token
**POST** `/api/v2/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Change Password
**POST** `/api/v2/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "Authentication failed: Invalid token"
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "Forbidden: Admin access required"
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "status": "fail",
  "message": "Email already registered"
}
```

### 429 Too Many Requests
```json
{
  "status": "error",
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Something went wrong. Please try again later."
}
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Quote Generation**: 10 requests per minute
- **File Uploads**: 20 requests per hour

## Pagination

For endpoints that return lists, use these query parameters:

```
GET /api/v2/policies?page=1&limit=10
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## Interactive API Documentation

Full interactive API documentation with try-it-out functionality:
http://localhost:3001/api-docs
