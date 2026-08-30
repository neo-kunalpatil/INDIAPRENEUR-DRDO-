# DRDO Digital Twin Architecture Documentation

## Microservice Architecture & Inter-Service API Contracts

Each service operates as an independent containerized process.

### Service Ports & Protocols:
- `male_uav_frontend`: HTTP 3000 (React GCS Web Console)
- `backend-service`: HTTP / WS 8000 (REST Gateway & STANAG 4586 Telemetry Stream)
- `simulator-service`: HTTP / UDP 5001 (SCADA Engine Telemetry Generator)
- `ai-service`: HTTP 5000 (TensorRT AI Prognostics & RUL API)
- `digital-twin-service`: HTTP 5002 (3D Finite Element Physics Engine)
- `database`: PostgreSQL 5432 (TimescaleDB) & Redis 6379
