# FairGig API Specification

**Version:** 1.0.0  
**Base URL:** `https://api.fairgig.example.com`  
**Authentication:** JWT Bearer tokens

---

## Table of Contents

- [Authentication](#authentication)
- [ML Proxy Endpoints](#ml-proxy-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Session Endpoints](#session-endpoints)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints (except auth endpoints) require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token via Supabase Auth (magic link or SSO).

---

## ML Proxy Endpoints

### POST /api/ml-proxy/frame

Submit a webcam frame for ML analysis.

**Request:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "studentId": "660e8400-e29b-41d4-a716-446655440001",
  "sequenceNumber": 1234,
  "frameTimestamp": "2025-12-05T00:00:00.000Z",
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "deviceInfo": {
    "browser": "Chrome 142",
    "os": "Windows 10",
    "deviceType": "desktop",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "networkRttMs": 42
  },
  "localChecks": {
    "visibilityState": "visible",
    "isFullscreen": true,
    "tabFocus": true
  }
}
```

**Response (200 OK):**

```json
{
  "ml": {
    "focus_score": 0.85,
    "confidence": 0.92,
    "alerts": [
      {
        "code": "PHONE_DETECTED",
        "severity": "high",
        "description": "Mobile device detected in frame",
        "confidence": 0.91,
        "bbox": [0.5, 0.3, 0.2, 0.3]
      }
    ],
    "metrics": {
      "faces": 1,
      "face_ids": ["face_abc123"],
      "head_pose": {
        "yaw": 0.05,
        "pitch": -0.02,
        "roll": 0.01
      },
      "gaze_vector": {
        "x": 0.1,
        "y": -0.05,
        "z": 1.2
      }
    },
    "debug": {
      "model_version": "v2.1.0",
      "inference_time_ms": 185,
      "gpu_used": true
    }
  },
  "server": {
    "receivedAt": "2025-12-05T00:00:00.100Z",
    "processingMs": 210
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Session not found or access denied
- `413 Payload Too Large` - Frame size exceeds limit (5MB)
- `429 Too Many Requests` - Rate limit exceeded (5 RPS per session)
- `500 Internal Server Error` - ML service unavailable (returns degraded mode response)

---

## Admin Endpoints

### GET /api/admin/sessions

List exam sessions with optional filtering and sorting.

**Query Parameters:**

- `status` (optional): Filter by status (`active`, `completed`, `aborted`)
- `sort` (optional): Sort field (`risk`, `started_at`, `integrity_score`)
- `order` (optional): Sort order (`asc`, `desc`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 200)

**Request:**

```
GET /api/admin/sessions?status=active&sort=risk&order=desc&page=1&limit=50
```

**Response (200 OK):**

```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "exam_id": "660e8400-e29b-41d4-a716-446655440001",
      "student_id": "770e8400-e29b-41d4-a716-446655440002",
      "student_name": "Jane Doe",
      "status": "in_progress",
      "integrity_score": 0.65,
      "risk_score": 0.35,
      "alert_count": 12,
      "started_at": "2025-12-05T10:00:00.000Z",
      "ended_at": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "totalPages": 5
  }
}
```

**Required Role:** `admin`, `proctor`

---

### GET /api/admin/session/{sessionId}

Get detailed information about a specific exam session.

**Request:**

```
GET /api/admin/session/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "exam_id": "660e8400-e29b-41d4-a716-446655440001",
    "student_id": "770e8400-e29b-41d4-a716-446655440002",
    "started_at": "2025-12-05T10:00:00.000Z",
    "ended_at": "2025-12-05T11:30:00.000Z",
    "status": "completed",
    "integrity_score": 0.78,
    "degraded": false,
    "device_info": { ... }
  },
  "exam": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Final Exam - Computer Science 101",
    "duration_minutes": 90
  },
  "student": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "email": "jane@example.com",
    "display_name": "Jane Doe"
  },
  "scores": [
    {
      "id": 1,
      "timestamp": "2025-12-05T10:05:00.000Z",
      "focus_score": 0.92,
      "confidence": 0.88,
      "alerts": []
    }
  ],
  "snapshots": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "timestamp": "2025-12-05T10:15:00.000Z",
      "event_code": "PHONE_DETECTED",
      "severity": "high",
      "storage_path": "snapshots/exam123/session456/2025/12/05/1234-PHONE_DETECTED.jpg",
      "ml_confidence": 0.91,
      "admin_review_status": "pending",
      "notes": null
    }
  ],
  "timeline": [
    {
      "timestamp": "2025-12-05T10:00:00.000Z",
      "type": "status_change",
      "data": { "status": "in_progress" }
    }
  ]
}
```

**Required Role:** `admin`, `proctor`, `support`

---

### POST /api/admin/session/{sessionId}/note

Add an admin note to a session.

**Request:**

```json
{
  "note": "Reviewed alert - false positive due to reflection in glasses."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "noteId": "990e8400-e29b-41d4-a716-446655440004"
}
```

**Required Role:** `admin`, `proctor`

---

### POST /api/admin/session/{sessionId}/mark-false-positive

Mark a suspicious event as a false positive.

**Request:**

```json
{
  "snapshotId": "880e8400-e29b-41d4-a716-446655440003",
  "reason": "Student adjusting glasses, not using phone"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "updatedSnapshot": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "admin_review_status": "false_positive",
    "notes": "Student adjusting glasses, not using phone"
  }
}
```

**Required Role:** `admin`, `proctor`

---

### POST /api/admin/tune-thresholds

Update detection thresholds for a specific exam.

**Request:**

```json
{
  "exam_id": "660e8400-e29b-41d4-a716-446655440001",
  "thresholds": {
    "focus_threshold": 0.7,
    "phone_alert_level": "high"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "exam_id": "660e8400-e29b-41d4-a716-446655440001",
  "updated_thresholds": {
    "focus_threshold": 0.7,
    "phone_alert_level": "high"
  }
}
```

**Required Role:** `admin`

---

## Session Endpoints (Student)

### POST /api/session/start

Start a new exam session.

**Request:**

```json
{
  "exam_id": "660e8400-e29b-41d4-a716-446655440001",
  "consent_given": true,
  "device_info": { ... }
}
```

**Response (200 OK):**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "exam": { ... },
  "settings": {
    "frameIntervalMs": 500,
    "frameWidth": 640,
    "frameHeight": 480,
    "jpegQuality": 80
  }
}
```

---

### POST /api/session/{sessionId}/end

End an exam session.

**Request:**

```json
{
  "answers": { ... }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "integrity_score": 0.85,
  "flagged_events": 3
}
```

---

## Error Codes

Standard error response format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { ... }
}
```

**Error Codes:**

- `AUTH_INVALID` - Invalid or missing authentication
- `RATE_LIMIT` - Too many requests
- `ML_TIMEOUT` - ML service timeout
- `FRAME_TOO_LARGE` - Frame exceeds size limit
- `SESSION_NOT_FOUND` - Session does not exist
- `PERMISSION_DENIED` - Insufficient permissions
- `STORAGE_ERROR` - Storage operation failed
- `DEGRADED_MODE` - ML service unavailable (graceful degradation)

---

## Rate Limiting

**ML Proxy:**
- 5 requests per second per session
- Exceeding limit returns `429 Too Many Requests`

**Admin Endpoints:**
- 100 requests per minute per user
- Exceeding limit returns `429 Too Many Requests`

Rate limit headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1638360000
```

---

## Webhooks (Optional)

Configure webhooks to receive real-time event notifications.

**Events:**

- `session.started`
- `session.completed`
- `alert.high_severity`
- `snapshot.created`

**Webhook Payload:**

```json
{
  "event": "alert.high_severity",
  "timestamp": "2025-12-05T10:15:00.000Z",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "alert": { ... }
  }
}
```

---

## Versioning

API version is included in the URL path:

```
/api/v1/ml-proxy/frame
/api/v2/ml-proxy/frame
```

Current stable version: **v1**

---

## SDKs & Client Libraries

Official SDKs:

- **JavaScript/TypeScript:** `npm install @fairgig/client`
- **Python:** `pip install fairgig-client`

---

## Support

For API support, contact:

- **Email:** api-support@fairgig.example.com
- **Documentation:** https://docs.fairgig.example.com
- **Status Page:** https://status.fairgig.example.com

---

**Last updated:** December 4, 2025
