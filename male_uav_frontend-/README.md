# DRDO MALE UAV Digital Twin Ground Control Station & Maintenance Twin

A military-grade, real-time Digital Twin and Ground Control Station (GCS) telemetry monitoring system developed for the Aeronautical Development Establishment (ADE) - Defence Research & Development Organisation (DRDO).

---

## 🏛 System Architecture Overview

The system is structured as an enterprise monorepo comprising modular microservices communicating via standard REST APIs, STANAG 4586 / UDP telemetry streams, WebSockets, and Redis/Kafka message brokers.

```text
DRDO-Digital-Twin/
│
├── male_uav_frontend/          ← GCS React 19 + TypeScript + Vite Telemetry Console
├── simulator-service/          ← Real-Time Physics & SCADA Telemetry Engine Simulator
├── backend-service/            ← Core API Gateway, Authentication & Data Orchestrator
├── ai-service/                 ← Deep Neural Edge AI, Prognostics & RUL Inference
├── digital-twin-service/       ← 3D Physics Mesh, Finite Element & Heat Map Engine
├── database/                   ← TimescaleDB (PostgreSQL) & Redis Cache Ingestion
├── shared/                     ← Shared DTOs, Telemetry Schemas & API Contracts
├── deployment/                 ← Docker Compose, Nginx & Kubernetes Manifests
└── docs/                       ← System Requirement Specifications (SRS) & Architecture
```

---

## 🛰 Microservice Breakdown

### 1. `male_uav_frontend/`
- **Technology Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Three.js / Canvas 3D.
- **Responsibility:** Mission Control, Engine Live SCADA Monitoring, 3D Digital Twin, Multi-Agent AI Consensus, Maintenance Workbenches, and Tactical Alert HUD.

### 2. `simulator-service/`
- **Technology Stack:** Python / C++ High-Speed Math Engine.
- **Responsibility:** Simulates 4-stroke aero piston engines (Rotax 914 Turbo), environmental weather factors (altitude, OAT, wind), fault injection scenarios, and multi-UAV flight trajectories.

### 3. `backend-service/`
- **Technology Stack:** Node.js (NestJS / Express) or Go.
- **Responsibility:** Ground Station API Gateway, operator role authentication, WebSocket broadcast layer, STANAG 4586 telemetry ingestion, and database synchronization.

### 4. `ai-service/`
- **Technology Stack:** Python, PyTorch / TensorRT, SHAP, Fast-API.
- **Responsibility:** Computes Remaining Useful Life (RUL), Adaptive Health Index (AHI), 6-Agent AI consensus decisions, edge self-learning, and SHAP explainability waterfalls.

### 5. `digital-twin-service/`
- **Technology Stack:** C++ / Python, OpenFOAM, WebGL.
- **Responsibility:** First-principles thermodynamic gas dynamic equations (Otto cycle), 3D thermal stress heatmaps, and physics vs AI residual divergence calculations.

### 6. `database/`
- **Technology Stack:** TimescaleDB (PostgreSQL time-series extension), Redis 7.
- **Responsibility:** High-frequency 10 kHz SCADA telemetry storage, in-memory real-time state caching, and immutable digital engine logbook storage.

### 7. `shared/`
- **Responsibility:** Language-agnostic Protobuf definitions, TypeScript interfaces, OpenAPI / Swagger schemas, and telemetry DTO contracts shared across services.

### 8. `deployment/`
- **Responsibility:** Containerization manifests (`Dockerfile`, `docker-compose.yml`), Nginx reverse proxy configs, and Kubernetes helm charts.

---

## 🚀 Quick Start (Docker Compose)

To spin up the complete local Digital Twin infrastructure:

```bash
# Clone repository
git clone https://github.com/drdo-ade/uav-digital-twin.git
cd DRDO-Digital-Twin

# Start all microservices in containers
docker compose up -d --build
```

---

## 🔒 Security & Classification

- **Classification:** `RESTRICTED // FOR OFFICIAL USE ONLY - DRDO ADE`
- **Cyber Posture:** MIL-STD-1553 Avionics Compliant, Air-gapped Sandbox Compatible, AES-256 / SHA-3 Encrypted.
