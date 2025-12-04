// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
  PROCTOR = 'proctor',
  SUPPORT = 'support',
}

export enum ExamSessionStatus {
  PREPARING = 'preparing',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

export enum AlertCode {
  PHONE_DETECTED = 'PHONE_DETECTED',
  MULTIPLE_FACES = 'MULTIPLE_FACES',
  NO_FACE = 'NO_FACE',
  EYES_CLOSED = 'EYES_CLOSED',
  LOOKING_AWAY = 'LOOKING_AWAY',
  GAZE_AWAY = 'GAZE_AWAY',
  TAB_SWITCH = 'TAB_SWITCH',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ErrorCode {
  AUTH_INVALID = 'AUTH_INVALID',
  RATE_LIMIT = 'RATE_LIMIT',
  ML_TIMEOUT = 'ML_TIMEOUT',
  FRAME_TOO_LARGE = 'FRAME_TOO_LARGE',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DEGRADED_MODE = 'DEGRADED_MODE',
}

export enum AdminReviewStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FALSE_POSITIVE = 'false_positive',
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  metadata: {
    id_verification_status?: string;
    [key: string]: any;
  } | null;
  is_active: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  settings: {
    frameRate: number;
    captureWidth: number;
    captureHeight: number;
    recordingConsent: boolean;
  };
  thresholds: {
    focus_threshold: number;
    phone_alert_level: AlertSeverity;
  };
  retention_days: number;
}

export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  ended_at: string | null;
  status: ExamSessionStatus;
  integrity_score: number;
  degraded: boolean;
  device_info: {
    browser: string;
    os: string;
    deviceType: string;
    screenWidth: number;
    screenHeight: number;
    networkRttMs?: number;
  } | null;
  logs: any;
}

export interface CheatScore {
  id: string;
  session_id: string;
  sequence_number: number;
  timestamp: string;
  focus_score: number;
  confidence: number;
  alerts: Alert[];
  metrics: MLMetrics;
  server_latency_ms: number;
}

export interface SuspiciousSnapshot {
  id: string;
  session_id: string;
  timestamp: string;
  event_code: AlertCode;
  severity: AlertSeverity;
  storage_path: string;
  ml_confidence: number;
  admin_review_status: AdminReviewStatus;
  notes: string | null;
}

export interface VideoMetadata {
  session_id: string;
  recording_url: string;
  size_bytes: number;
  duration_seconds: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  details: any;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: string;
  screenWidth: number;
  screenHeight: number;
  networkRttMs?: number;
}

export interface LocalChecks {
  visibilityState: string;
  isFullscreen: boolean;
  tabFocus: boolean;
}

export interface FramePayload {
  sessionId: string;
  studentId: string;
  sequenceNumber: number;
  frameTimestamp: string;
  frame: string; // base64 jpeg data
  deviceInfo: DeviceInfo;
  localChecks: LocalChecks;
}

export interface Alert {
  id?: string;
  code: AlertCode;
  severity: AlertSeverity;
  description: string;
  confidence: number;
  timestamp?: Date;
  bbox?: [number, number, number, number]; // [x, y, w, h]
}

export interface HeadPose {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface GazeVector {
  x: number;
  y: number;
  z: number;
}

export interface MLMetrics {
  faces: number;
  face_ids?: string[];
  head_pose?: HeadPose;
  gaze_vector?: GazeVector;
}

export interface MLDebugInfo {
  timings?: any;
  model_version?: string;
  [key: string]: any;
}

export interface MLResponse {
  focus_score: number;
  confidence: number;
  alerts: Alert[];
  metrics: MLMetrics;
  debug?: MLDebugInfo;
}

export interface FrameResponse {
  ml: MLResponse;
  server: {
    receivedAt: string;
    processingMs: number;
  };
}

export interface SessionListItem {
  id: string;
  exam_id: string;
  student_id: string;
  student_name: string;
  status: ExamSessionStatus;
  integrity_score: number;
  risk_score: number;
  alert_count: number;
  started_at: string;
  ended_at: string | null;
}

export interface SessionDetailResponse {
  session: ExamSession;
  exam: Exam;
  student: Profile;
  scores: CheatScore[];
  snapshots: SuspiciousSnapshot[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: string;
  type: 'score' | 'alert' | 'snapshot' | 'status_change';
  data: any;
}

export interface AddNoteRequest {
  note: string;
}

export interface TuneThresholdsRequest {
  exam_id: string;
  thresholds: {
    focus_threshold: number;
    phone_alert_level: AlertSeverity;
  };
}

// ============================================================================
// COMPONENT PROPS & STATE TYPES
// ============================================================================

export interface VideoCaptureConfig {
  frameIntervalMs: number;
  frameWidth: number;
  frameHeight: number;
  jpegQuality: number;
}

export interface VideoCaptureManagerProps {
  config: VideoCaptureConfig;
  onFrameReady: (frameData: string, timestamp: Date) => void;
  onPermissionDenied: () => void;
  onCameraLost: () => void;
}

export interface FrameSenderProps {
  sessionId: string;
  studentId: string;
  onResponse: (response: FrameResponse) => void;
  onError: (error: Error) => void;
}

export interface LiveGaugeProps {
  scores: number[];
  currentScore: number;
}

export interface AlertListProps {
  alerts: Alert[];
  onDismiss: (index: number) => void;
  onMarkFalsePositive: (index: number) => void;
}

export interface SecurityLayerProps {
  onViolation: (violation: SecurityViolation) => void;
}

export interface SecurityViolation {
  type: 'blur' | 'fullscreen_exit' | 'devtools' | 'focus_lost' | 'copy_paste';
  timestamp: Date;
  details?: any;
}

export interface ExamCardProps {
  exam: Exam;
  sessionStatus?: ExamSessionStatus;
  onStart: () => void;
}

export interface DeviceCheckResult {
  passed: boolean;
  message: string;
  details?: any;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  status?: ExamSessionStatus;
  severity?: AlertSeverity;
  startDate?: string;
  endDate?: string;
}
