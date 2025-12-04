from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import base64
import numpy as np
import cv2
from datetime import datetime
import os
import random

app = FastAPI(title="FairGig ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
ML_SERVICE_KEY = os.getenv("ML_SERVICE_KEY", "dev-key")

# ============================================================================
# Models
# ============================================================================

class DeviceInfo(BaseModel):
    browser: str
    os: str
    deviceType: str
    screenWidth: int
    screenHeight: int
    networkRttMs: Optional[int] = None

class InferenceRequest(BaseModel):
    sessionId: str
    sequenceNumber: int
    timestamp: str
    frame: str  # base64 encoded image
    deviceInfo: Optional[DeviceInfo] = None

class Alert(BaseModel):
    code: str
    severity: str
    description: str
    confidence: float
    bbox: Optional[List[float]] = None

class HeadPose(BaseModel):
    yaw: float
    pitch: float
    roll: float

class GazeVector(BaseModel):
    x: float
    y: float
    z: float

class MLMetrics(BaseModel):
    faces: int
    face_ids: Optional[List[str]] = None
    head_pose: Optional[HeadPose] = None
    gaze_vector: Optional[GazeVector] = None

class MLDebugInfo(BaseModel):
    model_version: str
    inference_time_ms: float
    gpu_used: bool

class InferenceResponse(BaseModel):
    focus_score: float
    confidence: float
    alerts: List[Alert]
    metrics: MLMetrics
    debug: Optional[MLDebugInfo] = None

# ============================================================================
# Authentication
# ============================================================================

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    if token != ML_SERVICE_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return token

# ============================================================================
# ML Functions (Mock Implementation)
# ============================================================================

def decode_frame(base64_str: str) -> np.ndarray:
    """Decode base64 image to numpy array"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        return img
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid frame data: {str(e)}")

def detect_faces(frame: np.ndarray) -> int:
    """
    Detect number of faces in frame
    This is a mock implementation. Replace with actual face detection model.
    """
    # Mock: return random count (0-2)
    return random.choice([0, 1, 1, 1, 1, 2])

def detect_phone(frame: np.ndarray) -> Optional[Alert]:
    """
    Detect phone in frame
    This is a mock implementation. Replace with actual object detection model.
    """
    # Mock: 10% chance of detecting phone
    if random.random() < 0.1:
        return Alert(
            code="PHONE_DETECTED",
            severity="high",
            description="Mobile device detected in frame",
            confidence=random.uniform(0.7, 0.95),
            bbox=[random.random(), random.random(), 0.2, 0.3]
        )
    return None

def analyze_gaze(frame: np.ndarray) -> Optional[Alert]:
    """
    Analyze gaze direction
    This is a mock implementation. Replace with actual gaze tracking model.
    """
    # Mock: 15% chance of looking away
    if random.random() < 0.15:
        return Alert(
            code="LOOKING_AWAY",
            severity="medium",
            description="Student looking away from screen",
            confidence=random.uniform(0.6, 0.9),
        )
    return None

def check_eyes_closed(frame: np.ndarray) -> Optional[Alert]:
    """
    Check if eyes are closed
    This is a mock implementation. Replace with actual eye state detection.
    """
    # Mock: 5% chance of eyes closed
    if random.random() < 0.05:
        return Alert(
            code="EYES_CLOSED",
            severity="low",
            description="Eyes appear to be closed",
            confidence=random.uniform(0.5, 0.8),
        )
    return None

def calculate_focus_score(alerts: List[Alert], face_count: int) -> float:
    """Calculate focus score based on detections"""
    score = 1.0
    
    # Penalize based on alerts
    for alert in alerts:
        if alert.severity == "high":
            score -= 0.4 * alert.confidence
        elif alert.severity == "medium":
            score -= 0.2 * alert.confidence
        elif alert.severity == "low":
            score -= 0.1 * alert.confidence
    
    # Penalize for wrong number of faces
    if face_count == 0:
        score -= 0.3
    elif face_count > 1:
        score -= 0.5
    
    return max(0.0, min(1.0, score))

# ============================================================================
# Endpoints
# ============================================================================

@app.get("/")
async def root():
    return {
        "service": "FairGig ML Service",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/infer", response_model=InferenceResponse)
async def infer(
    request: InferenceRequest,
    _: str = Depends(verify_token)
):
    """
    Perform ML inference on a frame
    
    This is a MOCK implementation that returns randomized results.
    Replace with actual ML models for production use.
    """
    start_time = datetime.now()
    
    try:
        # Decode frame
        frame = decode_frame(request.frame)
        
        # Run detections (all mocked)
        face_count = detect_faces(frame)
        alerts: List[Alert] = []
        
        # Check for no face
        if face_count == 0:
            alerts.append(Alert(
                code="NO_FACE",
                severity="high",
                description="No face detected in frame",
                confidence=0.95
            ))
        
        # Check for multiple faces
        elif face_count > 1:
            alerts.append(Alert(
                code="MULTIPLE_FACES",
                severity="high",
                description=f"{face_count} faces detected in frame",
                confidence=0.9
            ))
        
        # Check for phone
        phone_alert = detect_phone(frame)
        if phone_alert:
            alerts.append(phone_alert)
        
        # Check gaze
        gaze_alert = analyze_gaze(frame)
        if gaze_alert:
            alerts.append(gaze_alert)
        
        # Check eyes
        eyes_alert = check_eyes_closed(frame)
        if eyes_alert:
            alerts.append(eyes_alert)
        
        # Calculate focus score
        focus_score = calculate_focus_score(alerts, face_count)
        
        # Calculate overall confidence
        confidence = 0.85 if face_count == 1 else 0.5
        
        # Build metrics
        metrics = MLMetrics(
            faces=face_count,
            face_ids=[f"face_{i}" for i in range(face_count)],
            head_pose=HeadPose(
                yaw=random.uniform(-0.3, 0.3),
                pitch=random.uniform(-0.2, 0.2),
                roll=random.uniform(-0.1, 0.1)
            ) if face_count > 0 else None,
            gaze_vector=GazeVector(
                x=random.uniform(-1, 1),
                y=random.uniform(-1, 1),
                z=random.uniform(0.5, 1.5)
            ) if face_count > 0 else None
        )
        
        # Calculate inference time
        inference_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Build response
        response = InferenceResponse(
            focus_score=focus_score,
            confidence=confidence,
            alerts=alerts,
            metrics=metrics,
            debug=MLDebugInfo(
                model_version="mock-v1.0.0",
                inference_time_ms=inference_time,
                gpu_used=False
            )
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
