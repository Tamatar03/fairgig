# FairGig — AI-Powered Real-Time Proctoring System

**A complete, production-ready online exam proctoring platform with AI-powered computer vision, real-time monitoring, and enterprise-grade security.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security & Privacy](#security--privacy)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

FairGig is a browser-based exam proctoring system that leverages advanced computer vision and machine learning to ensure academic integrity during online assessments. The system streams periodic webcam frames to an ML service that analyzes behavior in real-time, detecting suspicious activities like phone usage, multiple faces, gaze tracking anomalies, and more.

### Key Highlights

- **Real-time ML Analysis**: Sub-500ms median latency for frame processing
- **Privacy-First**: Only snapshots of suspicious events stored, not continuous video
- **Scalable**: Handle thousands of concurrent exams with auto-scaling
- **Secure**: End-to-end TLS, encrypted storage, Row-Level Security (RLS)
- **Resilient**: Graceful degradation with offline support
- **Observable**: Comprehensive monitoring, audit logs, and analytics

---

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Next.js    │────────▶│   FastAPI   │
│   (Student) │  HTTPS  │   API Proxy  │  HTTP   │  ML Service │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                         │
                               │                         │
                               ▼                         ▼
                        ┌──────────────┐         ┌─────────────┐
                        │   Supabase   │         │   OpenCV    │
                        │  (Postgres + │         │   + Models  │
                        │   Storage +  │         └─────────────┘
                        │   Realtime)  │
                        └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Admin UI    │
                        │  (Real-time  │
                        │   Dashboard) │
                        └──────────────┘
```

### Components

1. **Next.js Frontend + Middleware**
   - Student exam interface with webcam capture
   - Admin dashboard with real-time monitoring
   - API routes (`/api/ml-proxy`, `/api/admin/*`)
   - WebRTC signaling for live viewing

2. **Python FastAPI ML Service**
   - Computer vision pipeline (face detection, gaze tracking, object detection)
   - Returns structured JSON with focus scores and alerts
   - Containerized, GPU-capable

3. **Supabase Backend**
   - PostgreSQL database with RLS
   - Storage for snapshots
   - Realtime pub/sub for live updates

4. **Redis (Optional)**
   - Job queue for snapshot processing
   - Caching layer

5. **TURN Server (Optional)**
   - WebRTC relay for live video viewing

---

## ✨ Features

### For Students

- ✅ Seamless exam experience with minimal latency
- ✅ Pre-exam device checks (camera, microphone, browser)
- ✅ Full-screen enforcement with focus detection
- ✅ Real-time focus score feedback
- ✅ Offline resilience (local buffering)
- ✅ Post-exam integrity summary

### For Admins/Proctors

- 📊 Real-time session monitoring dashboard
- 🚨 Risk leaderboard (sorted by integrity score)
- 📸 Snapshot review with timeline visualization
- 🎥 Live WebRTC video streaming
- ⚙️ Configurable detection thresholds
- 📝 Session annotations and false-positive marking
- 📁 Exportable audit logs

### ML Detections

- 👤 Face presence & count (0 or >1 triggers alert)
- 👀 Gaze tracking (looking away detection)
- 📱 Phone/object detection
- 🤲 Hand gestures near face
- 😴 Eyes closed detection
- 🎭 Liveness checks (spoofing prevention)
- 🔍 Confidence scoring with bounding boxes

---

## 🛠️ Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Recharts (data visualization)
- IndexedDB (idb) for offline storage

**Backend:**
- Next.js API Routes (Serverless)
- Python FastAPI
- Supabase (PostgreSQL + Auth + Storage + Realtime)

**ML/CV:**
- OpenCV
- Custom detection models (face, gaze, object)

**Infrastructure:**
- Docker & Docker Compose
- Redis (job queue/cache)
- Coturn (TURN server for WebRTC)

**Monitoring:**
- Sentry (error tracking)
- Prometheus + Grafana (metrics)
- PagerDuty (alerting)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.11+
- **Docker** & Docker Compose (optional, for containerized deployment)
- **Supabase** account (or self-hosted instance)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Tamatar03/fairgig.git
cd fairgig
```

2. **Install dependencies:**

```bash
# Frontend
npm install

# ML Service
cd ml-service
pip install -r requirements.txt
cd ..
```

3. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials and other configuration.

4. **Set up database:**

Follow the instructions in [`docs/database-schema.md`](./docs/database-schema.md) to create tables and RLS policies in your Supabase project.

5. **Run development servers:**

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: ML Service
cd ml-service
python main.py
```

6. **Access the application:**

- Frontend: http://localhost:3000
- ML Service: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📁 Project Structure

```
fairgig/
├── app/                      # Next.js app router pages
│   ├── api/                  # API routes
│   │   ├── ml-proxy/         # ML proxy endpoints
│   │   └── admin/            # Admin endpoints
│   ├── login/                # Login page
│   ├── signup/               # Signup page
│   ├── dashboard/            # Student dashboard
│   ├── exam/                 # Exam pages
│   │   └── [examId]/         # Dynamic exam routes
│   ├── admin/                # Admin pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── exam/                 # Exam-specific components
│   │   ├── VideoCaptureManager.tsx
│   │   ├── FrameSender.tsx
│   │   ├── LiveGauge.tsx
│   │   └── AlertList.tsx
│   └── Providers.tsx         # Context providers
├── lib/                      # Utility libraries
│   ├── supabase/             # Supabase client & helpers
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── storage.ts
│   │   └── realtime.ts
│   └── utils/                # General utilities
│       ├── device.ts
│       └── storage.ts
├── types/                    # TypeScript type definitions
│   └── index.ts
├── ml-service/               # Python ML service
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # ML service Docker image
├── docs/                     # Documentation
│   └── database-schema.md    # Database schema documentation
├── .env.example              # Environment variables template
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.js            # Next.js configuration
├── Dockerfile                # Next.js Docker image
├── docker-compose.yml        # Docker Compose orchestration
└── README.md                 # This file
```

---

## ⚙️ Configuration

### Environment Variables

See [`.env.example`](./.env.example) for all required environment variables:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret, server-side only)

**ML Service:**
- `ML_SERVICE_URL` - URL of the ML service (e.g., http://localhost:8000)
- `ML_SERVICE_KEY` - Shared secret for ML service authentication

**WebRTC/TURN:**
- `TURN_HOST`, `TURN_PORT`, `TURN_USERNAME`, `TURN_PASSWORD` - TURN server configuration

**Monitoring:**
- `SENTRY_DSN` - Sentry error tracking DSN

**Other:**
- `STORAGE_BUCKET_NAME` - Supabase storage bucket name (default: snapshots)
- `RETENTION_DEFAULT_DAYS` - Default snapshot retention period (default: 30)

---

## 💻 Development

### Running Locally

1. Start the Next.js dev server:
```bash
npm run dev
```

2. Start the ML service:
```bash
cd ml-service
python main.py
```

3. Access the app at http://localhost:3000

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

---

## 🚢 Deployment

### Docker Deployment

**Build and run with Docker Compose:**

```bash
docker-compose up --build
```

This will start:
- Next.js app on port 3000
- ML service on port 8000
- Redis on port 6379
- Coturn TURN server on ports 3478/5349

### Cloud Deployment

**Recommended platforms:**

1. **Next.js Frontend:**
   - Vercel (recommended)
   - Azure Static Web Apps
   - AWS Amplify

2. **ML Service:**
   - Azure Container Instances (ACI) or AKS
   - AWS ECS/Fargate or EKS
   - Google Cloud Run or GKE

3. **Database:**
   - Supabase (managed)
   - Self-hosted PostgreSQL (Azure Database, AWS RDS)

### CI/CD

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker images
        run: |
          docker build -t fairgig-nextjs .
          docker build -t fairgig-ml ./ml-service
      # ... push to registry and deploy
```

---

## 📚 API Documentation

### ML Proxy Endpoints

**POST /api/ml-proxy/frame**

Submit a webcam frame for ML analysis.

**Request:**
```json
{
  "sessionId": "uuid",
  "studentId": "uuid",
  "sequenceNumber": 1234,
  "frameTimestamp": "2025-12-05T00:00:00.000Z",
  "frame": "<base64 jpeg>",
  "deviceInfo": { ... },
  "localChecks": { ... }
}
```

**Response:**
```json
{
  "ml": {
    "focus_score": 0.85,
    "confidence": 0.92,
    "alerts": [...]
  },
  "server": {
    "receivedAt": "2025-12-05T00:00:00.100Z",
    "processingMs": 210
  }
}
```

### Admin Endpoints

- `GET /api/admin/sessions` - List active sessions
- `GET /api/admin/session/{sessionId}` - Get session details
- `POST /api/admin/session/{sessionId}/note` - Add admin note
- `POST /api/admin/session/{sessionId}/mark-false-positive` - Mark event as false positive
- `POST /api/admin/tune-thresholds` - Update detection thresholds

See full API documentation at http://localhost:8000/docs (FastAPI auto-generated).

---

## 🗄️ Database Schema

Complete database schema documentation is available in [`docs/database-schema.md`](./docs/database-schema.md).

**Main tables:**
- `profiles` - User accounts
- `exams` - Exam configurations
- `exam_sessions` - Active and historical exam sessions
- `cheat_scores` - Time-series ML results
- `suspicious_snapshots` - Flagged event metadata
- `video_metadata` - Full video recordings (optional)
- `audit_logs` - Immutable audit trail

**Storage:**
- `snapshots` bucket - Encrypted snapshot images

---

## 🔒 Security & Privacy

### Authentication & Authorization
- Supabase Auth with JWT tokens
- Role-based access control (RBAC): student, admin, proctor, support
- Row-Level Security (RLS) policies enforced at database level

### Data Protection
- TLS everywhere (HSTS enabled)
- Encrypted snapshot storage at rest
- Short-lived signed URLs (5 min expiry)
- Configurable retention policies (default: 30 days)

### Privacy Safeguards
- Explicit consent modal before recording
- Only snapshots of suspicious events stored (not continuous video)
- Minimal data retention by default
- Right to be forgotten support (deletion upon request)

### Tamper Resistance
- Client-side: fullscreen enforcement, focus detection, devtools detection
- Server-side: sequence number gap detection, frame validation

### Compliance
- Exportable audit logs
- Data retention policies
- Privacy policy and terms of service

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### ML Model Tests

```bash
cd ml-service
pytest
```

### Load Testing

Use tools like Artillery or k6 to simulate thousands of concurrent sessions.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- OpenCV for computer vision capabilities
- Supabase for the backend infrastructure
- Next.js and Vercel for the excellent framework
- The open-source community

---

## 📞 Support

For questions or support:
- **Email:** support@fairgig.example.com
- **Issues:** https://github.com/Tamatar03/fairgig/issues
- **Documentation:** See `/docs` folder

---

## 🗺️ Roadmap

- [ ] Advanced ML models (YOLOv8, MediaPipe)
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered false positive reduction
- [ ] Collusion detection across sessions
- [ ] Video stitching for full session replay

---

**Built with ❤️ for fair and accessible online assessments.**