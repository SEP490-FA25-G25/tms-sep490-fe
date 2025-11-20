# CENTER HEAD APPROVAL WORKFLOW - FRONTEND HANDOFF

**Date:** November 19, 2025  
**Backend Version:** Feature/create-class branch  
**Target Role:** CENTER_HEAD

---

## 📋 OVERVIEW

Center Head có thể:
1. ✅ **Xem tất cả lớp** của chi nhánh mình quản lý (giống Academic Staff)
2. ✅ **Filter lớp chờ duyệt** (approvalStatus=PENDING)
3. ✅ **Xem chi tiết** lớp để review trước khi approve/reject
4. ✅ **Approve** lớp → Status chuyển sang SCHEDULED (ready for enrollment)
5. ✅ **Reject** lớp với lý do → Status về DRAFT (Academic Staff sửa và submit lại)

---

## 🔐 AUTHENTICATION & AUTHORIZATION

**Role Required:** `CENTER_HEAD`

**Access Token Header:**
```
Authorization: Bearer <access_token>
```

**User Info từ JWT:**
- User ID (để audit approvedBy/decidedBy)
- Branch assignments (chỉ xem lớp của branch mình quản lý)

---

## 📊 WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    CENTER HEAD WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. Academic Staff submits class → approvalStatus = PENDING
                    ↓
2. Center Head sees class in "Pending Approval" list
                    ↓
3. Center Head clicks "View Details"
                    ↓
4. Review: Course, Schedule, Teachers, Resources, Sessions
                    ↓
                ┌───┴───┐
                │       │
        [APPROVE]     [REJECT]
                │       │
         status=SCHEDULED   status=DRAFT
         approvalStatus=   approvalStatus=
            APPROVED         REJECTED
                              + reason
```

---

## 🌐 API ENDPOINTS

### 1️⃣ GET Classes List (With Filtering)

**Endpoint:**
```
GET /api/v1/classes
```

**Authorization:** `CENTER_HEAD` or `ACADEMIC_AFFAIR`

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `branchIds` | Long[] | No | Filter by branch(s). Auto uses user's branches if omitted | `[1,2]` |
| `approvalStatus` | Enum | No | `PENDING`, `APPROVED`, `REJECTED` | `PENDING` |
| `status` | Enum | No | `DRAFT`, `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED` | `DRAFT` |
| `courseId` | Long | No | Filter by course | `5` |
| `modality` | Enum | No | `ONLINE`, `OFFLINE`, `HYBRID` | `OFFLINE` |
| `search` | String | No | Search in code, name, course, branch | `"English A1"` |
| `page` | Integer | No | Page number (0-based) | `0` |
| `size` | Integer | No | Page size | `20` |
| `sort` | String | No | Sort field | `submittedAt` |
| `sortDir` | String | No | `asc` or `desc` | `desc` |

**Use Case - Lấy danh sách lớp chờ duyệt:**
```javascript
const fetchPendingClasses = async () => {
  const response = await axios.get('/api/v1/classes', {
    params: {
      approvalStatus: 'PENDING',  // Chỉ lấy lớp chờ duyệt
      status: 'DRAFT',            // Status vẫn là DRAFT
      page: 0,
      size: 20,
      sort: 'submittedAt',        // Sort theo thời gian submit
      sortDir: 'desc'             // Mới nhất trước
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return response.data;
};
```

**Response Format:**
```json
{
  "success": true,
  "message": "Classes retrieved successfully",
  "data": {
    "content": [
      {
        "id": 101,
        "code": "IELTSFOUND-HCM01-25-001",
        "name": "IELTS Foundation - Morning",
        "courseName": "IELTS Foundation",
        "courseCode": "IELTSFOUND",
        "branchName": "Hồ Chí Minh - Quận 1",
        "branchCode": "HCM01",
        "modality": "OFFLINE",
        "startDate": "2025-01-06",
        "plannedEndDate": "2025-04-14",
        "status": "DRAFT",
        "approvalStatus": "PENDING",
        "maxCapacity": 20,
        "currentEnrolled": 0,
        "availableSlots": 20,
        "utilizationRate": 0.0,
        "teachers": [
          {
            "userId": 10,
            "fullName": "John Smith",
            "email": "john.smith@tms.edu.vn",
            "skills": ["Listening", "Reading"],
            "sessionsCount": 15
          }
        ],
        "scheduleSummary": "Mon, Wed, Fri (08:00-10:00)",
        "canEnrollStudents": false,
        "enrollmentRestrictionReason": "Class must be approved first"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "sort": { "sorted": true, "orders": [{"property": "submittedAt", "direction": "DESC"}] }
    },
    "totalElements": 5,
    "totalPages": 1,
    "first": true,
    "last": true
  }
}
```

---

### 2️⃣ GET Class Detail (For Review)

**Endpoint:**
```
GET /api/v1/classes/{classId}
```

**Authorization:** `CENTER_HEAD`, `ACADEMIC_AFFAIR`, or `STUDENT`

**Path Parameters:**
- `classId` (Long) - Class ID

**Use Case - Xem chi tiết lớp để review:**
```javascript
const fetchClassDetail = async (classId) => {
  const response = await axios.get(`/api/v1/classes/${classId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return response.data.data;
};
```

**Response Format:**
```json
{
  "success": true,
  "message": "Class details retrieved successfully",
  "data": {
    "id": 101,
    "code": "IELTSFOUND-HCM01-25-001",
    "name": "IELTS Foundation - Morning",
    
    "course": {
      "id": 5,
      "code": "IELTSFOUND",
      "name": "IELTS Foundation",
      "description": "Complete IELTS preparation course",
      "totalHours": 60,
      "durationWeeks": 14,
      "sessionPerWeek": 3
    },
    
    "branch": {
      "id": 1,
      "code": "HCM01",
      "name": "Hồ Chí Minh - Quận 1",
      "address": "123 Nguyễn Huệ, Q1, TP.HCM",
      "phone": "028-1234-5678",
      "email": "hcm01@tms.edu.vn"
    },
    
    "modality": "OFFLINE",
    "startDate": "2025-01-06",
    "plannedEndDate": "2025-04-14",
    "actualEndDate": null,
    "scheduleDays": [1, 3, 5],
    "maxCapacity": 20,
    
    "status": "DRAFT",
    "approvalStatus": "PENDING",
    "rejectionReason": null,
    
    "submittedAt": "2025-01-03",
    "decidedAt": null,
    "decidedByName": null,
    
    "room": "Room 101",
    
    "teachers": [
      {
        "userId": 10,
        "fullName": "John Smith",
        "email": "john.smith@tms.edu.vn",
        "skills": ["Listening", "Reading"],
        "sessionsCount": 15
      },
      {
        "userId": 11,
        "fullName": "Alice Brown",
        "email": "alice.brown@tms.edu.vn",
        "skills": ["Speaking"],
        "sessionsCount": 14
      },
      {
        "userId": 12,
        "fullName": "David Lee",
        "email": "david.lee@tms.edu.vn",
        "skills": ["Writing"],
        "sessionsCount": 13
      }
    ],
    
    "scheduleSummary": "Mon, Wed, Fri (08:00-10:00)",
    
    "enrollmentSummary": {
      "currentEnrolled": 0,
      "maxCapacity": 20,
      "availableSlots": 20,
      "utilizationRate": 0.0,
      "canEnrollStudents": false,
      "enrollmentRestrictionReason": "Class must be approved first"
    },
    
    "upcomingSessions": [
      {
        "id": 1001,
        "date": "2025-01-06",
        "startTime": "08:00",
        "endTime": "10:00",
        "teachers": [
          {
            "userId": 10,
            "fullName": "John Smith",
            "skills": ["Listening"]
          }
        ],
        "room": "Room 101",
        "status": "SCHEDULED",
        "type": "Regular"
      }
    ]
  }
}
```

**Display Sections:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 CLASS DETAIL - APPROVAL REVIEW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📘 Basic Information                                        │
│ ├── Class Code: IELTSFOUND-HCM01-25-001                     │
│ ├── Course: IELTS Foundation (60 hours, 14 weeks)           │
│ ├── Branch: Hồ Chí Minh - Quận 1                            │
│ ├── Modality: OFFLINE                                       │
│ └── Status: DRAFT (Pending Approval)                        │
│                                                             │
│ 📅 Schedule Information                                     │
│ ├── Start Date: Jan 6, 2025                                 │
│ ├── End Date: Apr 14, 2025 (14 weeks)                       │
│ ├── Days: Monday, Wednesday, Friday                         │
│ └── Time: 08:00 - 10:00                                     │
│                                                             │
│ 👥 Capacity & Enrollment                                    │
│ ├── Max Capacity: 20 students                               │
│ ├── Current Enrolled: 0 students                            │
│ └── Available Slots: 20                                     │
│                                                             │
│ 👨‍🏫 Teacher Assignment                                       │
│ ├── John Smith (Listening, Reading): 15 sessions            │
│ ├── Alice Brown (Speaking): 14 sessions                     │
│ └── David Lee (Writing): 13 sessions                        │
│                                                             │
│ 🏠 Resource Assignment                                      │
│ └── Room 101 (Primary)                                      │
│                                                             │
│ ⚠️ Validation Status                                         │
│ └── ✅ All requirements met, ready for approval             │
│                                                             │
│ [View All Sessions (42 total)]                              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟢 Approve   │   🔴 Reject                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

### 3️⃣ GET Sessions List (Detailed Review)

**Endpoint:**
```
GET /api/v1/classes/{classId}/sessions
```

**Authorization:** `CENTER_HEAD` or `ACADEMIC_AFFAIR`

**Query Parameters:**
- `dayOfWeek` (Integer, optional) - Filter by day (1=Mon, 2=Tue, ..., 7=Sun)

**Use Case - Xem toàn bộ sessions để verify:**
```javascript
const fetchAllSessions = async (classId) => {
  const response = await axios.get(`/api/v1/classes/${classId}/sessions`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return response.data.data;
};
```

**Response Format:**
```json
{
  "success": true,
  "message": "Sessions retrieved successfully",
  "data": {
    "classId": 101,
    "classCode": "IELTSFOUND-HCM01-25-001",
    "totalSessions": 42,
    "dateRange": {
      "firstSession": "2025-01-06",
      "lastSession": "2025-04-14"
    },
    "sessions": [
      {
        "id": 1001,
        "sessionNumber": 1,
        "date": "2025-01-06",
        "dayOfWeekVi": "Thứ Hai",
        "courseSessionName": "Introduction & Listening Part 1",
        "hasTimeSlot": true,
        "hasResource": true,
        "hasTeacher": true,
        "timeSlot": {
          "startTime": "08:00",
          "endTime": "10:00"
        },
        "resource": {
          "resourceId": 5,
          "resourceName": "Room 101"
        },
        "teachers": [
          {
            "userId": 10,
            "fullName": "John Smith",
            "skills": ["Listening"]
          }
        ]
      }
    ],
    "weeklyGrouping": [
      {
        "weekNumber": 1,
        "dateRange": "Jan 6 - Jan 12, 2025",
        "sessionCount": 3
      }
    ]
  }
}
```

---

### 4️⃣ POST Approve Class

**Endpoint:**
```
POST /api/v1/classes/{classId}/approve
```

**Authorization:** `CENTER_HEAD` only

**Path Parameters:**
- `classId` (Long) - Class ID to approve

**Request Body:** None

**Use Case - Approve lớp:**
```javascript
const approveClass = async (classId) => {
  try {
    const response = await axios.post(
      `/api/v1/classes/${classId}/approve`,
      {},  // Empty body
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      // Show success message
      alert('Class approved successfully! Status changed to SCHEDULED.');
      // Redirect to pending list
      window.location.href = '/center-head/pending-approvals';
    }
  } catch (error) {
    if (error.response?.status === 403) {
      alert('Only Center Head can approve classes');
    } else if (error.response?.status === 404) {
      alert('Class not found');
    } else if (error.response?.status === 400) {
      alert(error.response.data.message);
    }
  }
};
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Class approved successfully",
  "data": "Class status changed to SCHEDULED"
}
```

**Error Responses:**

**403 Forbidden - Not Center Head:**
```json
{
  "success": false,
  "message": "Access denied. Only Center Head can approve classes.",
  "errorCode": "FORBIDDEN"
}
```

**400 Bad Request - Invalid State:**
```json
{
  "success": false,
  "message": "Cannot approve class. Class must be in DRAFT status and PENDING approval.",
  "errorCode": "INVALID_STATE"
}
```

**Business Logic:**
- ✅ Status: DRAFT → SCHEDULED
- ✅ ApprovalStatus: PENDING → APPROVED
- ✅ Set `approvedBy` = currentUser.id
- ✅ Set `approvedAt` = NOW()
- ✅ Class is now ready for student enrollment

---

### 5️⃣ POST Reject Class (With Reason)

**Endpoint:**
```
POST /api/v1/classes/{classId}/reject
```

**Authorization:** `CENTER_HEAD` only

**Path Parameters:**
- `classId` (Long) - Class ID to reject

**Request Body:**
```json
{
  "reason": "Time slot conflicts with another class. Please use different time slots for Wednesday sessions."
}
```

**Validation Rules:**
- `reason` is **required**
- Minimum length: **10 characters**
- Maximum length: **500 characters**

**Use Case - Reject lớp với lý do:**
```javascript
const rejectClass = async (classId, reason) => {
  try {
    const response = await axios.post(
      `/api/v1/classes/${classId}/reject`,
      { reason: reason },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      // Show success message
      alert('Class rejected. Academic Staff will be notified to fix issues.');
      // Redirect to pending list
      window.location.href = '/center-head/pending-approvals';
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Validation error
      const validationErrors = error.response.data.details?.errors || {};
      if (validationErrors.reason) {
        alert(`Invalid reason: ${validationErrors.reason}`);
      }
    }
  }
};
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Class rejected successfully",
  "data": {
    "classId": 101,
    "classCode": "IELTSFOUND-HCM01-25-001",
    "success": true,
    "message": "Class rejected and sent back to Academic Staff",
    "rejectionReason": "Time slot conflicts with another class. Please use different time slots for Wednesday sessions.",
    "decidedAt": "2025-01-03T16:30:00Z",
    "decidedBy": "Dr. John Nguyen (Center Head)"
  }
}
```

**Error Response (400 Bad Request - Validation):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "errors": {
      "reason": "Rejection reason must be between 10 and 500 characters"
    }
  }
}
```

**Business Logic:**
- ✅ Status: DRAFT → DRAFT (unchanged)
- ✅ ApprovalStatus: PENDING → REJECTED
- ✅ Store `rejectionReason`
- ✅ Set `decidedBy` = currentUser.id
- ✅ Set `decidedAt` = NOW()
- ✅ Reset `submittedAt` = NULL (Academic Staff có thể edit và submit lại)
- ✅ Academic Staff nhận notification để sửa

---

## 🎨 FRONTEND SCREENS

### Screen 1: Pending Approvals List

**Route:** `/center-head/pending-approvals`

**Features:**
- 📊 Table hiển thị danh sách lớp chờ duyệt
- 🔍 Search by class code, course name, branch
- 📅 Filter by submit date range
- 🏢 Filter by branch (nếu Center Head quản lý nhiều branch)
- ⏰ Sort by submitted date (mới nhất trước)

**Columns:**
1. Class Code (link to detail)
2. Course Name
3. Branch
4. Start Date
5. Teacher Count
6. Submitted Date
7. Submitted By (Academic Staff name)
8. Actions (View Detail button)

**Sample UI:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔔 PENDING APPROVALS (5 classes)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Filters:  [Branch ▼]  [Date Range]  [Search: __________] [🔍]              │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Code              │ Course     │ Branch │ Start  │ Submitted │ Action  │ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ IELTSFOUND-HCM... │ IELTS F... │ HCM01  │ Jan 6  │ 2h ago    │ [View]  │ │
│ │ TOEICBAS-HCM...   │ TOEIC B... │ HCM02  │ Jan 8  │ 5h ago    │ [View]  │ │
│ │ ENGBAS-HN01...    │ English... │ HN01   │ Jan 10 │ 1d ago    │ [View]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ Showing 1-3 of 5       [Prev] [1] [2] [Next]                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Screen 2: Class Detail Review

**Route:** `/center-head/approvals/{classId}`

**API Calls:**
1. `GET /api/v1/classes/{classId}` - Basic info
2. `GET /api/v1/classes/{classId}/sessions` - Full sessions list

**Layout Sections:**

**1. Header with Actions:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to List                                                  │
│                                                                 │
│ Class: IELTSFOUND-HCM01-25-001                                  │
│ Status: 🟡 PENDING APPROVAL                                     │
│                                                                 │
│ [🟢 Approve Class]  [🔴 Reject Class]                           │
└─────────────────────────────────────────────────────────────────┘
```

**2. Basic Information Card:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📘 Basic Information                                            │
├─────────────────────────────────────────────────────────────────┤
│ Class Code:    IELTSFOUND-HCM01-25-001                          │
│ Course:        IELTS Foundation (60 hours, 14 weeks)            │
│ Branch:        Hồ Chí Minh - Quận 1                             │
│ Modality:      OFFLINE                                          │
│ Max Capacity:  20 students                                      │
│ Submitted:     Jan 3, 2025 at 2:30 PM by Alice (Academic Staff)│
└─────────────────────────────────────────────────────────────────┘
```

**3. Schedule Card:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 Schedule                                                     │
├─────────────────────────────────────────────────────────────────┤
│ Start Date:    January 6, 2025                                  │
│ End Date:      April 14, 2025 (14 weeks)                        │
│ Days:          Monday, Wednesday, Friday                        │
│ Time:          08:00 - 10:00 (2 hours)                          │
│ Total Sessions: 42 sessions                                     │
└─────────────────────────────────────────────────────────────────┘
```

**4. Teacher Assignment Card:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 👨‍🏫 Teacher Assignment                                          │
├─────────────────────────────────────────────────────────────────┤
│ ✅ John Smith (john.smith@tms.edu.vn)                           │
│    Skills: Listening, Reading                                   │
│    Assigned: 15 sessions                                        │
│                                                                 │
│ ✅ Alice Brown (alice.brown@tms.edu.vn)                         │
│    Skills: Speaking                                             │
│    Assigned: 14 sessions                                        │
│                                                                 │
│ ✅ David Lee (david.lee@tms.edu.vn)                             │
│    Skills: Writing                                              │
│    Assigned: 13 sessions                                        │
│                                                                 │
│ Total: 3 teachers, 42 sessions fully assigned ✅                │
└─────────────────────────────────────────────────────────────────┘
```

**5. Resource Assignment Card:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 Resource Assignment                                          │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Room 101 (Primary)                                           │
│    Assigned: 42 sessions                                        │
│                                                                 │
│ All sessions have resource assigned ✅                          │
└─────────────────────────────────────────────────────────────────┘
```

**6. Sessions Timeline (Expandable):**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Session Timeline (42 sessions)         [View All ▼]         │
├─────────────────────────────────────────────────────────────────┤
│ Week 1: Jan 6 - Jan 12 (3 sessions)                             │
│   • Jan 6 (Mon) - John Smith - Room 101 ✅                      │
│   • Jan 8 (Wed) - Alice Brown - Room 101 ✅                     │
│   • Jan 10 (Fri) - David Lee - Room 101 ✅                      │
│                                                                 │
│ Week 2: Jan 13 - Jan 19 (3 sessions)                            │
│   [Collapsed - Click to expand]                                 │
└─────────────────────────────────────────────────────────────────┘
```

**7. Validation Summary:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ VALIDATION SUMMARY                                           │
├─────────────────────────────────────────────────────────────────┤
│ ✅ All sessions have time slots assigned                        │
│ ✅ All sessions have resources assigned                         │
│ ✅ All sessions have teachers assigned                          │
│ ✅ No scheduling conflicts detected                             │
│ ✅ Teacher availability verified                                │
│                                                                 │
│ 🟢 Class is ready for approval                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Screen 3: Approve Confirmation Modal

**Trigger:** Click "Approve Class" button

**Modal Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  CONFIRM APPROVAL                                       [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Are you sure you want to approve this class?                    │
│                                                                 │
│ Class Code: IELTSFOUND-HCM01-25-001                             │
│ Course: IELTS Foundation                                        │
│ Start Date: January 6, 2025                                     │
│                                                                 │
│ After approval:                                                 │
│ • Class status will change to SCHEDULED                         │
│ • Academic Staff can enroll students                            │
│ • Class will appear in student course catalog                   │
│ • This action cannot be undone                                  │
│                                                                 │
│         [Cancel]              [✅ Confirm Approval]             │
└─────────────────────────────────────────────────────────────────┘
```

**Code:**
```javascript
const handleApprove = async () => {
  setLoading(true);
  try {
    await approveClass(classId);
    showSuccessToast('Class approved successfully!');
    navigate('/center-head/pending-approvals');
  } catch (error) {
    showErrorToast(error.response?.data?.message || 'Failed to approve class');
  } finally {
    setLoading(false);
    closeModal();
  }
};
```

---

### Screen 4: Reject Modal (With Reason)

**Trigger:** Click "Reject Class" button

**Modal Content:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  REJECT CLASS                                           [×]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Class Code: IELTSFOUND-HCM01-25-001                             │
│                                                                 │
│ Rejection Reason (required) *                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Please provide detailed reason for rejection...             │ │
│ │                                                             │ │
│ │                                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ 0 / 500 characters (minimum 10)                                 │
│                                                                 │
│ 📝 Tips for good rejection reason:                              │
│ • Be specific about what needs to be fixed                      │
│ • Reference session numbers or dates if applicable              │
│ • Suggest how to resolve the issue                              │
│                                                                 │
│         [Cancel]              [🔴 Confirm Rejection]            │
└─────────────────────────────────────────────────────────────────┘
```

**Validation:**
```javascript
const [rejectionReason, setRejectionReason] = useState('');
const [errors, setErrors] = useState({});

const validateReason = (reason) => {
  if (!reason || reason.trim().length === 0) {
    return 'Rejection reason is required';
  }
  if (reason.length < 10) {
    return 'Rejection reason must be at least 10 characters';
  }
  if (reason.length > 500) {
    return 'Rejection reason must not exceed 500 characters';
  }
  return null;
};

const handleReject = async () => {
  const error = validateReason(rejectionReason);
  if (error) {
    setErrors({ reason: error });
    return;
  }
  
  setLoading(true);
  try {
    await rejectClass(classId, rejectionReason);
    showSuccessToast('Class rejected. Academic Staff will be notified.');
    navigate('/center-head/pending-approvals');
  } catch (error) {
    showErrorToast(error.response?.data?.message || 'Failed to reject class');
  } finally {
    setLoading(false);
    closeModal();
  }
};
```

---

## 📱 MOBILE RESPONSIVE CONSIDERATIONS

**Mobile View Adaptations:**

1. **List View:**
   - Card layout thay vì table
   - Show: Class Code, Course, Submitted time
   - Swipe actions for quick approve/reject

2. **Detail View:**
   - Collapsible sections với accordion
   - Sticky action buttons ở bottom
   - Session timeline với virtual scrolling

3. **Modals:**
   - Full-screen modal trên mobile
   - Larger touch targets (min 44px)
   - Textarea tự động expand

---

## 🧪 ERROR HANDLING

### Common Errors & Solutions

**1. 403 Forbidden - Not Center Head:**
```javascript
if (error.response?.status === 403) {
  alert('Access denied. You must be a Center Head to approve/reject classes.');
  navigate('/');
}
```

**2. 404 Not Found - Class không tồn tại:**
```javascript
if (error.response?.status === 404) {
  alert('Class not found. It may have been deleted.');
  navigate('/center-head/pending-approvals');
}
```

**3. 400 Bad Request - Invalid state:**
```javascript
if (error.response?.status === 400) {
  const message = error.response.data.message;
  alert(`Cannot process request: ${message}`);
}
```

**4. 401 Unauthorized - Token expired:**
```javascript
if (error.response?.status === 401) {
  alert('Session expired. Please login again.');
  navigate('/login');
}
```

---

## 🔔 NOTIFICATIONS (Future Enhancement)

**Academic Staff nhận notification khi:**
- ✅ Class được approve → "Your class IELTSFOUND-HCM01-25-001 has been approved"
- ❌ Class bị reject → "Your class IELTSFOUND-HCM01-25-001 was rejected. Reason: ..."

**Center Head nhận notification khi:**
- 📨 Class mới được submit → "New class IELTSFOUND-HCM01-25-001 awaiting your approval"

---

## ✅ TESTING CHECKLIST

### Manual Testing

**Pre-conditions:**
- [ ] Login as CENTER_HEAD user
- [ ] Have at least 1 class with status=DRAFT, approvalStatus=PENDING

**Test Cases:**

1. **List View:**
   - [ ] Navigate to `/center-head/pending-approvals`
   - [ ] Verify only PENDING classes are shown
   - [ ] Test search functionality
   - [ ] Test pagination
   - [ ] Test sort by submitted date

2. **Detail View:**
   - [ ] Click "View" button on a pending class
   - [ ] Verify all sections display correctly
   - [ ] Verify teacher assignments show correct data
   - [ ] Verify sessions timeline loads
   - [ ] Expand/collapse session weeks

3. **Approve Flow:**
   - [ ] Click "Approve Class" button
   - [ ] Verify confirmation modal appears
   - [ ] Click "Confirm Approval"
   - [ ] Verify success toast appears
   - [ ] Verify redirect to pending list
   - [ ] Verify class no longer in pending list
   - [ ] Call GET /api/v1/classes/{id} to verify status=SCHEDULED

4. **Reject Flow:**
   - [ ] Click "Reject Class" button
   - [ ] Verify rejection modal appears
   - [ ] Try submit with empty reason → Verify validation error
   - [ ] Try submit with 5 characters → Verify "minimum 10" error
   - [ ] Enter valid reason (50 characters)
   - [ ] Click "Confirm Rejection"
   - [ ] Verify success toast appears
   - [ ] Verify redirect to pending list
   - [ ] Call GET /api/v1/classes/{id} to verify approvalStatus=REJECTED

5. **Authorization:**
   - [ ] Try access as ACADEMIC_AFFAIR → Verify 403 on approve/reject
   - [ ] Try access as STUDENT → Verify 403 on all endpoints
   - [ ] Try with expired token → Verify 401 and redirect to login

---

## 📚 API SUMMARY TABLE

| # | Endpoint | Method | Role | Purpose |
|---|----------|--------|------|---------|
| 1 | `/api/v1/classes` | GET | CENTER_HEAD | List all classes with filter approvalStatus=PENDING |
| 2 | `/api/v1/classes/{id}` | GET | CENTER_HEAD | View class detail for review |
| 3 | `/api/v1/classes/{id}/sessions` | GET | CENTER_HEAD | View full session schedule |
| 4 | `/api/v1/classes/{id}/approve` | POST | CENTER_HEAD | Approve class (status→SCHEDULED) |
| 5 | `/api/v1/classes/{id}/reject` | POST | CENTER_HEAD | Reject class with reason (status→DRAFT) |

---

## 🚀 IMPLEMENTATION PRIORITY

**Phase 1 (MVP):**
1. ✅ Pending approvals list page
2. ✅ Class detail review page
3. ✅ Approve confirmation modal
4. ✅ Reject modal with reason

**Phase 2 (Enhancements):**
5. 📊 Dashboard với statistics (Total pending, approved today, etc.)
6. 🔔 Real-time notifications
7. 📥 Bulk approve/reject
8. 📄 Export approval history

**Phase 3 (Advanced):**
9. 📝 Approval comments/notes
10. 🔍 Audit trail của approval history
11. 📧 Email notifications
12. 📱 Mobile app support

---

## 💡 BEST PRACTICES

**1. Data Freshness:**
```javascript
// Poll for new pending classes every 60 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchPendingClasses();
  }, 60000);
  return () => clearInterval(interval);
}, []);
```

**2. Optimistic Updates:**
```javascript
// Update UI immediately, rollback on error
const optimisticApprove = async (classId) => {
  // Update local state
  updateClassStatus(classId, 'SCHEDULED');
  
  try {
    await approveClass(classId);
  } catch (error) {
    // Rollback on error
    updateClassStatus(classId, 'DRAFT');
    showError(error);
  }
};
```

**3. Loading States:**
```javascript
// Show loading during API calls
const [loading, setLoading] = useState(false);

<Button onClick={handleApprove} disabled={loading}>
  {loading ? 'Approving...' : 'Approve Class'}
</Button>
```

---

## ❓ FAQ

**Q: Center Head có thể edit class không?**  
A: Không. Center Head chỉ có quyền APPROVE/REJECT. Academic Staff là người tạo và edit.

**Q: Sau khi reject, Academic Staff có thể làm gì?**  
A: Academic Staff thấy rejectionReason, sửa class (edit sessions/teachers/resources), sau đó submit lại.

**Q: Center Head có thể xem lịch sử approval không?**  
A: Có. Call `GET /api/v1/classes?approvalStatus=APPROVED` hoặc `REJECTED` với filter date range.

**Q: Có thể undo approve/reject không?**  
A: Hiện tại chưa support. Cần implement endpoint mới nếu muốn tính năng này.

**Q: Center Head có thể approve lớp của branch khác không?**  
A: Không. Backend filter theo user's branch assignments.

---

## 📞 SUPPORT

**Backend Team Contact:**
- Slack: #backend-team
- Email: backend@tms.edu.vn

**API Issues:**
- Report bugs: GitHub Issues
- API docs: Swagger UI at `http://localhost:8080/swagger-ui.html`

---

**End of Document** ✅
