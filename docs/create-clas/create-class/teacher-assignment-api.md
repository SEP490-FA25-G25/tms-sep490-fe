# Teacher Assignment API - Frontend Handoff

## Overview

API endpoint cho **Step 5: Gán giáo viên** trong quy trình tạo lớp. Hỗ trợ **Split View UI (Option 3)** với thông tin chi tiết về xung đột lịch dạy.

---

## Endpoint

### GET `/api/v1/classes/{classId}/teachers/detailed`

Lấy danh sách giáo viên có thể dạy lớp, kèm thông tin xung đột chi tiết.

**Authorization:** Required (Role: `ACADEMIC_AFFAIR`)

---

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `classId` | Long | ✅ Yes | - | ID của lớp cần gán giáo viên |
| `includeConflictDetails` | Boolean | ❌ No | `false` | `true` = Trả về chi tiết xung đột (ngày, giờ, lớp xung đột) |

---

## Response Structure

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Found 16 teachers (14 recommended, 2 with conflicts)",
  "data": [
    {
      "id": 2,
      "name": "Emma Wilson",
      "email": "emma.wilson@tms-edu.vn",
      "skills": ["READING", "WRITING"],
      "conflictCount": 0,
      "totalSessions": 24,
      "availableSessions": 24,
      "availabilityRate": 100.0,
      "isRecommended": true,
      "conflicts": null,
      "availabilityByDay": null
    },
    {
      "id": 3,
      "name": "David Lee",
      "email": "david.lee@tms-edu.vn",
      "skills": ["GENERAL", "SPEAKING"],
      "conflictCount": 24,
      "totalSessions": 24,
      "availableSessions": 0,
      "availabilityRate": 0.0,
      "isRecommended": false,
      "conflicts": [...],
      "availabilityByDay": {...}
    }
  ]
}
```

---

## Data Models

### TeacherAvailabilityDTO

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | Long | ID giáo viên | `2` |
| `name` | String | Tên giáo viên | `"Emma Wilson"` |
| `email` | String | Email giáo viên | `"emma@tms.edu"` |
| `skills` | String[] | Danh sách kỹ năng | `["READING", "WRITING"]` |
| `conflictCount` | Integer | Số buổi bị xung đột | `0` |
| `totalSessions` | Integer | Tổng số buổi của lớp | `24` |
| `availableSessions` | Integer | Số buổi có thể dạy | `24` |
| `availabilityRate` | Double | Tỷ lệ khả dụng (%) | `100.0` |
| `isRecommended` | Boolean | Khuyến nghị (100% = true) | `true` |
| `conflicts` | ConflictDetailDTO[] | Chi tiết xung đột (optional) | `[...]` |
| `availabilityByDay` | Map<Integer, DayAvailability> | Thống kê theo ngày (optional) | `{...}` |

### ConflictDetailDTO

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sessionDate` | String (Date) | Ngày học bị xung đột | `"2025-11-17"` |
| `dayOfWeek` | String | Thứ trong tuần (tiếng Việt) | `"Thứ Hai"` |
| `timeSlot` | TimeSlotInfo | Thông tin khung giờ | `{...}` |
| `conflictingClass` | ConflictingClassInfo | Lớp đang dạy | `{...}` |
| `resource` | ResourceInfo | Phòng học | `{...}` |

### TimeSlotInfo

| Field | Type | Example |
|-------|------|---------|
| `id` | Long | `1` |
| `name` | String | `"HN Morning 1"` |
| `startTime` | String | `"08:00"` |
| `endTime` | String | `"10:00"` |
| `displayTime` | String | `"08:00 - 10:00"` |

### ConflictingClassInfo

| Field | Type | Example |
|-------|------|---------|
| `id` | Long | `5` |
| `name` | String | `"Lớp IELTS cơ bản A"` |
| `code` | String | `"IELTSFOUND-HN01-25-005"` |

### ResourceInfo

| Field | Type | Example |
|-------|------|---------|
| `id` | Long | `3` |
| `name` | String | `"Ha Noi Room 201"` |
| `code` | String | `"HN01-R201"` |
| `type` | String | `"ROOM"` or `"VIRTUAL"` |

### DayAvailability

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `available` | Integer | Số buổi có thể dạy trong ngày | `7` |
| `total` | Integer | Tổng số buổi trong ngày | `8` |
| `rate` | Double | Tỷ lệ % | `87.5` |

---

## Usage Examples

### Example 1: Lấy danh sách nhanh (không có chi tiết)

**Request:**
```bash
GET /api/v1/classes/6/teachers/detailed?includeConflictDetails=false
```

**Use Case:** Hiển thị danh sách ban đầu, chỉ cần metric tổng quan

**Response:** `conflicts` và `availabilityByDay` = `null`

---

### Example 2: Lấy thông tin chi tiết đầy đủ

**Request:**
```bash
GET /api/v1/classes/6/teachers/detailed?includeConflictDetails=true
```

**Use Case:** Khi user click vào giáo viên để xem chi tiết xung đột

**Response:**
```json
{
  "id": 3,
  "name": "David Lee",
  "availabilityRate": 0.0,
  "isRecommended": false,
  "conflicts": [
    {
      "sessionDate": "2025-11-17",
      "dayOfWeek": "Thứ Hai",
      "timeSlot": {
        "displayTime": "08:00 - 10:00"
      },
      "conflictingClass": {
        "name": "Lớp IELTS cơ bản A",
        "code": "IELTSFOUND-HN01-25-005"
      },
      "resource": {
        "name": "Ha Noi Room 201",
        "type": "ROOM"
      }
    }
  ],
  "availabilityByDay": {
    "1": {"available": 0, "total": 8, "rate": 0.0},
    "3": {"available": 0, "total": 8, "rate": 0.0},
    "5": {"available": 0, "total": 8, "rate": 0.0}
  }
}
```

---

## UI Implementation Guide

### Split View Layout (Option 3)

#### Section 1: ✅ GIÁO VIÊN KHUYẾN NGHỊ

**Filter:**
```javascript
const recommendedTeachers = data.filter(t => t.isRecommended === true);
```

**Display:**
- Badge: "🎯 KHUYẾN NGHỊ"
- Highlight: Nền xanh nhạt hoặc viền xanh
- Text: "100% - Tất cả buổi học có thể dạy (24/24)"
- Action Button: "Chọn giáo viên" (prominent button)

**Example Card:**
```
┌─────────────────────────────────────────┐
│ 🎯 KHUYẾN NGHỊ                          │
├─────────────────────────────────────────┤
│ Emma Wilson                             │
│ emma.wilson@tms-edu.vn                  │
│ Skills: READING, WRITING                │
│                                         │
│ ✅ 100% - Có thể dạy tất cả 24 buổi    │
│                                         │
│        [ 🟢 Chọn giáo viên ]           │
└─────────────────────────────────────────┘
```

---

#### Section 2: ⚠️ GIÁO VIÊN CÓ XUNG ĐỘT

**Filter:**
```javascript
const conflictedTeachers = data.filter(t => t.isRecommended === false);
```

**Display:**
- Badge: "⚠️ CÓ XUNG ĐỘT"
- Show: `availabilityRate` + conflict count
- Expandable: Click để xem chi tiết xung đột
- Sort: Theo `availabilityRate` giảm dần (cao nhất trước)

**Example Card (Collapsed):**
```
┌─────────────────────────────────────────┐
│ ⚠️ CÓ XUNG ĐỘT                          │
├─────────────────────────────────────────┤
│ David Lee                               │
│ david.lee@tms-edu.vn                    │
│ Skills: GENERAL, SPEAKING               │
│                                         │
│ ⚠️ 0% - Xung đột 24/24 buổi            │
│                                         │
│        [ Xem chi tiết ▼ ]              │
└─────────────────────────────────────────┘
```

**Example Card (Expanded - with `includeConflictDetails=true`):**
```
┌─────────────────────────────────────────┐
│ ⚠️ CÓ XUNG ĐỘT                          │
├─────────────────────────────────────────┤
│ David Lee                               │
│ ⚠️ 0% - Xung đột 24/24 buổi            │
│                                         │
│ 📅 CHI TIẾT XUNG ĐỘT:                  │
│                                         │
│ • Thứ Hai, 17/11 - 08:00-10:00         │
│   Đang dạy: Lớp IELTS cơ bản A         │
│   Phòng: Ha Noi Room 201               │
│                                         │
│ • Thứ Ba, 18/11 - 08:00-10:00          │
│   Đang dạy: Lớp IELTS cơ bản A         │
│   Phòng: Ha Noi Room 201               │
│                                         │
│ ... (hiển thị 3-5 xung đột đầu)        │
│                                         │
│ 📊 THỐNG KÊ THEO NGÀY:                 │
│ • Thứ Hai: 0/8 buổi (0%)               │
│ • Thứ Tư: 0/8 buổi (0%)                │
│ • Thứ Sáu: 0/8 buổi (0%)               │
│                                         │
│        [ Ẩn chi tiết ▲ ]               │
└─────────────────────────────────────────┘
```

---

## Code Examples (React/TypeScript)

### TypeScript Interfaces

```typescript
interface TeacherAvailabilityDTO {
  id: number;
  name: string;
  email: string;
  skills: string[];
  conflictCount: number;
  totalSessions: number;
  availableSessions: number;
  availabilityRate: number;
  isRecommended: boolean;
  conflicts?: ConflictDetailDTO[];
  availabilityByDay?: { [day: number]: DayAvailability };
}

interface ConflictDetailDTO {
  sessionDate: string;
  dayOfWeek: string;
  timeSlot: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    displayTime: string;
  };
  conflictingClass: {
    id: number;
    name: string;
    code: string;
  };
  resource?: {
    id: number;
    name: string;
    code: string;
    type: 'ROOM' | 'VIRTUAL';
  };
}

interface DayAvailability {
  available: number;
  total: number;
  rate: number;
}
```

### Fetch Data

```typescript
// Initial load - no details
const fetchTeachers = async (classId: number) => {
  const response = await fetch(
    `/api/v1/classes/${classId}/teachers/detailed?includeConflictDetails=false`
  );
  const result = await response.json();
  return result.data;
};

// Load details when expanded
const fetchTeacherDetails = async (classId: number) => {
  const response = await fetch(
    `/api/v1/classes/${classId}/teachers/detailed?includeConflictDetails=true`
  );
  const result = await response.json();
  return result.data;
};
```

### Split and Render

```typescript
const TeacherList = ({ teachers }: { teachers: TeacherAvailabilityDTO[] }) => {
  const recommended = teachers.filter(t => t.isRecommended);
  const withConflicts = teachers.filter(t => !t.isRecommended);

  return (
    <>
      {/* Section 1: Recommended */}
      <div className="recommended-section">
        <h3>✅ GIÁO VIÊN KHUYẾN NGHỊ ({recommended.length})</h3>
        {recommended.map(teacher => (
          <TeacherCardRecommended key={teacher.id} teacher={teacher} />
        ))}
      </div>

      {/* Section 2: With Conflicts */}
      <div className="conflicts-section">
        <h3>⚠️ GIÁO VIÊN CÓ XUNG ĐỘT ({withConflicts.length})</h3>
        {withConflicts.map(teacher => (
          <TeacherCardConflicted key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </>
  );
};
```

### Display Availability Text

```typescript
const getAvailabilityText = (teacher: TeacherAvailabilityDTO): string => {
  const rate = teacher.availabilityRate.toFixed(1);
  const conflicts = teacher.conflictCount;
  const total = teacher.totalSessions;

  if (teacher.isRecommended) {
    return `✅ 100% - Có thể dạy tất cả ${total} buổi`;
  }

  if (conflicts === total) {
    return `⚠️ 0% - Xung đột tất cả ${total} buổi`;
  }

  return `⚠️ ${rate}% - Xung đột ${conflicts}/${total} buổi`;
};
```

### Render Conflict Details

```typescript
const ConflictList = ({ conflicts }: { conflicts: ConflictDetailDTO[] }) => {
  return (
    <div className="conflict-list">
      <h4>📅 CHI TIẾT XUNG ĐỘT:</h4>
      {conflicts.slice(0, 5).map((conflict, index) => (
        <div key={index} className="conflict-item">
          <div className="conflict-time">
            {conflict.dayOfWeek}, {formatDate(conflict.sessionDate)} - 
            {conflict.timeSlot.displayTime}
          </div>
          <div className="conflict-class">
            Đang dạy: {conflict.conflictingClass.name}
          </div>
          {conflict.resource && (
            <div className="conflict-room">
              Phòng: {conflict.resource.name}
            </div>
          )}
        </div>
      ))}
      {conflicts.length > 5 && (
        <div className="more-conflicts">
          ... và {conflicts.length - 5} xung đột khác
        </div>
      )}
    </div>
  );
};
```

---

## Performance Notes

| Scenario | Response Time | Data Size |
|----------|---------------|-----------|
| Without details (`includeConflictDetails=false`) | ~50ms | Small (~2KB per teacher) |
| With details (`includeConflictDetails=true`) | ~200ms | Large (~10KB per teacher) |

**Recommendation:**
1. Initial load: Use `includeConflictDetails=false`
2. Lazy load details: Fetch with `includeConflictDetails=true` when user expands a card
3. Cache the detailed response to avoid re-fetching

---

## Error Handling

### Common Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 404 | Class not found | Verify classId exists |
| 403 | Access denied | Check user role = ACADEMIC_AFFAIR |
| 400 | Invalid parameters | Check query parameters |
| 500 | Server error | Check backend logs |

---

## Testing Data

**Available Test Classes:**
- Class ID: `6` (24 sessions, multiple teachers)
- Class ID: `2` (Has some teacher assignments already)

**Test Scenarios:**
1. ✅ All teachers recommended (no conflicts)
2. ⚠️ Mix of recommended + conflicted teachers
3. 🔴 All teachers have conflicts

---

## Questions?

Contact: Backend Team
- Repository: `tms-sep490-be`
- Branch: `feature/create-class`
- Files:
  - Controller: `ClassController.java`
  - Service: `TeacherAssignmentServiceImpl.java`
  - DTOs: `dtos/teacher/`
