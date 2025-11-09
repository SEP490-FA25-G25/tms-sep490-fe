# Frontend Handoff: Create Class Workflow

**Feature Name:** Create Class (7-Step Workflow)  
**API Version:** v1  
**Last Updated:** November 9, 2025  
**Backend Contact:** TMS Backend Team

---

## 1. Feature Overview

The Create Class workflow enables Academic Affairs staff to create new classes through a **7-step guided process**: (1) Create class with DRAFT status, (2) Auto-generate sessions, (3) Assign time slots, (4) Assign resources (HYBRID approach), (5) Assign teachers (PRE-CHECK approach), (6) Validate completeness, and (7) Submit for Center Head approval. The workflow uses **optimized algorithms** (HYBRID bulk insert for resources, PRE-CHECK CTE query for teachers) to handle 36+ sessions efficiently while providing detailed conflict reporting for manual resolution.

**User Roles:** ACADEMIC_AFFAIR (all steps), CENTER_HEAD (approval only)

---

## 2. API Endpoints

### Core Create Class Workflow

| Endpoint                                       | Method | Description                                   | Required Role   | Success Status |
| ---------------------------------------------- | ------ | --------------------------------------------- | --------------- | -------------- |
| `/api/v1/classes`                              | POST   | STEP 1: Create class with DRAFT status        | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/time-slots`         | POST   | STEP 3: Assign time slots by day of week      | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/resources`          | POST   | STEP 4: Assign resources (HYBRID approach)    | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/available-teachers` | GET    | STEP 5A: Query available teachers (PRE-CHECK) | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/teachers`           | POST   | STEP 5B: Assign teacher to sessions           | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/validate`           | POST   | STEP 6: Validate class completeness           | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/submit`             | POST   | STEP 7: Submit for approval                   | ACADEMIC_AFFAIR | 200            |

### Query Endpoints

| Endpoint                             | Method | Description                   | Required Role   | Success Status |
| ------------------------------------ | ------ | ----------------------------- | --------------- | -------------- |
| `/api/v1/classes`                    | GET    | Get classes list with filters | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}`          | GET    | Get class details             | ACADEMIC_AFFAIR | 200            |
| `/api/v1/classes/{classId}/sessions` | GET    | Get class sessions            | ACADEMIC_AFFAIR | 200            |

---

## 3. Request/Response DTOs

### STEP 1: Create Class

**POST `/api/v1/classes`**

```json
// Request
{
  "branchId": 1,                    // Long (required) - Branch ID
  "courseId": 2,                    // Long (required) - Course ID
  "code": "CS101-A-2025",           // String (required) - Class code (uppercase, numbers, hyphens)
  "name": "Computer Science 101",   // String (required) - Class name
  "modality": "OFFLINE",            // Enum (required) - ONLINE/OFFLINE/HYBRID
  "startDate": "2025-01-15",        // LocalDate (required) - Must be future date
  "scheduleDays": [1, 3, 5],        // List<Short> (required) - Day of week: 0=Sun, 1=Mon, ..., 6=Sat
  "maxCapacity": 30                 // Integer (required) - 1-1000
}

// Response (200 OK)
{
  "success": true,
  "message": "Class CS101-A-2025 created successfully with 36 sessions generated",
  "data": {
    "classId": 123,
    "code": "CS101-A-2025",
    "name": "Computer Science 101",
    "status": "DRAFT",
    "sessionSummary": {
      "sessionsGenerated": 36,
      "startDate": "2025-01-15",
      "endDate": "2025-05-15",
      "daysOfWeek": [1, 3, 5]
    }
  }
}
```

---

### STEP 3: Assign Time Slots

**POST `/api/v1/classes/{classId}/time-slots`**

```json
// Request
{
  "assignments": [
    {
      "dayOfWeek": 1,                // Short (required) - 0=Sun, 1=Mon, ..., 6=Sat
      "timeSlotTemplateId": 5        // Long (required) - Time slot template ID
    },
    {
      "dayOfWeek": 3,
      "timeSlotTemplateId": 5
    },
    {
      "dayOfWeek": 5,
      "timeSlotTemplateId": 6
    }
  ]
}

// Response (200 OK)
{
  "success": true,
  "message": "Time slots assigned: 36/36 sessions successful",
  "data": {
    "successCount": 36,
    "failedCount": 0,
    "totalSessions": 36,
    "assignments": [
      {
        "dayOfWeek": 1,
        "sessionsAssigned": 12,
        "timeSlotName": "Morning (8:00-10:00)"
      }
    ]
  }
}
```

---

### STEP 4: Assign Resources (HYBRID Approach)

**POST `/api/v1/classes/{classId}/resources`**

```json
// Request
{
  "pattern": [
    {
      "dayOfWeek": 1,                // Short (required) - 0=Sun, 1=Mon, ..., 6=Sat
      "resourceId": 101              // Long (required) - Resource ID (room/online)
    },
    {
      "dayOfWeek": 3,
      "resourceId": 101
    },
    {
      "dayOfWeek": 5,
      "resourceId": 102
    }
  ]
}

// Response (200 OK - Full Success)
{
  "success": true,
  "message": "All 36 sessions assigned successfully in 142ms",
  "data": {
    "successCount": 36,
    "conflictCount": 0,
    "totalSessions": 36,
    "conflicts": [],
    "processingTimeMs": 142
  }
}

// Response (200 OK - Partial Success with Conflicts)
{
  "success": true,
  "message": "Resources assigned: 32/36 sessions successful, 4 conflicts requiring manual resolution (158ms)",
  "data": {
    "successCount": 32,
    "conflictCount": 4,
    "totalSessions": 36,
    "conflicts": [
      {
        "sessionId": 5,
        "sessionDate": "2025-01-15",
        "dayOfWeek": "MONDAY",
        "conflictReason": "CAPACITY_EXCEEDED",      // CAPACITY_EXCEEDED / BOOKING_CONFLICT / UNKNOWN
        "requestedCapacity": 30,
        "availableCapacity": 25,
        "resourceId": 101,
        "resourceName": "Room A101",
        "conflictingClasses": ["CS102-B", "CS103-A"]
      }
    ],
    "processingTimeMs": 158
  }
}
```

**⚠️ Frontend Action Required:** If `conflictCount > 0`, display conflicts to user and allow manual resolution via individual session assignment APIs.

---

### STEP 5A: Query Available Teachers (PRE-CHECK)

**GET `/api/v1/classes/{classId}/available-teachers`**

```json
// No request body

// Response (200 OK)
{
  "success": true,
  "message": "Found 5 teachers. Use POST /classes/{classId}/teachers to assign.",
  "data": [
    {
      "teacherId": 101,
      "teacherName": "John Smith",
      "email": "john.smith@tms.edu",
      "skills": ["JAVA", "SPRING_BOOT"],
      "yearsExperience": 5,
      "availabilityStatus": "FULLY_AVAILABLE", // FULLY_AVAILABLE / PARTIALLY_AVAILABLE / UNAVAILABLE
      "availableSessions": 36,
      "totalSessions": 36,
      "availabilityPercentage": 100.0,
      "conflictBreakdown": {
        "noAvailability": 0, // Count of sessions: no registered availability
        "teachingConflict": 0, // Count of sessions: already teaching another class
        "leaveConflict": 0, // Count of sessions: on leave
        "skillMismatch": 0 // Count of sessions: missing required skill
      },
      "conflictingSessions": []
    },
    {
      "teacherId": 102,
      "teacherName": "Jane Doe",
      "email": "jane.doe@tms.edu",
      "skills": ["GENERAL"], // GENERAL = universal skill (bypasses all checks)
      "yearsExperience": 8,
      "availabilityStatus": "PARTIALLY_AVAILABLE",
      "availableSessions": 32,
      "totalSessions": 36,
      "availabilityPercentage": 88.9,
      "conflictBreakdown": {
        "noAvailability": 0,
        "teachingConflict": 4,
        "leaveConflict": 0,
        "skillMismatch": 0
      },
      "conflictingSessions": [
        {
          "sessionId": 5,
          "sessionDate": "2025-01-15",
          "sessionNumber": 5,
          "conflictReason": "TEACHING_CONFLICT", // NO_AVAILABILITY / TEACHING_CONFLICT / LEAVE_CONFLICT / SKILL_MISMATCH
          "conflictDetails": "Teaching CS102-B at same time"
        }
      ]
    }
  ]
}
```

**🎯 UI Recommendation:** Sort teachers by `availabilityPercentage` (descending) and highlight `FULLY_AVAILABLE` teachers in green.

---

### STEP 5B: Assign Teacher

**POST `/api/v1/classes/{classId}/teachers`**

```json
// Request (Full Assignment - assign to ALL sessions)
{
  "teacherId": 101                  // Long (required) - Teacher ID
  // sessionIds: null or omitted = Full Assignment
}

// Request (Partial Assignment - assign to specific sessions)
{
  "teacherId": 102,
  "sessionIds": [1, 2, 3, 4, 5]     // List<Long> (optional) - Specific session IDs
}

// Response (200 OK - Full Assignment)
{
  "success": true,
  "message": "Teacher assigned to all 36 sessions successfully in 42ms",
  "data": {
    "assignedCount": 36,
    "assignedSessionIds": [1, 2, 3, "..."],
    "needsSubstitute": false,
    "remainingSessions": 0,
    "remainingSessionIds": [],
    "processingTimeMs": 42
  }
}

// Response (200 OK - Partial Assignment)
{
  "success": true,
  "message": "Teacher assigned to 12 sessions. 24 sessions still need assignment (38ms)",
  "data": {
    "assignedCount": 12,
    "assignedSessionIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "needsSubstitute": true,
    "remainingSessions": 24,
    "remainingSessionIds": [13, 14, 15, "..."],
    "processingTimeMs": 38
  }
}
```

**⚠️ Frontend Action Required:** If `needsSubstitute = true`, prompt user to assign another teacher to remaining sessions.

---

### STEP 6: Validate Class

**POST `/api/v1/classes/{classId}/validate`**

```json
// No request body

// Response (200 OK - Valid)
{
  "success": true,
  "message": "Class is valid and ready for submission",
  "data": {
    "isValid": true,
    "validationSummary": {
      "totalSessions": 36,
      "sessionsWithTimeSlots": 36,
      "sessionsWithResources": 36,
      "sessionsWithTeachers": 36
    },
    "missingAssignments": []
  }
}

// Response (200 OK - Invalid)
{
  "success": false,
  "message": "Class validation failed: 4 sessions missing assignments",
  "data": {
    "isValid": false,
    "validationSummary": {
      "totalSessions": 36,
      "sessionsWithTimeSlots": 36,
      "sessionsWithResources": 32,
      "sessionsWithTeachers": 36
    },
    "missingAssignments": [
      {
        "sessionId": 5,
        "sessionDate": "2025-01-15",
        "missingFields": ["resource"]
      }
    ]
  }
}
```

---

### STEP 7: Submit for Approval

**POST `/api/v1/classes/{classId}/submit`**

```json
// No request body

// Response (200 OK)
{
  "success": true,
  "message": "Class CS101-A-2025 submitted for approval",
  "data": {
    "classId": 123,
    "code": "CS101-A-2025",
    "status": "SCHEDULED",
    "approvalStatus": "PENDING",
    "submittedAt": "2025-01-10T14:30:00",
    "approverRole": "CENTER_HEAD"
  }
}
```

---

## 4. Validation Rules & Error Handling

### Field Validation (400 Bad Request)

**Create Class Request:**

- `branchId`: Required, must exist in database
- `courseId`: Required, must exist in database
- `code`: Required, max 50 chars, uppercase letters/numbers/hyphens only, must be unique
- `name`: Required, max 255 chars
- `modality`: Required, enum: `ONLINE` | `OFFLINE` | `HYBRID`
- `startDate`: Required, must be future date
- `scheduleDays`: Required, 1-7 items, values 0-6 (0=Sunday, 6=Saturday)
- `maxCapacity`: Required, 1-1000

**Assign Resources Request:**

- `pattern`: Required, 1-7 items
- `pattern[].dayOfWeek`: Required, 0-6
- `pattern[].resourceId`: Required, positive number, must exist

**Assign Teacher Request:**

- `teacherId`: Required, positive number, must exist
- `sessionIds`: Optional, if provided must have at least 1 item

### Error Response Format

```json
// 400 - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "code": "must not be blank",
    "maxCapacity": "must be greater than 0",
    "scheduleDays": "must not be empty"
  }
}

// 400 - Business Logic Error
{
  "success": false,
  "message": "Cannot assign resources: class status must be DRAFT",
  "data": null
}

// 404 - Not Found
{
  "success": false,
  "message": "Class with ID 999 not found",
  "data": null
}

// 401 - Unauthorized
{
  "success": false,
  "message": "Invalid username or password",
  "data": null
}

// 403 - Forbidden
{
  "success": false,
  "message": "Access denied - insufficient permissions",
  "data": null
}
```

---

## 5. Business Rules & Logic

### Class Status Transitions

```
DRAFT → SCHEDULED (via submit for approval)
SCHEDULED → ONGOING (automatically on start date)
ONGOING → COMPLETED (automatically on end date)
Any status → CANCELLED (manual action)
```

### Approval Status

- `PENDING`: Submitted, waiting for CENTER_HEAD review
- `APPROVED`: Center Head approved, class can start
- `REJECTED`: Center Head rejected, back to DRAFT for revision

### Resource Assignment (STEP 4) - HYBRID Approach

- **Phase 1 (SQL Bulk Insert):** Fast assignment for ~90% sessions without conflicts
- **Phase 2 (Java Analysis):** Detailed conflict detection for remaining ~10% sessions
- **Performance Target:** <200ms for 36 sessions
- **Conflict Types:**
  - `CAPACITY_EXCEEDED`: Resource capacity < class capacity
  - `BOOKING_CONFLICT`: Resource already booked by another class at same time
  - `UNKNOWN`: Other conflicts

### Teacher Assignment (STEP 5) - PRE-CHECK Approach

- **PRE-CHECK:** Query shows ALL teachers with availability BEFORE assignment
- **4 Conflict Checks:**
  1. Teacher has registered availability for time slot
  2. Teacher not teaching another class at same time
  3. Teacher not on leave
  4. Teacher has required skills (or has GENERAL skill = universal bypass)
- **Performance Target:** <100ms for 10 teachers × 36 sessions (query), <50ms for bulk assignment
- **GENERAL Skill:** Universal skill that bypasses all skill checks

### Validation Rules (STEP 6)

- All sessions must have time slots assigned
- All sessions must have resources assigned
- All sessions must have teachers assigned
- Class must be in DRAFT status
- If validation fails, cannot submit for approval

---

## 6. Flow Sequence

### Complete 7-Step Workflow

```
1. Create Class (POST /classes)
   ↓ Receives classId: 123, status: DRAFT
   ↓ Backend auto-generates 36 sessions (STEP 2)

2. (Optional) Get Sessions (GET /classes/123/sessions)
   ↓ View generated sessions before assignment

3. Assign Time Slots (POST /classes/123/time-slots)
   ↓ Assign time slots by day of week pattern
   ↓ Example: Monday → Morning slot, Wednesday → Morning slot, Friday → Afternoon slot

4. Assign Resources (POST /classes/123/resources)
   ↓ HYBRID approach: Fast bulk assignment + detailed conflict analysis
   ↓ If conflicts exist (conflictCount > 0):
   ↓   → Display conflicts to user
   ↓   → User resolves manually via individual session APIs
   ↓   → Retry assignment for remaining sessions

5A. Query Available Teachers (GET /classes/123/available-teachers)
    ↓ PRE-CHECK: Shows ALL teachers with availability metrics
    ↓ Frontend displays sorted list (by availability %)
    ↓ User selects teacher (preferably FULLY_AVAILABLE)

5B. Assign Teacher (POST /classes/123/teachers)
    ↓ Full Assignment (all sessions) or Partial Assignment (specific sessions)
    ↓ If needsSubstitute = true:
    ↓   → Repeat step 5A-5B for remaining sessions

6. Validate Class (POST /classes/123/validate)
   ↓ Check all assignments complete
   ↓ If isValid = false:
   ↓   → Display missing assignments
   ↓   → User completes missing assignments
   ↓   → Retry validation

7. Submit for Approval (POST /classes/123/submit)
   ↓ Status: DRAFT → SCHEDULED
   ↓ Approval Status: → PENDING
   ↓ Workflow complete, awaits CENTER_HEAD approval
```

---

## 7. Implementation Notes for Frontend

### Required Headers

```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### Pagination (for GET /classes)

```javascript
// Query Parameters
?page=0              // 0-based page number
&size=20             // Items per page (default: 20)
&sort=startDate      // Sort field
&sortDirection=desc  // Sort direction: asc/desc

// Response Format
{
  "success": true,
  "message": "Found 45 classes",
  "data": {
    "content": [ /* class items */ ],
    "page": 0,
    "size": 20,
    "totalElements": 45,
    "totalPages": 3,
    "last": false
  }
}
```

### Enums Reference

**Modality:**

- `ONLINE`: Online classes (requires online account resource)
- `OFFLINE`: In-person classes (requires physical room resource)
- `HYBRID`: Mixed online/offline (flexible resource type)

**ClassStatus:**

- `DRAFT`: Being created, not submitted
- `SCHEDULED`: Submitted and approved, waiting to start
- `ONGOING`: Currently in progress
- `COMPLETED`: Finished
- `CANCELLED`: Cancelled (can be cancelled from any status)

**ApprovalStatus:**

- `PENDING`: Waiting for approval
- `APPROVED`: Approved by CENTER_HEAD
- `REJECTED`: Rejected by CENTER_HEAD

**AvailabilityStatus (Teachers):**

- `FULLY_AVAILABLE`: Available for all sessions (100%)
- `PARTIALLY_AVAILABLE`: Available for some sessions (1-99%)
- `UNAVAILABLE`: Not available for any session (0%)

**ConflictReason (Resources):**

- `CAPACITY_EXCEEDED`: Room too small for class size
- `BOOKING_CONFLICT`: Room already booked by another class
- `UNKNOWN`: Other conflicts

**ConflictReason (Teachers):**

- `NO_AVAILABILITY`: Teacher hasn't registered availability
- `TEACHING_CONFLICT`: Already teaching another class
- `LEAVE_CONFLICT`: Teacher is on leave
- `SKILL_MISMATCH`: Teacher lacks required skills

### Day of Week Format

```javascript
// PostgreSQL DOW format (used in all APIs)
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday

// Helper function for display
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const getDayName = (dow) => DAY_NAMES[dow];
```

### Performance Expectations

- STEP 1 (Create): ~500ms (creates class + generates 36 sessions)
- STEP 3 (Time Slots): ~100ms (pattern-based assignment)
- STEP 4 (Resources): ~150ms (HYBRID: bulk insert + conflict analysis)
- STEP 5A (Query Teachers): ~80ms (PRE-CHECK CTE query for 10 teachers)
- STEP 5B (Assign Teacher): ~40ms (bulk INSERT)
- STEP 6 (Validate): ~50ms (check completeness)
- STEP 7 (Submit): ~100ms (status transition)

**⚡ Total Workflow Time:** ~1 second (excluding user think time)

### Loading States

- Show loading spinner during API calls
- For STEP 4 (Resources), show processing message: "Assigning resources to 36 sessions..."
- For STEP 5A (Query Teachers), show processing message: "Analyzing teacher availability for 36 sessions..."
- Display `processingTimeMs` from response for transparency

### Error Handling Strategy

```javascript
try {
  const response = await fetch("/api/v1/classes/123/resources", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 400) {
      // Validation error or business logic error
      if (result.data && typeof result.data === "object") {
        // Field-level validation errors
        displayFieldErrors(result.data);
      } else {
        // Business logic error
        showError(result.message);
      }
    } else if (response.status === 404) {
      showError("Resource not found: " + result.message);
    } else if (response.status === 401) {
      // Redirect to login
      redirectToLogin();
    } else if (response.status === 403) {
      showError("Access denied. You do not have permission for this action.");
    }
    return;
  }

  // Success - check for conflicts in STEP 4
  if (result.data.conflictCount > 0) {
    displayConflicts(result.data.conflicts);
    promptManualResolution();
  } else {
    showSuccess(result.message);
  }
} catch (error) {
  showError("Network error. Please try again.");
}
```

---

## 8. Testing Examples

### Example 1: Complete Workflow (Happy Path)

```bash
# STEP 1: Create Class
curl -X POST http://localhost:8080/api/v1/classes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": 1,
    "courseId": 2,
    "code": "CS101-A-2025",
    "name": "Computer Science 101",
    "modality": "OFFLINE",
    "startDate": "2025-01-15",
    "scheduleDays": [1, 3, 5],
    "maxCapacity": 30
  }'

# Save classId from response (e.g., 123)

# STEP 3: Assign Time Slots
curl -X POST http://localhost:8080/api/v1/classes/123/time-slots \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [
      {"dayOfWeek": 1, "timeSlotTemplateId": 5},
      {"dayOfWeek": 3, "timeSlotTemplateId": 5},
      {"dayOfWeek": 5, "timeSlotTemplateId": 6}
    ]
  }'

# STEP 4: Assign Resources
curl -X POST http://localhost:8080/api/v1/classes/123/resources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": [
      {"dayOfWeek": 1, "resourceId": 101},
      {"dayOfWeek": 3, "resourceId": 101},
      {"dayOfWeek": 5, "resourceId": 102}
    ]
  }'

# STEP 5A: Query Available Teachers
curl -X GET http://localhost:8080/api/v1/classes/123/available-teachers \
  -H "Authorization: Bearer <token>"

# Save teacherId from response (e.g., 101)

# STEP 5B: Assign Teacher (Full Assignment)
curl -X POST http://localhost:8080/api/v1/classes/123/teachers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": 101
  }'

# STEP 6: Validate Class
curl -X POST http://localhost:8080/api/v1/classes/123/validate \
  -H "Authorization: Bearer <token>"

# STEP 7: Submit for Approval
curl -X POST http://localhost:8080/api/v1/classes/123/submit \
  -H "Authorization: Bearer <token>"
```

### Example 2: Handle Resource Conflicts

```bash
# STEP 4: Assign Resources (returns conflicts)
curl -X POST http://localhost:8080/api/v1/classes/123/resources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": [
      {"dayOfWeek": 1, "resourceId": 101},
      {"dayOfWeek": 3, "resourceId": 101},
      {"dayOfWeek": 5, "resourceId": 102}
    ]
  }'

# Response shows 4 conflicts
# Frontend displays conflicts to user
# User manually resolves conflicts using individual session APIs
# (See individual session APIs in separate documentation)
```

### Example 3: Partial Teacher Assignment

```bash
# STEP 5B: Assign teacher to specific sessions only
curl -X POST http://localhost:8080/api/v1/classes/123/teachers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": 102,
    "sessionIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }'

# Response shows needsSubstitute = true
# Frontend prompts user to assign another teacher to remaining 24 sessions

# Assign second teacher to remaining sessions
curl -X POST http://localhost:8080/api/v1/classes/123/teachers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherId": 103,
    "sessionIds": [13, 14, 15, "..."]
  }'
```

---

## 9. Additional Resources

### Swagger UI

- **URL:** http://localhost:8080/swagger-ui.html
- **Section:** Class Management
- **Features:**
  - Try-it-out functionality for all endpoints
  - Complete request/response examples
  - Error response examples (404/400/401/403)
  - Schema documentation

### Backend Documentation

- **Implementation Guide:** `docs/create-class/create-class-implementation-plan.md`
- **Workflow Diagram:** `docs/create-class/create-class-workflow-final.md`
- **OpenAPI Review:** `docs/create-class/review/phase-3.6-openapi-review-findings.md`
- **Test Coverage:** 256 tests (143 unit + 39 API + 74 other)

### Contact

- **Backend Team:** tms-backend@example.com
- **API Issues:** Create ticket in Jira under TMS-API project
- **Slack Channel:** #tms-backend-support

---

## 10. Quick Reference

### HTTP Status Codes

- `200 OK`: Success (even with conflicts in STEP 4)
- `400 Bad Request`: Validation error or business logic error
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions (requires ACADEMIC_AFFAIR role)
- `404 Not Found`: Resource not found (class, teacher, resource, etc.)
- `500 Internal Server Error`: Server error (contact backend team)

### Common Pitfalls

1. **Wrong day of week format:** Use 0-6 (PostgreSQL), not 1-7
2. **Missing Authorization header:** All endpoints require JWT token
3. **Validating before completing assignments:** STEP 6 will fail if any assignment missing
4. **Not handling conflicts in STEP 4:** Must check `conflictCount` and prompt manual resolution
5. **Not checking `needsSubstitute` in STEP 5B:** Partial assignments require additional teachers

### Success Criteria Checklist

- [ ] User can create class with valid data (STEP 1)
- [ ] 36 sessions auto-generated (backend handles STEP 2)
- [ ] User can assign time slots by day pattern (STEP 3)
- [ ] User can assign resources with conflict handling (STEP 4)
- [ ] User can view teacher availability before assignment (STEP 5A)
- [ ] User can assign teacher (full or partial) (STEP 5B)
- [ ] User can validate class before submission (STEP 6)
- [ ] User can submit class for approval (STEP 7)
- [ ] Error messages are clear and actionable
- [ ] Loading states provide feedback during operations

---

**End of Frontend Handoff Documentation**

**Next Step:** Implement frontend UI for 7-step workflow with progress indicator and conflict resolution dialogs.
