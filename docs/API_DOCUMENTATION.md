# API Documentation

Complete API reference for the Specialized Therapy Center Management System.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [User Management](#user-management)
   - [Patients](#patients)
   - [Therapists](#therapists)
   - [Sessions](#sessions)
   - [Proposals](#proposals)
   - [Reports](#reports)
   - [Analytics](#analytics)
   - [Audit Logs](#audit-logs)
   - [File Management](#file-management)

---

## Overview

**Base URL**: `/api`

**Content Type**: `application/json`

**Authentication**: Bearer token (JWT) via Supabase Auth

**API Version**: 1.0.0

---

## Authentication

All API endpoints (except public routes) require authentication via Supabase session cookies.

### Authentication Headers

```
Cookie: sb-access-token=<token>
Cookie: sb-refresh-token=<token>
```

### Public Routes

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/forgot-password`

### Error Responses

- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "statusCode": 400,
    "details": {
      "field": "email",
      "issue": "Invalid format"
    }
  }
}
```

### Error Types

| Type | Status Code | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND_ERROR` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Data conflict |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Database error |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse.

### Default Limits

- **Standard endpoints**: 100 requests per minute
- **Authentication endpoints**: 5 requests per minute
- **Upload endpoints**: 10 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded

```json
{
  "error": {
    "type": "RATE_LIMIT_ERROR",
    "message": "Too many requests. Please try again later.",
    "statusCode": 429,
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## API Endpoints

### User Management

#### Get Current User

**`GET /api/user`**

Get the currently authenticated user's profile.

**Response**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "THERAPIST",
    "createdAt": "2024-01-01T00:00:00Z",
    "profile": {
      "bio": "...",
      "phone": "+1234567890",
      "company": "...",
      "website": "..."
    }
  }
}
```

#### Update Current User

**`PATCH /api/user`**

Update the current user's profile.

**Request Body**

```json
{
  "name": "Jane Doe",
  "avatar": "https://...",
  "profile": {
    "bio": "...",
    "phone": "+1234567890"
  }
}
```

**Response**

```json
{
  "user": { /* updated user object */ }
}
```

---

### Patients

#### List Patients

**`GET /api/patients`**

Get a list of patients with pagination and filtering.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `search` | string | Search by name or email |
| `status` | string | Filter by status |

**Response**

```json
{
  "patients": [
    {
      "id": "uuid",
      "name": "Patient Name",
      "dateOfBirth": "2000-01-01",
      "gender": "MALE",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Create Patient

**`POST /api/patients`**

Create a new patient record.

**Request Body**

```json
{
  "name": "John Doe",
  "dateOfBirth": "2000-01-01",
  "gender": "MALE",
  "parentName": "Jane Doe",
  "parentEmail": "parent@example.com",
  "parentPhone": "+1234567890",
  "address": "123 Main St",
  "medicalHistory": "..."
}
```

**Response**

```json
{
  "patient": { /* created patient object */ }
}
```

---

### Sessions

#### List Sessions

**`GET /api/sessions`**

Get a list of therapy sessions.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `therapistId` | uuid | Filter by therapist |
| `patientId` | uuid | Filter by patient |
| `status` | string | Filter by status |
| `startDate` | date | Filter by start date |
| `endDate` | date | Filter by end date |

**Response**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "patient": { /* patient object */ },
      "therapist": { /* therapist object */ },
      "scheduledDate": "2024-01-01T10:00:00Z",
      "duration": 60,
      "status": "SCHEDULED",
      "sessionNotes": "..."
    }
  ]
}
```

#### Create Session

**`POST /api/sessions`**

Schedule a new therapy session.

**Request Body**

```json
{
  "serviceAssignmentId": "uuid",
  "patientId": "uuid",
  "therapistId": "uuid",
  "scheduledDate": "2024-01-01T10:00:00Z",
  "scheduledTime": "10:00",
  "duration": 60,
  "notes": "Initial session"
}
```

**Validation Rules**

- `scheduledTime`: Must be in HH:mm format (24-hour)
- `duration`: Must be between 15 and 480 minutes
- Automatic conflict detection with existing sessions

**Response**

```json
{
  "session": { /* created session object */ }
}
```

#### Bulk Schedule Sessions

**`POST /api/sessions/bulk`**

Schedule multiple sessions at once.

**Request Body**

```json
{
  "serviceAssignmentId": "uuid",
  "startDate": "2024-01-01",
  "endDate": "2024-03-01",
  "frequency": "WEEKLY",
  "preferredDays": ["MONDAY", "WEDNESDAY"],
  "preferredTime": "10:00",
  "duration": 60
}
```

**Response**

```json
{
  "sessions": [ /* array of created sessions */ ],
  "summary": {
    "total": 24,
    "scheduled": 22,
    "conflicts": 2
  }
}
```

---

### Proposals

#### List Proposals

**`GET /api/proposals`**

Get therapy proposals.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `patientId` | uuid | Filter by patient |

**Response**

```json
{
  "proposals": [
    {
      "id": "uuid",
      "patient": { /* patient object */ },
      "status": "PENDING",
      "totalCost": 5000,
      "services": [ /* array of services */ ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Proposal

**`POST /api/proposals`**

Create a new therapy proposal.

**Request Body**

```json
{
  "patientId": "uuid",
  "consultationId": "uuid",
  "services": [
    {
      "serviceId": "uuid",
      "sessions": 12,
      "frequency": "WEEKLY"
    }
  ],
  "notes": "Treatment plan notes"
}
```

**Response**

```json
{
  "proposal": { /* created proposal object */ }
}
```

---

### Reports

#### List Report Templates

**`GET /api/reports?action=templates`**

Get available report templates.

**Response**

```json
{
  "templates": [
    {
      "id": "user-activity",
      "name": "User Activity Report",
      "description": "...",
      "category": "users",
      "filters": [ /* available filters */ ]
    }
  ]
}
```

#### Execute Report

**`GET /api/reports?action=execute&templateId=<id>`**

Execute a report and get results.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `templateId` | string | Report template ID |
| `startDate` | date | Filter start date |
| `endDate` | date | Filter end date |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response**

```json
{
  "data": [ /* report data rows */ ],
  "totalCount": 100,
  "executionTime": 245,
  "metadata": {
    "columns": [ /* column definitions */ ],
    "filters": [ /* applied filters */ ],
    "generatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Analytics

#### Real-Time Metrics

**`GET /api/analytics/real-time?type=metrics`**

Get real-time system metrics.

**Response**

```json
{
  "activeUsers": 45,
  "activeSessions": 12,
  "todayAppointments": 28,
  "pendingRequests": 5,
  "revenue": {
    "today": 2500,
    "month": 45000
  }
}
```

#### Chart Data

**`GET /api/analytics/real-time?type=chart&metric=<metric>&period=<period>`**

Get time-series data for charts.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `metric` | string | Metric name (users, sessions, revenue) |
| `period` | string | Time period (1h, 24h, 7d, 30d) |

**Response**

```json
{
  "dataPoints": [
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "value": 42,
      "label": "10:00 AM"
    }
  ]
}
```

---

### Audit Logs

#### List Audit Logs

**`GET /api/audit`**

Get audit log entries with filtering.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `userId` | uuid | Filter by user |
| `action` | string | Filter by action |
| `resource` | string | Filter by resource |
| `severity` | string | Filter by severity |
| `success` | boolean | Filter by success |
| `startDate` | date | Filter start date |
| `endDate` | date | Filter end date |

**Response**

```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "USER_CREATED",
      "resource": "user",
      "resourceId": "uuid",
      "userId": "uuid",
      "user": {
        "email": "user@example.com",
        "name": "John Doe"
      },
      "severity": "INFO",
      "success": true,
      "ipAddress": "192.168.1.1",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

#### Get Audit Statistics

**`GET /api/audit/stats`**

Get audit log statistics.

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | date | Filter start date |
| `endDate` | date | Filter end date |
| `userId` | uuid | Filter by user |

**Response**

```json
{
  "totalLogs": 1000,
  "successfulActions": 950,
  "failedActions": 50,
  "successRate": 95,
  "actionsByType": [
    {
      "action": "USER_CREATED",
      "_count": 100
    }
  ],
  "severityDistribution": [
    {
      "severity": "INFO",
      "_count": 800
    }
  ]
}
```

---

### File Management

#### Upload File

**`POST /api/upload`**

Upload a file to storage.

**Request Body** (multipart/form-data)

```
file: <binary>
bucket: "avatars" | "files" | "documents" | "reports"
path: "optional/path/prefix"
```

**Validation**

- Max file size: 10MB (avatars), 50MB (documents), 100MB (files)
- Allowed types: images, PDFs, documents
- Automatic virus scanning (if configured)

**Response**

```json
{
  "url": "https://storage.example.com/...",
  "path": "path/to/file.pdf",
  "size": 1024000,
  "mimeType": "application/pdf"
}
```

---

## Testing

### Using curl

```bash
# Get current user
curl -X GET http://localhost:3000/api/user \
  -H "Cookie: sb-access-token=<token>"

# Create patient
curl -X POST http://localhost:3000/api/patients \
  -H "Cookie: sb-access-token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "dateOfBirth": "2000-01-01",
    "gender": "MALE"
  }'
```

### Using JavaScript/TypeScript

```typescript
// Fetch API
const response = await fetch('/api/user', {
  method: 'GET',
  credentials: 'include' // Include cookies
})

const data = await response.json()

// With error handling
try {
  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      name: 'John Doe',
      dateOfBirth: '2000-01-01',
      gender: 'MALE'
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error.message)
  }

  const data = await response.json()
  console.log('Created patient:', data.patient)
} catch (error) {
  console.error('Error:', error)
}
```

---

## Best Practices

### Pagination

- Always use pagination for list endpoints
- Default page size: 20 items
- Maximum page size: 100 items

### Filtering

- Use query parameters for filtering
- Combine multiple filters with AND logic
- Date filters use ISO 8601 format

### Error Handling

- Always check response status codes
- Parse error responses for details
- Implement retry logic for 5xx errors
- Respect rate limit headers

### Performance

- Cache responses when appropriate
- Use bulk operations for multiple items
- Implement request debouncing
- Monitor response times

### Security

- Never expose authentication tokens
- Validate all input data
- Use HTTPS in production
- Implement CSRF protection

---

## Support

For API support and questions:
- Email: api-support@example.com
- Documentation: https://docs.example.com
- GitHub Issues: https://github.com/example/repo/issues

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- User management endpoints
- Patient management endpoints
- Session scheduling endpoints
- Proposal management endpoints
- Reports and analytics endpoints
- Audit logging endpoints
- File upload endpoints
