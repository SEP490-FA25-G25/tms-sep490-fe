# Frontend Handoff Documentation Index

This directory contains comprehensive API documentation for frontend integration with TMS Backend APIs.

---

## Available Documentation

### 1. [Create Class Workflow](./create-class-workflow.md) ✅ **NEW**

**Status:** Complete  
**Last Updated:** November 9, 2025  
**Coverage:** Full 7-step workflow for creating classes

**Features:**

- Complete API endpoints (POST /classes, time-slots, resources, teachers, etc.)
- Request/Response DTOs with validation rules
- HYBRID resource assignment approach
- PRE-CHECK teacher availability query
- Error handling with examples
- Complete curl test examples

**User Roles:** ACADEMIC_AFFAIR (create), CENTER_HEAD (approve)

**Endpoints:** 8 endpoints (7 workflow steps + 1 query)

---

## Quick Start

### Prerequisites

1. **JWT Token:** Obtain from `/api/v1/auth/login`
2. **Swagger UI:** http://localhost:8080/swagger-ui.html
3. **Base URL:** http://localhost:8080/api/v1

### Authentication

All endpoints require JWT Bearer token:

```javascript
headers: {
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### Common Response Format

```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { /* response data */ }
}
```

---

## API Documentation Standards

All handoff documents follow this structure:

1. **Feature Overview** - What the feature does, who can use it
2. **API Endpoints Table** - Quick reference for all endpoints
3. **Request/Response DTOs** - Complete JSON examples
4. **Validation Rules** - Field constraints and error scenarios
5. **Business Rules** - Important logic and state transitions
6. **Flow Sequence** - Step-by-step workflow
7. **Implementation Notes** - Headers, pagination, enums, performance
8. **Testing Examples** - Curl commands for manual testing

---

## Enums Reference

### Common Enums Across Features

**Modality:**

- `ONLINE` - Online classes
- `OFFLINE` - In-person classes
- `HYBRID` - Mixed online/offline

**ClassStatus:**

- `DRAFT` - Being created
- `SCHEDULED` - Approved, waiting to start
- `ONGOING` - In progress
- `COMPLETED` - Finished
- `CANCELLED` - Cancelled

**ApprovalStatus:**

- `PENDING` - Waiting for approval
- `APPROVED` - Approved
- `REJECTED` - Rejected

**Day of Week (PostgreSQL format):**

- `0` = Sunday
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday

---

## Development Workflow

### 1. Review Documentation

- Read feature handoff document thoroughly
- Understand business rules and validation constraints
- Note required user roles and permissions

### 2. Test Endpoints Manually

- Use Swagger UI: http://localhost:8080/swagger-ui.html
- Or use provided curl examples
- Verify request/response formats
- Test error scenarios (400/401/403/404)

### 3. Implement Frontend

- Create API service layer with typed interfaces
- Implement error handling for all status codes
- Add loading states for async operations
- Display validation errors to users
- Handle business logic errors gracefully

### 4. Integration Testing

- Test complete workflows end-to-end
- Verify error messages are user-friendly
- Test edge cases and conflict scenarios
- Ensure proper authentication handling

---

## Error Handling Guidelines

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": null | { "field": "error message" }
}
```

### HTTP Status Codes

- **200 OK:** Success
- **400 Bad Request:** Validation error or business logic error
- **401 Unauthorized:** Missing or invalid JWT token → Redirect to login
- **403 Forbidden:** Insufficient permissions → Show "Access Denied"
- **404 Not Found:** Resource not found → Show "Not Found" message
- **500 Internal Server Error:** Server error → Show generic error + contact support

### Validation Errors (400 with field-level errors)

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "code": "must not be blank",
    "maxCapacity": "must be greater than 0",
    "scheduleDays": "must not be empty"
  }
}
```

**Frontend Action:** Display field-level errors next to form inputs.

---

## Performance Expectations

### API Response Times (Target)

- Create operations: ~100-500ms
- Query operations: ~50-100ms
- Bulk operations (36 sessions): ~150-200ms
- CTE queries (teacher availability): ~80-100ms

### Loading States

- Show spinner for operations > 100ms
- Display processing message for bulk operations
- Show `processingTimeMs` from response for transparency

---

## Support & Contact

### Backend Team

- **Email:** tms-backend@example.com
- **Slack:** #tms-backend-support
- **Jira:** TMS-API project

### Documentation Issues

- **GitHub:** Create issue in tms-sep490-be repository
- **Label:** `documentation`, `frontend-handoff`

### API Issues

- **GitHub:** Create issue in tms-sep490-be repository
- **Label:** `bug`, `api`
- **Include:** Request/response JSON, error message, expected behavior

---

## Changelog

### November 9, 2025

- ✅ **Added:** Create Class Workflow documentation
  - Complete 7-step workflow
  - HYBRID resource assignment approach
  - PRE-CHECK teacher availability query
  - 20+ JSON examples
  - Curl test commands

---

## Future Documentation (Planned)

### Phase 4 Features (Coming Soon)

- [ ] Student Enrollment Workflow
- [ ] Attendance Management
- [ ] Teacher Request Management
- [ ] Class Schedule View

### Additional Features

- [ ] User Management
- [ ] Center/Branch Management
- [ ] Course/Curriculum Management
- [ ] Resource Management

---

**Last Updated:** November 9, 2025  
**Maintained By:** TMS Backend Team  
**Version:** 1.0
