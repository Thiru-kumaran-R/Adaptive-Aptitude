# PHASE 16 — DEPLOYMENT & INFRASTRUCTURE
## ARCHITECTURE PROPOSAL

```text
Document: docs/PHASE16_ARCHITECTURE_PROPOSAL.md
Version: v1.0.4-PROPOSED
Status: PROPOSED / READY FOR FINAL ARCHITECTURE GOVERNANCE VERIFICATION
Base Platform: Phases 1–15 VERIFIED / IMPLEMENTED / COMPLETE / CLOSED
Preceding Gate: Phase 15 Learner Application & Adaptive UX (v1.0.13-FROZEN / v1.0.12-FROZEN)
Implementation Authorization: NONE
Implementation Performed: NO
Date: October 2026
```

---

## 1. STATUS & METADATA

| Property | Value |
|---|---|
| **Document Target** | `docs/PHASE16_ARCHITECTURE_PROPOSAL.md` |
| **Document Version** | `v1.0.4-PROPOSED` |
| **Document Status** | `PROPOSED / READY FOR FINAL ARCHITECTURE GOVERNANCE VERIFICATION` |
| **Implementation Authorization** | `NONE` (Architecture & Governance Specification Only) |
| **Implementation Performed** | `NO` (0 production files created or modified) |
| **Preceding Gate** | Phase 15 Learner Application & Adaptive UX — Terminally Closed |
| **Phase 15 Architecture Hash** | `2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba` |
| **Phase 15 Specification Hash** | `cedf9143d99f26b05f06c755677aa8c58b14dcec97aecb63dfb24fa2ca904426` |
| **Governing Baseline** | Frozen Phase 1–14 Backend & Security Contracts + Frozen Phase 15 Learner SPA |
| **Target Infrastructure Topology** | Containerized Same-Origin Edge-Ingress Production Architecture on AWS ECS / Fargate |
| **Subsequent Gate** | Phase 16 Final Architecture Governance Verification / Freeze Decision |

### 1.1 Scope & Governance Provenance

This document establishes the authoritative production deployment and infrastructure architecture for the completed Adaptive Aptitude Platform. It reconciles `v1.0.3-PROPOSED` into `v1.0.4-PROPOSED` by resolving all remaining frozen-contract and implementation-addressability governance blockers:
- **Restored Exact Frozen Prometheus Registry (8 Families)**: Preserved the authoritative Phase 14 telemetry contract: `http_requests_total`, `http_request_duration_seconds`, `http_active_requests`, `nodejs_eventloop_lag_seconds`, `process_memory_heap_bytes`, `database_connection_status`, `database_ping_duration_seconds`, and `process_uptime_seconds`. Eliminated all invented metric families (`http_request_duration_ms`, `mongodb_connection_status`, `mongodb_ping_duration_ms`, `health_probe_status`, `phase13_lifecycle_events_total`, `auth_refresh_reuse_total`).
- **Standardized Metric Units & Validated Availability SLO**: All latency metrics standardized to seconds (`http_request_duration_seconds`, `database_ping_duration_seconds`). Fixed availability mathematics from an error-ratio expression to a valid availability formula: $1 - (\text{rate}(5\text{xx}) / \text{rate}(\text{Total})) \ge 0.999$.
- **Structured Log Security Telemetry**: Derived the `AUTH_REFRESH_REUSE_DETECTED` alert from CloudWatch Logs Metric Filters and CloudWatch Alarms without modifying backend telemetry code or creating an unauthorized Prometheus family.
- **Reconciled ADR-16-24 Alert Ownership**: Re-audited and recomputed ADR-16-24 to represent the hybrid observability architecture: CloudWatch Alarms for AWS-native/log signals and AMP Rule Groups for application Prometheus metrics, unified via an AWS SNS Topic (`aptitude-production-alerts`).
- **Classified `POLICY_GOVERNANCE_SECRET` & Defined Host CLI Boundary**: Reclassified `POLICY_GOVERNANCE_SECRET` as strictly required and fail-closed in production/staging for `scripts/managePolicy.js`. Defined its execution boundary as an authorized one-off ECS administrative task (zero web API exposure; excluded from long-running web tasks).
- **Partitioned Environment Inventory by Scope**: Categorized all runtime, build, test, CLI, collector, and IaC variables across 6 distinct scopes (A through F) with exact ownership and failure behaviors.
- **Clarified Trust Proxy Configuration**: Distinguished source default (`false` in `app.js` and `authConfig.js`) from Phase 16 production configuration (`TRUST_PROXY_HOPS=1`), fully justified by the single-hop ALB security group posture.
- **Deterministic CI/CD Pre-Production Validation (Option B)**: Replaced unsupported CodeDeploy hook claims with GitHub Actions deployment pipeline validation (`scripts/verifyProductionDeployment.js`) targeting restricted test listeners (8443 backend, 9443 frontend), maintaining 0 public test listener exposure.
- **Prometheus Cloud Map Multi-Task DNS Discovery**: Defined native `dns_sd_configs` for `backend.internal` to discover and scrape all active backend ECS task replicas dynamically.
- **Bounded Implementation Footprint**: Maintained the exact 62-file inventory with deterministic paths, classes, and zero secret exposure.

---

## 2. FROZEN UPSTREAM BASELINE (PHASES 1–15)

Phase 16 operates strictly as an infrastructure host and deployment orchestrator for the completed platform. It inherits and preserves all frozen invariants established across Phases 1 through 15:

### 2.1 Frozen Platform Invariants & Provenance Summary

```text
================================================================================
FROZEN PLATFORM PROVENANCE INVENTORY
================================================================================
Question Bank Content:          12,000 Questions (SHA-256 Verified Integrity)
Canonical Taxonomies:           24 Topics, 278 Cognitive Patterns
Prerequisite Structure:         410 Directed Graph Edges (Strict DAG, 0 Cycles)
Backend Core Runtime:           Node.js 20 LTS, Express 4.19, Mongoose 8.4
Backend Registered Endpoints:   86 Routes (80 Business Routes + 6 Auth Endpoints)
Consumed Operations:            64 Frontend-Consumed API Operations
Non-Consumed Routes:            22 Audited Non-Consumed Routes (0 Inadvertent Calls)
Backend Data Layer:             16 Mongoose Models, 16 MongoDB Collections
Backend Dependencies:           6 Runtime Dependencies, 3 Dev Dependencies
Backend Test Suite:             94 / 94 Jest Suites PASS (1,279 / 1,279 Tests)
Frontend Core Runtime:          React 18.3, React Router 6.24, TanStack Query 5.45
Frontend Route Inventory:       19 Canonical Screen Routes + 1 Redirect Record
Frontend Source Inventory:      121 / 121 Authorized Source Files (0 Unauthorized)
Frontend Dependencies:          7 Runtime Dependencies, 12 Dev Dependencies
Frontend Test Suite:            26 / 26 Vitest Suites PASS (108 / 108 Tests)
Frontend E2E Suite:             36 / 36 Playwright Tests PASS (Chromium, Firefox, WebKit)
Frontend Bundle Budget (ACC-16): Initial JS: 86,109 B (<=115 kB); Initial CSS: 3,211 B (<=20 kB);
                                Largest Lazy JS: 23,877 B (<=45 kB); Fonts: 0 B; External Scripts: 0
Accessibility Ledger (A11Y-05): 228 / 228 Pairs Recomputed PASS (0 Text <4.5, 0 Controls <3.0)
Phase 15 Acceptance Status:     ACC-01 through ACC-18: 18 / 18 PASS (Closed)
================================================================================
```

### 2.2 Immutability Rules for Phase 16

1. **Zero Application Source Modifications**: Zero edits to `adaptive-aptitude-app/src` or `adaptive-aptitude-api/src`.
2. **Zero Dependency Changes**: Zero additions or version modifications in either `package.json` or `package-lock.json`. Zero new linting or formatting dependencies.
3. **Zero Schema Mutations**: Zero new models, collections, indexes, or schema mutations in MongoDB.
4. **Zero Upstream Contract Drift**: All API route paths, wire DTO schemas, HTTP status codes, error structures, and authentication state transitions remain byte-for-byte immutable.

---

## 3. ACTUAL REPOSITORY & DEPLOYMENT ARTIFACT AUDIT

An exhaustive audit of the physical workspace was performed prior to formulating this architecture proposal. Every relevant operational artifact was inspected and classified:

| Audit Subject | Target Path / Artifact | Classification | Verification Notes / Concrete Findings |
|---|---|---|---|
| **Learner App Codebase** | `adaptive-aptitude-app/` | `EXISTS / VERIFIED` | Contains 121 authorized source files; production `dist/` built and validated against ACC-16 budgets. |
| **Backend API Codebase** | `adaptive-aptitude-api/` | `EXISTS / VERIFIED` | Contains 86 Express routes, 16 Mongoose models, and comprehensive security/observability subsystems. |
| **Governing Documents** | `docs/` | `EXISTS / VERIFIED` | Contains frozen proposals and specifications for Phases 1–15; `docs` symlinked to `adaptive-aptitude-api/docs`. |
| **Backend Package Manifest** | `adaptive-aptitude-api/package.json` | `EXISTS / VERIFIED` | Exactly 6 runtime deps (`cookie-parser`, `cors`, `dotenv`, `express`, `jsonwebtoken`, `mongoose`), 3 dev deps (`jest`, `nodemon`, `supertest`). |
| **Frontend Package Manifest** | `adaptive-aptitude-app/package.json` | `EXISTS / VERIFIED` | Exactly 7 runtime deps (`@tanstack/react-query`, `dompurify`, `lucide-react`, `marked`, `react`, `react-dom`, `react-router-dom`), 12 dev deps. |
| **Lockfiles** | `package-lock.json` (both) | `EXISTS / VERIFIED` | Version 3 lockfiles present and deterministic in both project roots. |
| **Frontend Vite Config** | `adaptive-aptitude-app/vite.config.ts` | `EXISTS / VERIFIED` | Enforces `esbuild.pure: ['console.log']`, `manifest: true`, and explicit vendor chunk splitting (`react-vendor`, `query-vendor`). |
| **Production Build Output** | `adaptive-aptitude-app/dist/` | `EXISTS / VERIFIED` | Contains fingerprinted assets, `.vite/manifest.json`, single `index.html` entry, zero uncompressed fonts. |
| **Backend Startup Entry** | `adaptive-aptitude-api/src/server.js` | `EXISTS / VERIFIED` | Implements `verifyAndEnsureStartupIndexes()` prior to listener bind; registers SIGINT/SIGTERM handlers. |
| **Environment Configuration** | Backend `src/config/authConfig.js` | `EXISTS / VERIFIED` | Consumes `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_ACCESS_KEYS`, `JWT_ACCESS_ACTIVE_KID`, `CORS_ALLOWED_ORIGINS`, etc. |
| **Backend Server Bootstrap** | `adaptive-aptitude-api/src/app.js` | `EXISTS / VERIFIED` | Sets `app.set('trust proxy', false)` (configurable via `TRUST_PROXY_HOPS`), mounts 15-stage pipeline. |
| **Liveness Probe Endpoint** | `GET /health/live` | `EXISTS / VERIFIED` | Evaluates process liveness; returns HTTP 200 `{ status: "LIVE", timestamp }`. |
| **Readiness Probe Endpoint** | `GET /health/ready` | `EXISTS / VERIFIED` | Verifies lifecycle === `RUNNING` and executes dual-deadline MongoDB ping (2000ms); returns 200 READY or 503 NOT_READY. |
| **Metrics Endpoint** | `GET /metrics` | `EXISTS / VERIFIED` | Emits Prometheus exposition text; protected by `METRICS_ENABLED` and `METRICS_SCRAPE_SECRET` bearer check. |
| **Logging Subsystem** | `adaptive-aptitude-api/src/utils/logger.js` | `EXISTS / VERIFIED` | Structured JSON to stdout with correlation context, error normalization, and secret redaction (`GEMINI_API_KEY`, etc.). |
| **Graceful Shutdown** | `server.js coordinateShutdown()` | `EXISTS / VERIFIED` | Stops listener, drains active connections (up to 10s timeout), disconnects Mongoose cleanly, exits 0. |
| **MongoDB Driver Bootstrap** | `adaptive-aptitude-api/src/config/database.js` | `EXISTS / VERIFIED` | Implements `connectDB()`, connection listeners (`connected`, `disconnected`, `error`), and `serverSelectionTimeoutMS: 5000`. |
| **Container Build Definitions** | `Dockerfile*` | `ABSENT` | No Dockerfiles currently exist in root, API, or App directories. |
| **Container Composition** | `docker-compose*.yml` | `ABSENT` | No compose manifests currently exist in repository. |
| **Kubernetes Manifests** | `k8s/`, `manifests/`, `*.yaml` | `ABSENT` | No Kubernetes resource definitions currently exist in repository. |
| **CI/CD Automation** | `.github/workflows/` | `ABSENT` | No GitHub Actions workflow files exist in repository. |
| **Deployment Scripts** | `deploy.sh`, `scripts/deploy*` | `ABSENT` | No deployment or provisioning scripts exist in repository. |
| **Reverse Proxy Config** | `nginx.conf`, `Caddyfile` | `ABSENT` | No reverse proxy configuration files exist in repository. |
| **Environment Templates** | `adaptive-aptitude-api/.env.example` | `EXISTS / VERIFIED` | Documents backend env vars; frontend environment template is `ABSENT` (defaults to `/` cleanly). |
| **Production Runbooks** | `docs/RUNBOOK.md` | `ABSENT` | Architectural proposals exist; dedicated operational runbook is absent. |

---

## 4. PHASE 16 GOALS & EXPLICIT NON-GOALS

### 4.1 Phase 16 Goals
1. **Preserve Same-Origin Ingress (W39)**: Guarantee that browser SPA traffic and browser-visible API traffic share the exact same scheme, host, and port (`https://<production-host>/` and `https://<production-host>/api/v1/*`).
2. **Deterministic Runtime Packaging**: Define immutable, non-root container packaging for both frontend (Nginx unprivileged, UID 101, port 8080) and backend (Node.js unprivileged, UID 1000, port 5000) services.
3. **Edge Security & Header Injection**: Specify production TLS termination, HSTS injection, and strict Content Security Policy (CSP) delivery matching the frozen Phase 15 contract.
4. **Secure Secret Lifecycle**: Design environment injection and secret storage architectures that prevent secret exposure in Git, Docker layers, or client bundles.
5. **Database Operational Isolation**: Define secure, non-public MongoDB Atlas replica set connection topology via AWS VPC Peering.
6. **Zero-Downtime Deployment & Rollback**: Specify an automated Blue/Green release model with health-based traffic promotion and instant rollback using AWS CodeDeploy and ALB.
7. **End-to-End CI/CD Pipeline**: Design an automated multi-stage pipeline verifying existing repository checks: typecheck, unit tests, production build, ACC-16 bundle budgets, security scans, and cross-browser tests.

### 4.2 Explicit Non-Goals
1. **No Cloud Resource Provisioning in Phase 16 Architecture**: Cloud accounts, clusters, and databases must not be created during this governance task.
2. **No Application Code Mutations**: No changes to frontend components, backend controllers, models, or algorithms.
3. **No Database Schema Changes**: No new collections, migrations, or data mutations.
4. **No CORS Expansion**: The Phase 14 backend CORS allowlist must remain untouched; W39 is solved via ingress topology, not backend loosening.
5. **No New Linting Dependencies**: CI/CD will not add or execute unbacked linting tools (`eslint`, `prettier`, etc.).
6. **No Embedded MongoDB in Production**: Production database is never an embedded container; it is an external managed replica set.
7. **No Initial CDN Deployment**: Static assets are served directly from Nginx via ALB with 1-year immutable caching; CloudFront is explicitly deferred.

---

## 5. SYSTEM CONTEXT & PRODUCTION TOPOLOGY

### 5.1 Same-Origin Production Ingress Topology (Resolution of W39)

The architectural resolution of Transport Finding W39 requires that the public learner application and the backend API share a unified origin from the perspective of the user's web browser:

```text
================================================================================
SAME-ORIGIN PRODUCTION TOPOLOGY (W39 GOVERNANCE INVARIANT)
================================================================================
                               User Web Browser
                                      │
                                      ▼ HTTPS (Port 443)
                    ┌───────────────────────────────────┐
                    │      AWS Application Load         │
                    │         Balancer (ALB)            │
                    │     https://app.example.com/      │
                    │   (Edge TLS & HSTS Injection)     │
                    └─────────────────┬─────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │ ALB Path Routing Rules                        │
              ▼                                               ▼
      Path: / or /assets/*                            Path: /api/v1/*
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     Frontend Web Server       │               │      Backend API Service      │
│ (nginx-unprivileged Container)│               │    (Node.js 20 Container)     │
│   Non-root UID 101, Port 8080 │               │  Non-root UID 1000, Port 5000 │
│   (Emits Frozen SPA CSP)      │               │   (Emits Frozen API CSP)      │
└─────────────┬─────────────────┘               └───────────────┬───────────────┘
              │ (Serves built static files)                     │
              ▼                                                 ▼
      dist/index.html & assets                        MongoDB Atlas Replica Set
                                                    (AWS VPC Peering / TLS 1.3)
================================================================================
```

### 5.2 Key Ingress Invariants
- **Unified Browser Origin**: `https://app.example.com` serves both the static web application (`/`) and the API namespace (`/api/v1/*`).
- **Zero Frontend Base URL Override**: `VITE_API_BASE_URL` is unset, `""`, or `"/"`. Frontend calls use relative paths (e.g., `/api/v1/auth/login`).
- **No Secondary API Subdomain**: Browsers NEVER issue requests to `https://api.example.com/...`.
- **Zero CORS Preflight on Same-Origin Mutations**: Operation 64 (`POST /api/v1/attribution/prescriptions`) sends `Idempotency-Key` without triggering CORS preflights because the browser recognizes the destination as same-origin.
- **Refresh Cookie Boundary**: HttpOnly cookie `refreshToken` has `Path=/api/v1/auth/refresh` and `SameSite=Strict`. Because the request is same-origin, the cookie is delivered reliably without cross-site third-party cookie restrictions.

---

## 6. WEIGHTED DECISION MATRICES (MAJOR ARCHITECTURAL DECISIONS)

### 6.1 ADR-16-01: Ingress & Reverse Proxy Architecture

- **Problem**: How to route browser traffic to the static SPA and backend API under a unified origin while terminating TLS and injecting edge security headers.
- **Constraints**: Must guarantee same-origin routing (`/` -> frontend, `/api/v1/*` -> backend); must support TLS 1.3, HSTS, and custom headers; must support health-based upstream routing.
- **Options Considered**:
  1. *Option A: Unified Reverse Proxy (AWS Application Load Balancer) Routing Path-Based Traffic*
  2. *Option B: Separate Subdomains (`app.example.com` and `api.example.com`) with Cross-Origin CORS*
  3. *Option C: Node.js Monolith Serving Static Files via Express Static Middleware*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Unified ALB Reverse Proxy | Option B: Separate Subdomains | Option C: Express Static Monolith |
|---|---|---|---|---|
| Same-Origin W39 Compatibility | 25% | **10 / 10** (Exact match) | 1 / 10 (Violates W39, breaks Op 64) | 10 / 10 (Same process) |
| Security & Isolation | 20% | **9 / 10** (Strong boundary) | 6 / 10 (Complex CORS attack surface) | 4 / 10 (Node serves static, DoS risk) |
| Operational Complexity | 15% | **8 / 10** (Standard reverse proxy) | 7 / 10 (Dual domains & certs) | 9 / 10 (Single container) |
| Performance & Asset Caching | 15% | **9 / 10** (Nginx / ALB native) | 8 / 10 (CDN native) | 4 / 10 (Node event loop blocked) |
| Zero Upstream Code Changes | 15% | **10 / 10** (0 code changes) | 0 / 10 (Requires CORS modifications) | 2 / 10 (Requires Express routes) |
| Cost Efficiency | 10% | **9 / 10** (Low resource overhead) | 8 / 10 (Dual endpoints) | 8 / 10 (Low cost) |
| **Weight Sum / Weighted Score**| **100%** | **9.25 / 10** | **4.50 / 10** | **6.35 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $25 + 20 + 15 + 15 + 15 + 10 = 100\%$ (**EXACT**)
  - Option A: $10(0.25) + 9(0.20) + 8(0.15) + 9(0.15) + 10(0.15) + 9(0.10) = 2.5 + 1.8 + 1.2 + 1.35 + 1.5 + 0.9 = \mathbf{9.25}$
  - Option B: $1(0.25) + 6(0.20) + 7(0.15) + 8(0.15) + 0(0.15) + 8(0.10) = 0.25 + 1.2 + 1.05 + 1.2 + 0 + 0.8 = \mathbf{4.50}$
  - Option C: $10(0.25) + 4(0.20) + 9(0.15) + 4(0.15) + 2(0.15) + 8(0.10) = 2.5 + 0.8 + 1.35 + 0.6 + 0.3 + 0.8 = \mathbf{6.35}$
- **Selected Option**: **Option A: Unified Reverse Proxy (AWS Application Load Balancer) Routing Path-Based Traffic**.

---

### 6.2 ADR-16-02: Frontend Delivery Model

- **Problem**: How to package and serve the compiled static SPA (`adaptive-aptitude-app/dist`).
- **Constraints**: Must support SPA client-side routing fallback (`try_files $uri $uri/ /index.html`); must deliver strict CSP headers matching Phase 15; must run non-root; must support long-lived immutable caching for fingerprinted assets and no-cache for `index.html`.
- **Options Considered**:
  1. *Option A: Containerized Lightweight Nginx Unprivileged (`nginxinc/nginx-unprivileged:alpine`) on Port 8080*
  2. *Option B: Cloud Object Storage (e.g., S3) + Cloud CDN*
  3. *Option C: Node.js-based Static File Server (`serve` package)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Containerized Nginx | Option B: Object Storage + CDN | Option C: Node `serve` |
|---|---|---|---|---|
| SPA Routing Fallback Control | 25% | **10 / 10** (Precise `try_files`) | 7 / 10 (Custom error page hacks) | 7 / 10 (Basic fallback) |
| Security Header & CSP Delivery | 25% | **10 / 10** (Declarative directives) | 6 / 10 (Cloud-specific metadata/lambdas)| 6 / 10 (Config overhead) |
| Infrastructure Portability | 20% | **10 / 10** (Runs anywhere OCI runs) | 4 / 10 (Cloud vendor lock-in) | 8 / 10 (Portable OCI) |
| Operational Complexity | 15% | **9 / 10** (Standard Dockerfile) | 6 / 10 (Bucket policies + CDN sync) | 8 / 10 (Simple Node) |
| Performance & Resource Footprint | 15% | **9 / 10** (15MB image, <10MB RAM) | 10 / 10 (Serverless) | 5 / 10 (>150MB RAM) |
| **Weight Sum / Weighted Score**| **100%** | **9.70 / 10** | **6.45 / 10** | **6.80 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $25 + 25 + 20 + 15 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.25) + 10(0.25) + 10(0.20) + 9(0.15) + 9(0.15) = 2.5 + 2.5 + 2.0 + 1.35 + 1.35 = \mathbf{9.70}$
  - Option B: $7(0.25) + 6(0.25) + 4(0.20) + 6(0.15) + 10(0.15) = 1.75 + 1.5 + 0.8 + 0.9 + 1.5 = \mathbf{6.45}$
  - Option C: $7(0.25) + 6(0.25) + 8(0.20) + 8(0.15) + 5(0.15) = 1.75 + 1.5 + 1.6 + 1.2 + 0.75 = \mathbf{6.80}$
- **Selected Option**: **Option A: Containerized Lightweight Nginx Unprivileged (`nginxinc/nginx-unprivileged:alpine`) on Port 8080**.

---

### 6.3 ADR-16-03: Production Container Platform Selection (Concrete Selection)

- **Problem**: What concrete production runtime platform should host the containerized services.
- **Constraints**: Node.js 20 LTS; non-root user; ephemeral stateless processes; horizontal scalability; graceful SIGTERM shutdown with in-flight request draining; VPC private connectivity to MongoDB Atlas; same-origin path-based routing. Weights must sum to exactly 100%.
- **Options Considered**:
  1. *Candidate 1: AWS ECS with AWS Fargate (Serverless Container Service)*
  2. *Candidate 2: Google Cloud Run (Fully Managed Container Service)*
  3. *Candidate 3: Azure Container Apps (Managed Microservices Platform)*

#### Provider-Level Weighted Evaluation Matrix (Arithmetically Recomputed)

| Evaluation Criterion | Weight | Candidate 1: AWS ECS / Fargate | Candidate 2: GCP Cloud Run | Candidate 3: Azure Container Apps |
|---|---|---|---|---|
| Same-Origin Path Ingress (ALB / Ingress)| 15% | **10 / 10** (Native ALB path routing rules)| 8 / 10 (URL Map / Serverless NEG hop) | 7 / 10 (Envoy ingress path rewriting) |
| Private MongoDB Connectivity (VPC) | 15% | **10 / 10** (Atlas VPC Peering / PrivateLink)| 9 / 10 (Serverless VPC Access connector)| 8 / 10 (VNet injection) |
| Health Probe Customization (Live/Ready) | 15% | **10 / 10** (Dual ALB ready + ECS container live)| 7 / 10 (Readiness coupled to ingress) | 8 / 10 (K8s-style probes) |
| Blue/Green Deployment Automation | 15% | **10 / 10** (Native CodeDeploy Blue/Green)| 8 / 10 (Traffic splitting revisions)| 8 / 10 (Revisions and traffic shifting) |
| Secrets Management Integration | 10% | **10 / 10** (Secrets Manager direct injection)| 9 / 10 (Secret Manager integration)| 8 / 10 (Key Vault references) |
| Operational Complexity & Maintenance | 10% | **9 / 10** (Serverless tasks, zero node patching)| 9 / 10 (Fully managed)| 8 / 10 (Underlying K8s leaks through) |
| Cost at Current Baseline Scale | 10% | **9 / 10** (0.25 vCPU / 0.5 GB Fargate baseline)| 9 / 10 (Pay-per-request / CPU)| 8 / 10 (Fixed baseline minimums) |
| GitHub Actions CI/CD Integration | 10% | **10 / 10** (Mature first-party AWS actions)| 9 / 10 (First-party auth/deploy actions)| 8 / 10 (Azure CLI / actions) |
| **Weight Sum / Weighted Score**| **100%** | **9.80 / 10** | **8.40 / 10** | **7.85 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $15 + 15 + 15 + 15 + 10 + 10 + 10 + 10 = 100\%$ (**EXACT**)
  - Candidate 1 (AWS ECS / Fargate):
    $10(0.15) + 10(0.15) + 10(0.15) + 10(0.15) + 10(0.10) + 9(0.10) + 9(0.10) + 10(0.10) = 1.5 + 1.5 + 1.5 + 1.5 + 1.0 + 0.9 + 0.9 + 1.0 = \mathbf{9.80 / 10}$
  - Candidate 2 (GCP Cloud Run):
    $8(0.15) + 9(0.15) + 7(0.15) + 8(0.15) + 9(0.10) + 9(0.10) + 9(0.10) + 9(0.10) = 1.20 + 1.35 + 1.05 + 1.20 + 0.90 + 0.90 + 0.90 + 0.90 = \mathbf{8.40 / 10}$
  - Candidate 3 (Azure Container Apps):
    $7(0.15) + 8(0.15) + 8(0.15) + 8(0.15) + 8(0.10) + 8(0.10) + 8(0.10) + 8(0.10) = 1.05 + 1.20 + 1.20 + 1.20 + 0.80 + 0.80 + 0.80 + 0.80 = \mathbf{7.85 / 10}$
  - **Arithmetic Mismatches**: **0**
- **Selected Option**: **Candidate 1: AWS ECS with AWS Fargate (Serverless Container Platform)**.

---

### 6.4 ADR-16-04: Container Boundary & Packaging Strategy

- **Problem**: Whether to package the frontend and backend into a single composite container or separate specialized containers.
- **Constraints**: Independent scaling; independent artifact versioning; security isolation; least-privilege runtime permissions.
- **Options Considered**:
  1. *Option A: Separate Containers (Nginx Frontend Container + Node.js API Container)*
  2. *Option B: Single Unified Container Running Both Services via Supervisord*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Separate Containers | Option B: Unified Composite Container |
|---|---|---|---|
| Independent Scalability | 25% | **10 / 10** (Scale API without scaling static) | 3 / 10 (Coupled scaling) |
| Security Isolation | 25% | **10 / 10** (Compromise in API cannot touch Nginx)| 4 / 10 (Shared container sandbox) |
| Build & Deployment Speed | 20% | **9 / 10** (Frontend rebuilds don't touch API) | 5 / 10 (Full rebuild on any change) |
| Operational Simplicity | 15% | **8 / 10** (Requires ingress/compose linkage) | 8 / 10 (Single runnable unit) |
| Image Footprint | 15% | **9 / 10** (Nginx ~25MB, Node ~150MB) | 5 / 10 (Combined bulky image) |
| **Weight Sum / Weighted Score**| **100%** | **9.35 / 10** | **4.70 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $25 + 25 + 20 + 15 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.25) + 10(0.25) + 9(0.20) + 8(0.15) + 9(0.15) = 2.5 + 2.5 + 1.8 + 1.2 + 1.35 = \mathbf{9.35}$
  - Option B: $3(0.25) + 4(0.25) + 5(0.20) + 8(0.15) + 5(0.15) = 0.75 + 1.0 + 1.0 + 1.2 + 0.75 = \mathbf{4.70}$
- **Selected Option**: **Option A: Separate Specialized Containers**.

---

### 6.5 ADR-16-05: TLS Termination & Edge Security Header Delivery

- **Problem**: Where to terminate TLS and where to inject HSTS, CSP, and transport security headers.
- **Constraints**: Node.js backend frozen in Phase 14 explicitly omits HSTS (`// Implements strict security headers (no Node HSTS)`); browser must receive HSTS and CSP.
- **Options Considered**:
  1. *Option A: Edge Ingress (ALB) Terminates TLS and Injects HSTS; Specialized Services Emit Own CSP*
  2. *Option B: Node.js Backend Terminates TLS Directly*
  3. *Option C: Client-Side `<meta>` Tags for Security Headers*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Edge Ingress (ALB) | Option B: Node.js Termination | Option C: Client Meta Tags |
|---|---|---|---|---|
| Phase 14 Architecture Alignment | 30% | **10 / 10** (Aligns with Phase 14 spec) | 2 / 10 (Violates Phase 14 design) | 1 / 10 (Meta tags cannot do HSTS) |
| TLS Performance & Cipher Suites | 25% | **10 / 10** (Hardware-accelerated C/OpenSSL)| 6 / 10 (V8 JS thread overhead) | 0 / 10 (Not applicable) |
| Certificate Lifecycle Automation| 25% | **10 / 10** (Automated ACM validation/renewal)| 4 / 10 (Manual file mounts & restarts)| 0 / 10 (Not applicable) |
| Operational Security | 20% | **9 / 10** (Private keys stay at ALB) | 5 / 10 (Private keys inside app) | 1 / 10 (Zero transport security) |
| **Weight Sum / Weighted Score**| **100%** | **9.80 / 10** | **4.10 / 10** | **0.50 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $30 + 25 + 25 + 20 = 100\%$ (**EXACT**)
  - Option A: $10(0.30) + 10(0.25) + 10(0.25) + 9(0.20) = 3.0 + 2.5 + 2.5 + 1.8 = \mathbf{9.80}$
  - Option B: $2(0.30) + 6(0.25) + 4(0.25) + 5(0.20) = 0.6 + 1.5 + 1.0 + 1.0 = \mathbf{4.10}$
  - Option C: $1(0.30) + 0(0.25) + 0(0.25) + 1(0.20) = 0.3 + 0 + 0 + 0.2 = \mathbf{0.50}$
- **Selected Option**: **Option A: Edge Ingress (ALB) Terminates TLS and Injects HSTS; Specialized Services Emit Own CSP**.

---

### 6.6 ADR-16-06: Secrets Management Architecture

- **Problem**: How to securely manage and inject runtime secrets into container instances without exposing credentials in repository code, Docker images, or build logs.
- **Constraints**: Zero plaintext secrets in Git, Dockerfiles, or image layers; automatic runtime IAM resolution; KMS encryption at rest; production secrets derived strictly from backend source include `MONGODB_URI`, `JWT_ACCESS_KEYS`, `METRICS_SCRAPE_SECRET`, `POLICY_GOVERNANCE_SECRET`, and optional `GEMINI_API_KEY`.
- **Options Considered**:
  1. *Option A: AWS Secrets Manager Direct Injection into ECS Task Definitions*
  2. *Option B: CI/CD Pipeline Environment Variables Injected into Container `.env` Files*
  3. *Option C: Self-Hosted HashiCorp Vault Cluster*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: AWS Secrets Manager | Option B: CI/CD `.env` Injection | Option C: Self-Hosted Vault |
|---|---|---|---|---|
| Zero Secrets in Source / Images | 35% | **10 / 10** (Injected at runtime via IAM) | 3 / 10 (Leaked into image/disk) | **10 / 10** (Dynamic secrets) |
| Automatic Runtime IAM Resolution| 30% | **10 / 10** (ECS Task Execution Role) | 6 / 10 (Requires CI credentials) | 7 / 10 (Requires Vault agent/token) |
| Operational Complexity | 20% | **9 / 10** (Native AWS managed service) | 9 / 10 (Simple but insecure) | 2 / 10 (High cluster maintenance) |
| Audit Logging & Access Policies | 15% | **10 / 10** (AWS CloudTrail + KMS logs) | 2 / 10 (No access audit trail) | 10 / 10 (Comprehensive audit logs) |
| **Weight Sum / Weighted Score** | **100%** | **9.80 / 10** | **4.95 / 10** | **7.50 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 30 + 20 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.30) + 9(0.20) + 10(0.15) = 3.50 + 3.00 + 1.80 + 1.50 = \mathbf{9.80}$
  - Option B: $3(0.35) + 6(0.30) + 9(0.20) + 2(0.15) = 1.05 + 1.80 + 1.80 + 0.30 = \mathbf{4.95}$
  - Option C: $10(0.35) + 7(0.30) + 2(0.20) + 10(0.15) = 3.50 + 2.10 + 0.40 + 1.50 = \mathbf{7.50}$
- **Selected Option**: **Option A: AWS Secrets Manager Direct Injection into ECS Task Definitions**.
- **Rationale**: Secrets are stored in AWS Secrets Manager encrypted with KMS. The ECS Task Execution Role grants least-privilege `secretsmanager:GetSecretValue` permission, allowing the Fargate agent to inject secrets into container environment variables at process bootstrap without writing credentials to disk or image layers.
- **Elimination of Alternatives**: CI/CD `.env` injection is eliminated due to credential leakage risks. Self-hosted Vault is eliminated due to unnecessary operational complexity at current scale.

---

### 6.7 ADR-16-07: CI/CD Pipeline Architecture

- **Problem**: Which CI/CD automation system should execute testing, container builds, and deployment promotion.
- **Constraints**: Must reuse existing repository test commands (`npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`); zero unbacked lint dependencies or scripts; automated container vulnerability scanning.
- **Options Considered**:
  1. *Option A: GitHub Actions Multi-Stage Workflow*
  2. *Option B: AWS CodePipeline & AWS CodeBuild*
  3. *Option C: Self-Hosted Jenkins CI*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: GitHub Actions | Option B: AWS CodePipeline | Option C: Self-Hosted Jenkins |
|---|---|---|---|---|
| Native Repository Integration | 30% | **10 / 10** (PR checks, branch protection) | 6 / 10 (Requires webhook connectors) | 5 / 10 (Webhook polling/plugins) |
| Reusability of Existing Scripts | 30% | **10 / 10** (Executes repo scripts directly) | 7 / 10 (Custom buildspec translation) | 8 / 10 (Shell pipeline steps) |
| Infrastructure Maintenance Overhead | 25% | **10 / 10** (Managed SaaS runners) | 8 / 10 (AWS managed service) | 3 / 10 (Self-hosted server patching) |
| Cost Efficiency | 15% | **9 / 10** (Free tier / per-minute billing)| 7 / 10 (CodeBuild build minute fees) | 6 / 10 (Continuous EC2 compute fees) |
| **Weight Sum / Weighted Score** | **100%** | **9.85 / 10** | **6.95 / 10** | **5.55 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $30 + 30 + 25 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.30) + 10(0.30) + 10(0.25) + 9(0.15) = 3.00 + 3.00 + 2.50 + 1.35 = \mathbf{9.85}$
  - Option B: $6(0.30) + 7(0.30) + 8(0.25) + 7(0.15) = 1.80 + 2.10 + 2.00 + 1.05 = \mathbf{6.95}$
  - Option C: $5(0.30) + 8(0.30) + 3(0.25) + 6(0.15) = 1.50 + 2.40 + 0.75 + 0.90 = \mathbf{5.55}$
- **Selected Option**: **Option A: GitHub Actions Multi-Stage Workflow**.
- **Rationale**: GitHub Actions provides native repository integration, instant PR checks, and executes existing package.json scripts without translating into external proprietary DSLs.
- **Elimination of Alternatives**: CodePipeline and Jenkins are eliminated due to unnecessary operational indirection and infrastructure overhead.

---

### 6.8 ADR-16-08: Release & Rollback Strategy (AWS CodeDeploy Blue/Green)

- **Problem**: How to deploy updates to production with zero downtime and automated instant rollback upon health failure.
- **Constraints**: ECS Fargate container tasks; dual ALB target groups (production + test); automated CloudWatch alarm integration for rollback.
- **Options Considered**:
  1. *Option A: AWS CodeDeploy Blue/Green with ALB Dual Target Groups*
  2. *Option B: ECS Rolling Deployments (MinimumHealthyPercent)*
  3. *Option C: Manual Canary Deployment via Route53 DNS Weighting*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: CodeDeploy Blue/Green | Option B: ECS Rolling Update | Option C: Route53 Canary |
|---|---|---|---|---|
| Zero-Downtime & Instant Rollback | 35% | **10 / 10** (Immediate traffic shift back) | 6 / 10 (Slow rollback task replacement) | 4 / 10 (DNS TTL propagation delay) |
| Production Test Listener Validation | 30% | **10 / 10** (Test port pre-validation) | 2 / 10 (No pre-traffic validation) | 4 / 10 (Canary gets live traffic) |
| Operational Complexity | 20% | **8 / 10** (Managed by CodeDeploy) | 9 / 10 (Simple ECS service setting) | 4 / 10 (Complex DNS & dual clusters) |
| Automated Alarm-Driven Rollback | 15% | **10 / 10** (Native CloudWatch rollback) | 6 / 10 (ECS circuit breaker only) | 4 / 10 (Manual DNS shift) |
| **Weight Sum / Weighted Score** | **100%** | **9.60 / 10** | **5.40 / 10** | **4.00 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 30 + 20 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.30) + 8(0.20) + 10(0.15) = 3.50 + 3.00 + 1.60 + 1.50 = \mathbf{9.60}$
  - Option B: $6(0.35) + 2(0.30) + 9(0.20) + 6(0.15) = 2.10 + 0.60 + 1.80 + 0.90 = \mathbf{5.40}$
  - Option C: $4(0.35) + 4(0.30) + 4(0.20) + 4(0.15) = 1.40 + 1.20 + 0.80 + 0.60 = \mathbf{4.00}$
- **Selected Option**: **Option A: AWS CodeDeploy Blue/Green with ALB Dual Target Groups**.
- **Rationale**: CodeDeploy deploys new replacement tasks (Green), validates them on a test listener (port 8443), and rapidly shifts production traffic from Blue to Green. If CloudWatch error alarms trigger during the deployment guard window, traffic immediately shifts back to Blue.
- **Elimination of Alternatives**: Rolling updates and DNS canaries are eliminated due to slow rollback times and DNS caching delays.

---

### 6.9 ADR-16-09: Frontend CSP Contract

- **Problem**: How to define and deliver the Content Security Policy for the React SPA.
- **Constraints**: Must strictly preserve the frozen Phase 15 CSP; zero `'unsafe-inline'`; `font-src 'self'`; additive hardening (`object-src 'none'`) permitted.
- **Options Considered**:
  1. *Option A: Frozen Phase 15 CSP Strictly Preserved (Zero `'unsafe-inline'`, `font-src 'self'`, `object-src 'none'`)*
  2. *Option B: Relaxed CSP with `'unsafe-inline'` or External Font CDNs*
  3. *Option C: Omission of CSP Header at Frontend Tier*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Frozen Phase 15 CSP | Option B: Relaxed CSP | Option C: Omission of CSP |
|---|---|---|---|---|
| Phase 15 Baseline Alignment | 40% | **10 / 10** (Exact frozen match) | 0 / 10 (Violates Phase 15 contract) | 0 / 10 (Violates Phase 15 contract) |
| XSS & Code Injection Mitigation | 35% | **10 / 10** (Zero unsafe-inline) | 3 / 10 (Allows inline script/style) | 0 / 10 (No CSP browser protection) |
| Browser Compatibility | 25% | **10 / 10** (Modern evergreen browsers) | 10 / 10 (Broad compatibility) | 10 / 10 (No enforcement) |
| **Weight Sum / Weighted Score** | **100%** | **10.00 / 10** | **3.55 / 10** | **2.50 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $40 + 35 + 25 = 100\%$ (**EXACT**)
  - Option A: $10(0.40) + 10(0.35) + 10(0.25) = 4.00 + 3.50 + 2.50 = \mathbf{10.00}$
  - Option B: $0(0.40) + 3(0.35) + 10(0.25) = 0 + 1.05 + 2.50 = \mathbf{3.55}$
  - Option C: $0(0.40) + 0(0.35) + 10(0.25) = 0 + 0 + 2.50 = \mathbf{2.50}$
- **Selected Option**: **Option A: Frozen Phase 15 CSP Strictly Preserved**.
- **Rationale**: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';`. All styles are compiled into external CSS bundles by Vite; all fonts are self-hosted. Zero `'unsafe-inline'`.
- **Elimination of Alternatives**: Relaxed CSP and CSP omission are strictly eliminated.

---

### 6.10 ADR-16-10: Security Header Ownership Architecture

- **Problem**: Which infrastructure tier owns which HTTP security headers to prevent duplication, conflict, or omission.
- **Constraints**: Deterministic 4-class boundary; zero modifications to Node.js backend security headers from Phase 14; ALB owns TLS/HSTS.
- **Options Considered**:
  1. *Option A: Deterministic 4-Class Ownership Boundary (ALB, Nginx, Node.js Express, AWS WAF)*
  2. *Option B: Monolithic Ingress Injects All Headers (Overriding Application Tiers)*
  3. *Option C: Application-Level Duplicate Injection Across All Layers*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Deterministic 4-Class Boundary | Option B: Monolithic Ingress | Option C: Duplicate All Layers |
|---|---|---|---|---|
| Separation of Concerns & Security Boundary | 35% | **10 / 10** (Clean responsibility mapping) | 5 / 10 (Ingress must know all app contexts) | 3 / 10 (Conflicting header policies) |
| Upstream Immutability (Phase 14 Node)| 35% | **10 / 10** (Zero backend changes) | 6 / 10 (Must strip/override app headers) | 2 / 10 (Breaks Node.js header contract) |
| Operational Debuggability | 30% | **9 / 10** (Clear origin of each header) | 5 / 10 (Headers masked at edge proxy) | 4 / 10 (Duplicate header confusion) |
| **Weight Sum / Weighted Score** | **100%** | **9.70 / 10** | **5.35 / 10** | **2.95 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 35 + 30 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.35) + 9(0.30) = 3.50 + 3.50 + 2.70 = \mathbf{9.70}$
  - Option B: $5(0.35) + 6(0.35) + 5(0.30) = 1.75 + 2.10 + 1.50 = \mathbf{5.35}$
  - Option C: $3(0.35) + 2(0.35) + 4(0.30) = 1.05 + 0.70 + 1.20 = \mathbf{2.95}$
- **Selected Option**: **Option A: Deterministic 4-Class Ownership Boundary**.
- **Rationale**:
  - Class 1 (ALB Edge): `Strict-Transport-Security` (HSTS).
  - Class 2 (Frontend Nginx): SPA CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, Static Caching.
  - Class 3 (Backend Node.js): API security headers (`Content-Security-Policy: default-src 'none'`), `Cache-Control: no-store` for authenticated routes.
  - Class 4 (AWS WAF): Perimeter traffic inspection and coarse rate-limiting responses (`429 Too Many Requests`).
- **Elimination of Alternatives**: Monolithic ingress and duplicate injection are eliminated.

---

### 6.11 ADR-16-11: Distributed Rate-Limiting Policy

- **Problem**: How to implement rate limiting across multiple backend instances without violating frozen Phase 14 in-memory contracts.
- **Constraints**: Node backend uses process-local `express-rate-limit`; zero code changes to backend; DDoS protection required.
- **Options Considered**:
  1. *Option A: Two-Layer Architecture: Edge AWS WAF Coarse IP Limits + Backend In-Memory Process-Local Limiters*
  2. *Option B: Centralized Redis-Backed Distributed Rate Limiting*
  3. *Option C: Unprotected Edge with Backend-Only Rate Limiting*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Two-Layer Architecture | Option B: Centralized Redis Limit | Option C: Backend-Only Limit |
|---|---|---|---|---|
| DDoS & Volumetric Flood Defense | 30% | **9 / 10** (WAF blocks floods at edge) | 9 / 10 (Blocks at app gateway) | 3 / 10 (App overwhelmed by floods) |
| Zero Code Changes to Backend | 30% | **10 / 10** (Preserves Phase 14 verbatim) | 2 / 10 (Requires Redis store refactor) | **10 / 10** (Preserves Phase 14 verbatim) |
| Operational Simplicity | 25% | **10 / 10** (Zero additional infrastructure) | 4 / 10 (Requires Redis cluster ops) | **10 / 10** (Zero extra infra) |
| Accuracy of Rate Governance | 15% | **9 / 10** (Defense in depth) | 10 / 10 (Global exact IP counts) | 6 / 10 (Per-process partition only) |
| **Weight Sum / Weighted Score** | **100%** | **9.55 / 10** | **5.80 / 10** | **7.30 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $30 + 30 + 25 + 15 = 100\%$ (**EXACT**)
  - Option A: $9(0.30) + 10(0.30) + 10(0.25) + 9(0.15) = 2.70 + 3.00 + 2.50 + 1.35 = \mathbf{9.55}$
  - Option B: $9(0.30) + 2(0.30) + 4(0.25) + 10(0.15) = 2.70 + 0.60 + 1.00 + 1.50 = \mathbf{5.80}$
  - Option C: $3(0.30) + 10(0.30) + 10(0.25) + 6(0.15) = 0.90 + 3.00 + 2.50 + 0.90 = \mathbf{7.30}$
- **Selected Option**: **Option A: Two-Layer Architecture: Edge AWS WAF Coarse IP Limits + Backend In-Memory Process-Local Limiters**.
- **Rationale**: Layer 1 at AWS WAF enforces a coarse IP limit (2,000 req/5min) and 100 kB payload limit at the edge with zero backend load. Layer 2 in-memory rate limiters enforce fine-grained operational protection (300 global, 5 auth, 20 refresh, 20 LLM) per task replica without introducing external Redis cluster dependencies or modifying frozen backend source code.
- **Elimination of Alternatives**: Centralized Redis is eliminated to preserve the frozen Phase 14 backend without code modification. Backend-only rate limiting is eliminated due to edge DDoS exposure.

---

### 6.12 ADR-16-12: Container Non-Root Runtime

- **Problem**: Under what user identities should container processes execute.
- **Constraints**: Principle of least privilege; zero root execution; container processes must run under dedicated non-root UIDs.
- **Options Considered**:
  1. *Option A: Strict Non-Root Execution: Nginx UID 101 on Port 8080, Node.js UID 1000 on Port 5000*
  2. *Option B: Default Root Execution on Privileged Ports (80 / 443)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Strict Non-Root Execution | Option B: Root Execution |
|---|---|---|---|
| Least Privilege & Breakout Mitigation | 50% | **10 / 10** (Restricted syscalls & permissions) | 1 / 10 (Full host root risk) |
| Cloud Security Compliance | 30% | **10 / 10** (Passes CIS benchmark & Trivy audits) | 1 / 10 (Fails container security baselines) |
| Operational Ergonomics | 20% | **9 / 10** (Requires non-privileged ports >1024) | 8 / 10 (Binds directly to 80/443) |
| **Weight Sum / Weighted Score** | **100%** | **9.80 / 10** | **2.40 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $50 + 30 + 20 = 100\%$ (**EXACT**)
  - Option A: $10(0.50) + 10(0.30) + 9(0.20) = 5.00 + 3.00 + 1.80 = \mathbf{9.80}$
  - Option B: $1(0.50) + 1(0.30) + 8(0.20) = 0.50 + 0.30 + 1.60 = \mathbf{2.40}$
- **Selected Option**: **Option A: Strict Non-Root Execution: Nginx UID 101 on Port 8080, Node.js UID 1000 on Port 5000**.
- **Rationale**: Frontend runs using official `nginxinc/nginx-unprivileged:alpine` as UID 101 on port 8080. Backend runs using official `node:20-alpine` as UID 1000 (`node`) on port 5000. Privileged ports (<1024) are avoided entirely.
- **Elimination of Alternatives**: Root execution is strictly prohibited.

---

### 6.13 ADR-16-13: Database Production Topology

- **Problem**: What database architecture should host MongoDB in production.
- **Constraints**: MongoDB 7+ multi-document ACID transactions; high availability; automated backups and point-in-time recovery; zero embedded Mongo in production.
- **Options Considered**:
  1. *Option A: MongoDB Atlas Dedicated M10+ 3-Node Replica Set in Private VPC Peering*
  2. *Option B: Self-Hosted MongoDB on ECS Fargate / EC2 with EBS Volumes*
  3. *Option C: Amazon DocumentDB (MongoDB Compatibility API)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: MongoDB Atlas M10+ | Option B: Self-Hosted ECS/EC2 | Option C: Amazon DocumentDB |
|---|---|---|---|---|
| Native MongoDB Feature Parity & ACID | 35% | **10 / 10** (100% native MongoDB engine) | 9 / 10 (Native engine, complex cluster)| 5 / 10 (DocumentDB emulation gaps) |
| Automated HA, Backups & Patching | 30% | **10 / 10** (Continuous PITR + 3-node HA) | 4 / 10 (Manual backup scripts & failover)| 9 / 10 (Managed AWS snapshots) |
| Operational Burden on Team | 20% | **10 / 10** (Zero database DBA overhead) | 2 / 10 (Heavy backup/repair burden) | 8 / 10 (Managed service) |
| Total Cost of Ownership | 15% | **8 / 10** (Transparent predictable tier) | 7 / 10 (EC2 + EBS + IOPS costs) | 7 / 10 (High baseline instance cost)|
| **Weight Sum / Weighted Score** | **100%** | **9.70 / 10** | **5.80 / 10** | **7.10 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 30 + 20 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.30) + 10(0.20) + 8(0.15) = 3.50 + 3.00 + 2.00 + 1.20 = \mathbf{9.70}$
  - Option B: $9(0.35) + 4(0.30) + 2(0.20) + 7(0.15) = 3.15 + 1.20 + 0.40 + 1.05 = \mathbf{5.80}$
  - Option C: $5(0.35) + 9(0.30) + 8(0.20) + 7(0.15) = 1.75 + 2.70 + 1.60 + 1.05 = \mathbf{7.10}$
- **Selected Option**: **Option A: MongoDB Atlas Dedicated M10+ 3-Node Replica Set in Private VPC Peering**.
- **Rationale**: MongoDB Atlas Dedicated M10+ provides guaranteed multi-document transaction support, automated failover across three availability zones, and continuous point-in-time recovery without DBA maintenance overhead.
- **Elimination of Alternatives**: Self-hosted MongoDB and DocumentDB are eliminated due to operational risk and database emulation incompatibilities.

---

### 6.14 ADR-16-14: MongoDB Private Connectivity Mode Selection

- **Problem**: How to privately and securely connect AWS ECS backend tasks to MongoDB Atlas without public internet exposure.
- **Constraints**: Atlas Dedicated Cluster (Tier M10+); zero public IP access; high availability; minimal operational complexity.
- **Options Considered**:
  1. *Option A: AWS VPC Peering (Direct non-overlapping CIDR routing)*
  2. *Option B: AWS PrivateLink (AWS Interface Endpoints to Atlas Endpoint Service)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: AWS VPC Peering | Option B: AWS PrivateLink |
|---|---|---|---|
| Network Isolation & Security | 25% | **9 / 10** (Private routing, 0 internet) | **10 / 10** (Unidirectional interface endpoint) |
| Routing & Operational Complexity | 25% | **9 / 10** (Atlas automated peering acceptor)| 7 / 10 (Requires NLB/VPC endpoint service management)|
| Atlas Tier Compatibility | 20% | **10 / 10** (Supported on M10+) | 9 / 10 (Supported on M10+) |
| Cost Efficiency (Zero Idle Fees) | 15% | **10 / 10** (Zero fixed endpoint charges)| 6 / 10 (~$7.20/mo per AZ endpoint fee + data processing)|
| Non-Overlapping CIDR Manageability| 15% | **9 / 10** (Non-overlapping CIDR allocation)| 10 / 10 (Immune to CIDR overlap) |
| **Weight Sum / Weighted Score**| **100%** | **9.35 / 10** | **8.45 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $25 + 25 + 20 + 15 + 15 = 100\%$ (**EXACT**)
  - Option A (VPC Peering): $9(0.25) + 9(0.25) + 10(0.20) + 10(0.15) + 9(0.15) = 2.25 + 2.25 + 2.0 + 1.5 + 1.35 = \mathbf{9.35}$
  - Option B (PrivateLink): $10(0.25) + 7(0.25) + 9(0.20) + 6(0.15) + 10(0.15) = 2.5 + 1.75 + 1.8 + 0.9 + 1.5 = \mathbf{8.45}$
- **Selected Option**: **Option A: AWS VPC Peering**.
- **Rationale**: With guaranteed non-overlapping CIDR blocks (`10.0.0.0/16` for the AWS application VPC and `192.168.0.0/21` for MongoDB Atlas), AWS VPC Peering provides identical network isolation (zero internet traversal) with lower routing complexity, native automated peering acceptance via Atlas API, and zero fixed hourly endpoint overhead.
- **Elimination of Alternatives**: AWS PrivateLink is eliminated for initial production.

---

### 6.15 ADR-16-15: Infrastructure-as-Code (IaC) Technology Selection

- **Problem**: Which declarative Infrastructure-as-Code tool should define and manage all AWS resources.
- **Constraints**: Must manage VPC, subnets, security groups, ECS, ALB, ACM, WAF, ECR, IAM, Secrets Manager, CloudWatch, and CodeDeploy; must integrate with GitHub Actions; weights must sum to 100%.
- **Options Considered**:
  1. *Option A: HashiCorp Terraform (v1.8+ with AWS Provider 5.x)*
  2. *Option B: AWS CloudFormation (Native YAML Templates)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Terraform | Option B: AWS CloudFormation |
|---|---|---|---|
| Multi-Environment Parameterization (.tfvars)| 20% | **10 / 10** (Native staging/prod tfvars) | 7 / 10 (Stack parameters / nested stacks) |
| State Management & Remote Locking | 20% | **9 / 10** (S3 backend + DynamoDB locking) | 8 / 10 (CloudFormation engine managed) |
| Module Ecosystem & Code Reusability | 15% | **10 / 10** (Clean local modules) | 7 / 10 (Complex nested templates) |
| GitHub Actions CI/CD Integration | 15% | **10 / 10** (setup-terraform + plan/apply) | 8 / 10 (aws-cloudformation-deploy action) |
| Execution Speed & Plan Dry-Run | 15% | **9 / 10** (Fast local/CI speculative plans)| 7 / 10 (Change sets are slow) |
| Tooling Portability & Developer Ergonomics| 15% | **9 / 10** (HCL standard) | 4 / 10 (AWS proprietary YAML/JSON) |
| **Weight Sum / Weighted Score**| **100%** | **9.50 / 10** | **6.90 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $20 + 20 + 15 + 15 + 15 + 15 = 100\%$ (**EXACT**)
  - Option A (Terraform): $10(0.20) + 9(0.20) + 10(0.15) + 10(0.15) + 9(0.15) + 9(0.15) = 2.0 + 1.8 + 1.5 + 1.5 + 1.35 + 1.35 = \mathbf{9.50}$
  - Option B (CloudFormation): $7(0.20) + 8(0.20) + 7(0.15) + 8(0.15) + 7(0.15) + 4(0.15) = 1.4 + 1.6 + 1.05 + 1.2 + 1.05 + 0.60 = \mathbf{6.90}$
- **Selected Option**: **Option A: HashiCorp Terraform (v1.8+ with AWS Provider 5.x)**.
- **Rationale**: Terraform provides superior modularization, rapid speculative execution plans (`terraform plan`), native separation of staging and production environments via dedicated `.tfvars` files, and remote state locking via S3 and DynamoDB.
- **Elimination of Alternatives**: AWS CloudFormation is eliminated. All references in governing sections are unified strictly to Terraform.

---

### 6.16 ADR-16-16: Production Logging Pipeline Selection

- **Problem**: How to collect, transport, and query structured ndjson logs from ECS Fargate container instances.
- **Constraints**: Node.js API emits structured JSON lines to stdout; must preserve correlation IDs and timestamps; minimal operational complexity; weights must sum to 100%.
- **Options Considered**:
  1. *Option A: ECS Native `awslogs` Log Driver -> AWS CloudWatch Logs*
  2. *Option B: AWS FireLens (Fluent Bit Sidecar) -> AWS CloudWatch Logs*
  3. *Option C: AWS FireLens (Fluent Bit Sidecar) -> AWS OpenSearch Service*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: ECS `awslogs` Driver | Option B: FireLens -> CloudWatch | Option C: FireLens -> OpenSearch |
|---|---|---|---|---|
| Operational Simplicity (0 Sidecars) | 30% | **10 / 10** (Built-in Fargate driver) | 6 / 10 (Sidecar container per task) | 4 / 10 (Sidecar + cluster ops) |
| Structured ndjson Field Preservation| 25% | **9 / 10** (Direct stdout capture) | 10 / 10 (Fluent Bit JSON parser) | 10 / 10 (Elasticsearch schema mapping) |
| Query Capability (Insights vs Kibana)| 20% | **9 / 10** (CloudWatch Insights JSON) | 9 / 10 (CloudWatch Insights) | 10 / 10 (Full text / Kibana) |
| Cost Efficiency at Current Scale | 15% | **9 / 10** (Pay-per-GB ingested only) | 7 / 10 (Extra vCPU/RAM sidecar fees)| 4 / 10 (High baseline domain cost) |
| Fargate Runtime Integration | 10% | **10 / 10** (Native task definition)| 8 / 10 (Firelens configuration) | 7 / 10 (VPC endpoint / auth setup) |
| **Weight Sum / Weighted Score**| **100%** | **9.40 / 10** | **7.95 / 10** | **7.00 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $30 + 25 + 20 + 15 + 10 = 100\%$ (**EXACT**)
  - Option A: $10(0.30) + 9(0.25) + 9(0.20) + 9(0.15) + 10(0.10) = 3.0 + 2.25 + 1.8 + 1.35 + 1.0 = \mathbf{9.40}$
  - Option B: $6(0.30) + 10(0.25) + 9(0.20) + 7(0.15) + 8(0.10) = 1.8 + 2.5 + 1.8 + 1.05 + 0.8 = \mathbf{7.95}$
  - Option C: $4(0.30) + 10(0.25) + 10(0.20) + 4(0.15) + 7(0.10) = 1.2 + 2.5 + 2.0 + 0.6 + 0.7 = \mathbf{7.00}$
- **Selected Option**: **Option A: ECS Native `awslogs` Log Driver -> AWS CloudWatch Logs**.
- **Rationale**: The native `awslogs` driver streams stdout directly from Fargate container tasks into AWS CloudWatch Logs Log Groups without requiring any sidecar containers, reducing memory/CPU overhead to zero. CloudWatch Logs Insights provides instant, declarative JSON querying across `correlationId`, `event`, `statusCode`, and `durationMs`.
- **Elimination of Alternatives**: AWS OpenSearch and FireLens sidecars are eliminated for initial production.

---

### 6.17 ADR-16-17: Metrics Scraping & Storage Ownership Selection

- **Problem**: What component executes internal scraping of `GET /metrics` with bearer authentication, and where are metrics stored.
- **Constraints**: Backend `GET /metrics` requires `Authorization: Bearer <METRICS_SCRAPE_SECRET>`; internal VPC access only; 15-second interval; Prometheus format.
- **Options Considered**:
  1. *Option A: Dedicated Prometheus Collector ECS Task (`prometheus-collector`) -> Amazon Managed Service for Prometheus (AMP)*
  2. *Option B: AWS Distro for OpenTelemetry (ADOT) Collector Sidecar in Every Task*
  3. *Option C: Self-Hosted Prometheus Server on EC2*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Prometheus ECS Collector -> AMP | Option B: ADOT Sidecar per Task | Option C: Self-Hosted Prometheus EC2 |
|---|---|---|---|---|
| Zero Sidecar Overhead on Backend Tasks| 30% | **10 / 10** (Dedicated isolated task) | 5 / 10 (Sidecar memory/CPU overhead) | **10 / 10** (External server) |
| Secure Bearer Secret Injection via IAM | 25% | **10 / 10** (Secrets Manager secret injection)| 9 / 10 (Secrets Manager injection) | 5 / 10 (Static secret file management) |
| Managed Storage & Retention Scaling | 25% | **10 / 10** (AMP fully managed Prometheus) | 10 / 10 (AMP fully managed) | 4 / 10 (Manual EBS disk management) |
| Operational Complexity | 20% | **9 / 10** (Single internal Fargate task) | 7 / 10 (Multi-container task defs) | 4 / 10 (EC2 OS patching & backups) |
| **Weight Sum / Weighted Score** | **100%** | **9.80 / 10** | **7.65 / 10** | **6.05 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $30 + 25 + 25 + 20 = 100\%$ (**EXACT**)
  - Option A: $10(0.30) + 10(0.25) + 10(0.25) + 9(0.20) = 3.00 + 2.50 + 2.50 + 1.80 = \mathbf{9.80}$
  - Option B: $5(0.30) + 9(0.25) + 10(0.25) + 7(0.20) = 1.50 + 2.25 + 2.50 + 1.40 = \mathbf{7.65}$
  - Option C: $10(0.30) + 5(0.25) + 4(0.25) + 4(0.20) = 3.00 + 1.25 + 1.00 + 0.80 = \mathbf{6.05}$
- **Selected Option**: **Option A: Dedicated Prometheus Collector ECS Task (`prometheus-collector`) -> Amazon Managed Service for Prometheus (AMP)**.
- **Specification**:
  - **Metrics Scraper Owner**: **Dedicated Prometheus Collector ECS Task (`prometheus-collector`)**. Runs as an internal service on ECS Fargate within the private VPC.
  - **Service Discovery**: AWS Cloud Map Private DNS Namespace `internal` (`aws_service_discovery_private_dns_namespace` + `aws_service_discovery_service`) registers `backend.internal` to backend task private IPs with a 10s TTL, automatically updated upon task replacement.
  - **Scrape Configuration**: Scrapes `http://backend.internal:5000/metrics` every 15s using version-controlled template `docker/prometheus/prometheus.yml.tpl`.
  - **Secret Injection**: Injected via AWS Secrets Manager: task definition injects `METRICS_SCRAPE_SECRET` into the container environment; bootstrap script `docker/prometheus/entrypoint.sh` writes it to `/tmp/prometheus/secrets/scrape_token` (`chmod 0600`), unsets the variable, and executes Prometheus. Zero secrets in Git, images, or logs.
  - **Metrics Storage**: **Amazon Managed Service for Prometheus (AMP)** via `remote_write` endpoint with native AWS SigV4 authentication via ECS task role (`aps:RemoteWrite`).
  - **Visualization & Alerting**: Amazon CloudWatch Dashboards for infrastructure metrics; Amazon Managed Grafana for AMP Prometheus metrics; CloudWatch Alarms and AMP Rule Groups route alerts to a unified AWS SNS topic.
- **Elimination of Alternatives**: ADOT sidecars and self-hosted EC2 instances are eliminated.

---

### 6.18 ADR-16-18: Static Asset CDN Policy Selection

- **Problem**: Whether an edge Content Delivery Network (e.g., AWS CloudFront) is part of the initial production deployment.
- **Constraints**: Must guarantee same-origin browser topology (W39); total built frontend bundle is ~100 kB gzipped; must avoid edge cache invalidation races during Blue/Green deployments.
- **Options Considered**:
  1. *Option A: INITIAL PRODUCTION CDN: NONE (Direct ALB + Containerized Nginx Serving)*
  2. *Option B: AWS CloudFront CDN Edge Distribution at Initial Deployment*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: INITIAL CDN: NONE (Direct ALB) | Option B: CloudFront at Launch |
|---|---|---|---|
| Same-Origin W39 Invariant Preservation | 35% | **10 / 10** (Single ALB origin, 0 CDN routing bugs) | 8 / 10 (Requires complex origin path behaviors)|
| Deployment Simplicity & 0 Cache Invalidation | 30% | **10 / 10** (Instant Blue/Green switch, 0 edge lag) | 6 / 10 (Requires CloudFront cache invalidation) |
| Latency at Baseline Geographic Scope | 20% | **9 / 10** (<2ms Nginx serve, <50ms regional TLS) | **10 / 10** (Edge point of presence caching) |
| Cost Efficiency at Current Scale | 15% | **10 / 10** ($0 extra CDN distribution cost) | 7 / 10 (CloudFront request & invalidation fees)|
| **Weight Sum / Weighted Score** | **100%** | **9.80 / 10** | **7.65 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 30 + 20 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.30) + 9(0.20) + 10(0.15) = 3.50 + 3.00 + 1.80 + 1.50 = \mathbf{9.80}$
  - Option B: $8(0.35) + 6(0.30) + 10(0.20) + 7(0.15) = 2.80 + 1.80 + 2.00 + 1.05 = \mathbf{7.65}$
- **Selected Option**: **INITIAL PRODUCTION CDN: NONE**.
- **Rationale**:
  1. The total compressed static bundle size is extremely compact (initial JS 86 kB, CSS 3 kB, HTML <1 kB), well within the ACC-16 budget.
  2. The static frontend Nginx container serves these assets from local memory in <2 ms.
  3. Direct serving through the AWS Application Load Balancer natively guarantees the unified origin contract (`/` and `/api/v1/*`) without requiring CloudFront origin-request behaviors or cache invalidation steps during Blue/Green releases.
  4. Fingerprinted static assets have 1-year immutable browser caching (`Cache-Control: public, max-age=31536000, immutable`), ensuring clients download assets only once.
  5. CloudFront is explicitly cataloged as a deferred future optimization when multi-region geographic edge distribution becomes an active business requirement.
- **Elimination of Alternatives**: Edge CDN is deferred for initial launch.

---

### 6.19 ADR-16-19: Local Container Parity

- **Problem**: How to provide local multi-container development and testing parity for engineers without impacting production ECS configuration.
- **Constraints**: Single-command startup (`docker compose up`); links ingress proxy, frontend, backend, and isolated test mongo; decoupled from AWS cloud resources.
- **Options Considered**:
  1. *Option A: Dedicated `docker-compose.local.yml` Manifest*
  2. *Option B: Single Shared Compose File Attempting Both Local and Production*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Dedicated `docker-compose.local.yml` | Option B: Shared Compose File |
|---|---|---|---|
| Decoupling from Production ECS Configuration | 40% | **10 / 10** (Production uses pure Terraform ECS) | 3 / 10 (Confusing ECS compose integrations)|
| Local Developer Ergonomics | 35% | **10 / 10** (Clean local test database & ports) | 5 / 10 (Polluted with cloud overrides) |
| Parity with Ingress Routing & Network Topology | 25% | **9 / 10** (Simulates ALB via local Nginx) | 6 / 10 (Compromised networking) |
| **Weight Sum / Weighted Score** | **100%** | **9.75 / 10** | **4.45 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $40 + 35 + 25 = 100\%$ (**EXACT**)
  - Option A: $10(0.40) + 10(0.35) + 9(0.25) = 4.00 + 3.50 + 2.25 = \mathbf{9.75}$
  - Option B: $3(0.40) + 5(0.35) + 6(0.25) = 1.20 + 1.75 + 1.50 = \mathbf{4.45}$
- **Selected Option**: **Option A: Dedicated `docker-compose.local.yml` Manifest**.
- **Rationale**: Keeps production ECS Fargate Terraform architecture completely clean while providing developers with an instant local simulation including path-based routing, test database isolation, and identical container images.
- **Elimination of Alternatives**: Shared compose files are eliminated.

---

### 6.20 ADR-16-20: Static Asset Caching Strategy

- **Problem**: How to configure browser caching headers for the React SPA to optimize performance while guaranteeing instant deployment updates.
- **Constraints**: Instant visibility of newly deployed code without stale bundle conflicts; fast repeat page loads.
- **Options Considered**:
  1. *Option A: Differentiated Caching: 1-Year Immutable (`max-age=31536000, immutable`) for Fingerprinted Assets + Strict `no-cache` for `index.html`*
  2. *Option B: Uniform Short TTL (e.g. 5 minutes) Across All Assets*
  3. *Option C: Omission of Caching Headers (Client Browser Default)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Differentiated Caching | Option B: Uniform Short TTL | Option C: Omission of Headers |
|---|---|---|---|---|
| Instant Deployment Update Visibility | 40% | **10 / 10** (Zero stale `index.html` cache) | 6 / 10 (5-minute stale window) | 2 / 10 (Browser heuristic caching)|
| Bandwidth & Repeat-Load Latency Optimization | 35% | **10 / 10** (Zero redundant asset downloads) | 4 / 10 (Re-fetches assets every 5 min) | 1 / 10 (Unpredictable revalidation)|
| Caching Correctness Across Builds | 25% | **10 / 10** (Vite content hash guarantees uniqueness)| 6 / 10 (Risk of hash mismatch) | 2 / 10 (Cache corruption risk) |
| **Weight Sum / Weighted Score** | **100%** | **10.00 / 10** | **5.30 / 10** | **1.65 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $40 + 35 + 25 = 100\%$ (**EXACT**)
  - Option A: $10(0.40) + 10(0.35) + 10(0.25) = 4.00 + 3.50 + 2.50 = \mathbf{10.00}$
  - Option B: $6(0.40) + 4(0.35) + 6(0.25) = 2.40 + 1.40 + 1.50 = \mathbf{5.30}$
  - Option C: $2(0.40) + 1(0.35) + 2(0.25) = 0.80 + 0.35 + 0.50 = \mathbf{1.65}$
- **Selected Option**: **Option A: Differentiated Caching: 1-Year Immutable (`max-age=31536000, immutable`) for Fingerprinted Assets + Strict `no-cache` for `index.html`**.
- **Rationale**: Nginx serves `/assets/*` with `Cache-Control: public, max-age=31536000, immutable` (Vite fingerprints ensure file content immutability). The entrypoint `/index.html` is served with `Cache-Control: no-cache, no-store, must-revalidate`, guaranteeing clients immediately receive new bundle hashes upon release.
- **Elimination of Alternatives**: Uniform TTL and header omission are eliminated.

---

### 6.21 ADR-16-21: CodeDeploy Dual-Service Artifact Ownership

- **Problem**: How to manage AWS CodeDeploy AppSpec and ECS Task Definition deployment artifacts for two independent ECS services (`frontend` and `backend`).
- **Constraints**: Deterministic, version-controlled deployment specifications; ECS CodeDeploy governance is strictly service-scoped; zero manual AWS console editing; automated deployment execution via GitHub Actions.
- **Options Considered**:
  1. *Option A: Dual Version-Controlled Deployment Manifest Templates (`docker/appspec-frontend.yml` & `docker/appspec-backend.yml`) with CI-Rendered Task Definitions*
  2. *Option B: Dynamically Generated AppSpecs Entirely in CI Runner Memory*
  3. *Option C: Manual AWS Console Blue/Green Task Definition Swapping*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Dual Version-Controlled Templates | Option B: In-Memory CI Generation | Option C: Manual Console Swapping |
|---|---|---|---|---|
| Auditability & Declarative Traceability | 40% | **10 / 10** (Tracked in Git repository) | 5 / 10 (Ephemeral in CI logs only) | 1 / 10 (Zero audit trail) |
| CI/CD Reproducibility | 35% | **10 / 10** (Deterministic parameter substitution)| 8 / 10 (Dependent on runner scripts) | 2 / 10 (Prone to human error) |
| CodeDeploy ECS Specification Compliance | 25% | **10 / 10** (Exact official CodeDeploy schema) | 8 / 10 (Schema errors caught at runtime) | 5 / 10 (Console schema verification) |
| **Weight Sum / Weighted Score** | **100%** | **10.00 / 10** | **6.80 / 10** | **2.35 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $40 + 35 + 25 = 100\%$ (**EXACT**)
  - Option A: $10(0.40) + 10(0.35) + 10(0.25) = 4.00 + 3.50 + 2.50 = \mathbf{10.00}$
  - Option B: $5(0.40) + 8(0.35) + 8(0.25) = 2.00 + 2.80 + 2.00 = \mathbf{6.80}$
  - Option C: $1(0.40) + 2(0.35) + 5(0.25) = 0.40 + 0.70 + 1.25 = \mathbf{2.35}$
- **Selected Option**: **Option A: Dual Version-Controlled Deployment Manifest Templates (`docker/appspec-frontend.yml` & `docker/appspec-backend.yml`) with CI-Rendered Task Definitions**.
- **Rationale**: AWS ECS CodeDeploy governs deployments per ECS service. The repository maintains two distinct templates: `docker/appspec-frontend.yml` (specifying container `frontend` on port 8080 targeting frontend blue/green target groups) and `docker/appspec-backend.yml` (specifying container `backend` on port 5000 targeting backend blue/green target groups). The CI/CD deploy workflow substitutes the dynamically generated Task Definition ARNs into each template independently and invokes CodeDeploy for each service in deterministic order.
- **Elimination of Alternatives**: Ephemeral in-memory generation and manual console swapping are eliminated. Multi-service single-AppSpec designs are strictly prohibited by AWS CodeDeploy architecture.

---

### 6.22 ADR-16-22: Container Registry Architecture

- **Problem**: Where to store and scan production container images for frontend and backend services.
- **Constraints**: Secure private registry; native integration with AWS ECS Fargate; automated vulnerability scanning; fast regional pull times.
- **Options Considered**:
  1. *Option A: Amazon Elastic Container Registry (ECR) Private Repositories*
  2. *Option B: Docker Hub Private Repositories*
  3. *Option C: GitHub Container Registry (ghcr.io)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Amazon ECR Private Repositories | Option B: Docker Hub Private | Option C: GitHub Packages (ghcr.io) |
|---|---|---|---|---|
| AWS IAM & ECS Fargate Native Integration | 30% | **10 / 10** (Zero external credentials, IAM auth) | 5 / 10 (Requires Docker Hub secrets/tokens)| 7 / 10 (Requires external registry auth) |
| Automated Image Vulnerability Scanning | 25% | **10 / 10** (Native AWS Inspector / Trivy scan) | 7 / 10 (Docker Hub basic scan) | 8 / 10 (GitHub Dependabot / Trivy) |
| Network Ingestion Latency & Regional Transfer | 25% | **10 / 10** (Same-region VPC endpoint, 0 egress fee)| 5 / 10 (Public internet pull, rate limits)| 6 / 10 (Internet pull latency) |
| CI/CD GitHub Actions Integration | 20% | **9 / 10** (aws-actions/amazon-ecr-login) | 8 / 10 (docker/login-action) | **10 / 10** (Native GITHUB_TOKEN auth) |
| **Weight Sum / Weighted Score** | **100%** | **9.80 / 10** | **6.10 / 10** | **7.60 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $30 + 25 + 25 + 20 = 100\%$ (**EXACT**)
  - Option A: $10(0.30) + 10(0.25) + 10(0.25) + 9(0.20) = 3.00 + 2.50 + 2.50 + 1.80 = \mathbf{9.80}$
  - Option B: $5(0.30) + 7(0.25) + 5(0.25) + 8(0.20) = 1.50 + 1.75 + 1.25 + 1.60 = \mathbf{6.10}$
  - Option C: $7(0.30) + 8(0.25) + 6(0.25) + 10(0.20) = 2.10 + 2.00 + 1.50 + 2.00 = \mathbf{7.60}$
- **Selected Option**: **Option A: Amazon Elastic Container Registry (ECR) Private Repositories**.
- **Rationale**: Amazon ECR private repositories provide direct IAM authentication for ECS Fargate tasks (via VPC endpoints with zero internet data egress costs), automated image scanning on push, and seamless integration with GitHub Actions via `aws-actions/amazon-ecr-login`.
- **Elimination of Alternatives**: Docker Hub and GHCR are eliminated due to public internet pull overhead, rate limits, and external credential dependencies.

---

### 6.23 ADR-16-23: TLS Certificate Management

- **Problem**: How to issue, validate, and renew TLS certificates for the public Application Load Balancer.
- **Constraints**: TLS 1.3 support; automated zero-touch renewal without service disruption; zero private keys stored on application filesystems.
- **Options Considered**:
  1. *Option A: AWS Certificate Manager (ACM) with Route53 DNS Validation*
  2. *Option B: Let's Encrypt via Certbot Sidecar / Renewal Hook*
  3. *Option C: Manually Uploaded Commercial SSL/TLS Certificates*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: AWS Certificate Manager (ACM) | Option B: Let's Encrypt Certbot | Option C: Manually Uploaded Certs |
|---|---|---|---|---|
| Zero-Touch Automatic Renewal | 35% | **10 / 10** (Fully automated via Route53 DNS) | 7 / 10 (Requires renewal cron/sidecar) | 2 / 10 (Manual cert purchasing/renewal) |
| AWS ALB Native Integration (0 disk keys) | 30% | **10 / 10** (Direct attachment to ALB listener)| 4 / 10 (Requires cert syncing to AWS) | 7 / 10 (IAM / ACM import required) |
| Cost & License Overhead | 20% | **10 / 10** (Free public certificates) | 10 / 10 (Free public certificates) | 3 / 10 (Recurring commercial license fee)|
| Operational Resilience & Auditability | 15% | **9 / 10** (AWS CloudTrail auditable) | 6 / 10 (Failure risk on rate limits) | 5 / 10 (Risk of expired cert outages) |
| **Weight Sum / Weighted Score** | **100%** | **9.85 / 10** | **6.55 / 10** | **4.15 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 30 + 20 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.30) + 10(0.20) + 9(0.15) = 3.50 + 3.00 + 2.00 + 1.35 = \mathbf{9.85}$
  - Option B: $7(0.35) + 4(0.30) + 10(0.20) + 6(0.15) = 2.45 + 1.20 + 2.00 + 0.90 = \mathbf{6.55}$
  - Option C: $2(0.35) + 7(0.30) + 3(0.20) + 5(0.15) = 0.70 + 2.10 + 0.60 + 0.75 = \mathbf{4.15}$
- **Selected Option**: **Option A: AWS Certificate Manager (ACM) with Route53 DNS Validation**.
- **Rationale**: ACM manages certificate issuance and automatic renewal with zero administrative touch via Route53 DNS validation records defined in Terraform. Private keys never touch filesystem disks or container instances, terminating directly in ALB hardware security modules.
- **Elimination of Alternatives**: Certbot and manual commercial certificates are eliminated due to operational fragility and renewal outage risks.

---

### 6.24 ADR-16-24: Observability Alert Ownership

- **Problem**: Which system owns operational threshold monitoring and alerting for AWS-native infrastructure, logs, and Prometheus application metrics.
- **Constraints**: Deterministic metric source ownership; zero false CloudWatch-on-AMP claims; P1/P2 alert severity; unified alert notification dispatch.
- **Options Considered**:
  1. *Option A: Hybrid Partitioned Observability: CloudWatch Alarms (AWS-Native & Logs) + AMP Rule Groups (Prometheus Metrics) via Unified SNS Topic*
  2. *Option B: Single-Engine CloudWatch Metric Ingestion (Pushing all Prometheus Metrics to CloudWatch via ADOT)*
  3. *Option C: External Third-Party SaaS (Datadog / PagerDuty Direct Integration)*

#### Weighted Evaluation Matrix

| Criterion | Weight | Option A: Hybrid Partitioned Observability | Option B: CloudWatch Ingestion (ADOT) | Option C: External SaaS (Datadog/PagerDuty) |
|---|---|---|---|---|
| Metric Source Alignment & Native Evaluation | 35% | **10 / 10** (CloudWatch for AWS, AMP for PromQL)| 6 / 10 (High conversion overhead and lag)| 7 / 10 (Requires external exporters) |
| Operational Simplicity & Zero Agent Overhead| 30% | **10 / 10** (Zero app sidecars; dedicated scraper)| 5 / 10 (Requires ADOT collector sidecars)| 6 / 10 (Agent configuration & maintenance)|
| Cost Efficiency & Metric Scalability | 20% | **10 / 10** (AMP storage pennies/GB; native CW)| 4 / 10 (High CW custom metric fees) | 4 / 10 (High baseline per-host SaaS fee) |
| Unified Alert Routing & Extensibility | 15% | **10 / 10** (Both engines route to unified SNS)| 9 / 10 (CloudWatch to SNS only) | **10 / 10** (Rich native incident escalation)|
| **Weight Sum / Weighted Score** | **100%** | **10.00 / 10** | **5.75 / 10** | **6.55 / 10** |

- **Arithmetic Audit**:
  - Weight Sum: $35 + 30 + 20 + 15 = 100\%$ (**EXACT**)
  - Option A: $10(0.35) + 10(0.30) + 10(0.20) + 10(0.15) = 3.50 + 3.00 + 2.00 + 1.50 = \mathbf{10.00}$
  - Option B: $6(0.35) + 5(0.30) + 4(0.20) + 9(0.15) = 2.10 + 1.50 + 0.80 + 1.35 = \mathbf{5.75}$
  - Option C: $7(0.35) + 6(0.30) + 4(0.20) + 10(0.15) = 2.45 + 1.80 + 0.80 + 1.50 = \mathbf{6.55}$
- **Selected Option**: **Option A: Hybrid Partitioned Observability: CloudWatch Alarms (AWS-Native & Logs) + AMP Rule Groups (Prometheus Metrics) via Unified SNS Topic**.
- **Rationale**: Explicitly partitions alert evaluation by metric origin:
  1. AWS-native metrics (ALB 5xx, Target response time, ECS CPU/Memory, container restarts, CodeDeploy state) and CloudWatch Logs-derived metrics (Metric Filter on `AUTH_REFRESH_REUSE_DETECTED`) are evaluated directly by CloudWatch Alarms.
  2. Frozen Prometheus application metrics (`http_requests_total`, `http_request_duration_seconds`, `database_connection_status`, `database_ping_duration_seconds`, `http_active_requests`) are evaluated natively within AMP using PromQL alert rule groups.
  3. Both alert engines dispatch notifications to the identical AWS SNS topic (`aptitude-production-alerts`).
- **Elimination of Alternatives**: Pushing Prometheus metrics to CloudWatch via ADOT is eliminated due to custom metric cost and cardinality explosion; external SaaS is eliminated to avoid recurring license overhead and external dependencies.

---

## 7. DETAILED REQUEST-FLOW DIAGRAMS

The production infrastructure handles nine canonical traffic flows across distinct security trust boundaries:

```text
================================================================================
REQUEST FLOW 1 & 2: LEARNER SPA & ASSETS DELIVERY
================================================================================
Browser                  ALB Edge (Port 443)         Static Nginx (Port 8080)
   │                             │                              │
   ├── GET / ───────────────────►│                              │
   │                             ├── Forward to frontend-tg ───►│
   │                             │                              ├── Read dist/index.html
   │                             │◄── 200 OK + Frozen SPA CSP ──┤ (Cache-Control: no-cache)
   │◄── 200 OK + HSTS + HTML ────┤                              │
   │                             │                              │
   ├── GET /assets/app-[hash].js►│                              │
   │                             ├── Forward to frontend-tg ───►│
   │                             │                              ├── Read fingerprinted file
   │                             │◄── 200 OK + Immutable Cache ─┤ (max-age=31536000)
   │◄── 200 OK + Asset Body ─────┤                              │
================================================================================
```

```text
================================================================================
REQUEST FLOW 3 & 4: AUTHENTICATION LOGIN & TOKEN REFRESH
================================================================================
Browser                  ALB Edge (Port 443)         Node.js API (Port 5000)      MongoDB Atlas
   │                             │                              │                        │
   ├── POST /api/v1/auth/login ─►│                              │                        │
   │   (Body: email, password)   ├── Forward to backend-tg ────►│                        │
   │                             │   (No CORS preflight)        ├── Verify scrypt hash ─►│
   │                             │                              ├── Create AuthSession ─►│
   │                             │◄── 200 OK + Set-Cookie ──────┤                        │
   │◄── 200 OK + JWT in Body ────┤    (HttpOnly, Strict)        │                        │
   │    & refreshToken Cookie    │                              │                        │
   │                             │                              │                        │
   ├── POST /api/v1/auth/refresh►│                              │                        │
   │   (Cookie: refreshToken)    ├── Forward to backend-tg ────►│                        │
   │                             │                              ├── Rotate AuthSession ─►│
   │                             │◄── 200 OK + Set-Cookie ──────┤   (Single-flight)      │
   │◄── 200 OK + Rotated JWT ────┤    (Rotated refresh token)   │                        │
================================================================================
```

```text
================================================================================
REQUEST FLOW 5 & 6: AUTH USER PROFILE & ATTRIBUTION PRESCRIPTIONS (OP 64)
================================================================================
Browser                  ALB Edge (Port 443)         Node.js API (Port 5000)      MongoDB Atlas
   │                             │                              │                        │
   ├── GET /api/v1/auth/me ─────►│                              │                        │
   │   (Header: Bearer JWT)      ├── Forward to backend-tg ────►│                        │
   │                             │                              ├── Query user/session ─►│
   │◄── 200 OK + User Object ────┼── 200 OK + JSON Body ────────┤                        │
   │                             │                              │                        │
   ├── POST /api/v1/attribution/ │                              │                        │
   │        prescriptions ──────►│                              │                        │
   │   (Headers: Bearer JWT,     ├── Forward to backend-tg ────►│                        │
   │    Idempotency-Key)         │   (SAME-ORIGIN:              ├── Check/Set Key ──────►│
   │                             │    Zero CORS preflight)      ├── Issue Prescription ─►│
   │◄── 201 Created / 200 Replay─┼── 201/200 + Payload ─────────┤                        │
================================================================================
```

```text
================================================================================
REQUEST FLOW 7, 8 & 9: HEALTH PROBES & METRICS SCRAPING
================================================================================
ECS / ALB / Scraper      ALB Edge (Blocked)          Node.js API (Direct VPC)     MongoDB Atlas
   │                             │                              │                        │
   ├── GET /health/live ───────────────────────────────────────►│ (Liveness Probe)       │
   │◄── 200 OK { status: "LIVE" } ─────────────────────────────┤                        │
   │                                                            │                        │
   ├── GET /health/ready ──────────────────────────────────────►│ (Readiness Probe)      │
   │                                                            ├── Dual-deadline ping ─►│
   │◄── 200 READY / 503 NOT_READY ─────────────────────────────┤   (2000ms timeout)      │
   │                                                            │                        │
   ├── GET /metrics ───────────────────────────────────────────►│ (Prometheus Collector) │
   │   (Header: Bearer ScrapeSecret)                            │                        │
   │◄── 200 OK (Prometheus text body) ──────────────────────────┤                        │
================================================================================
```

### 5.3 Endpoint Access Control Matrix

| Endpoint | Protocol / Method | Network Exposure | Authentication / Authorization | Intended Consumer |
|---|---|---|---|---|
| `/` | HTTPS GET | Public Internet | Public | Learner Web Browser |
| `/assets/*` | HTTPS GET | Public Internet | Public (Fingerprinted Static) | Learner Web Browser |
| `/api/v1/auth/login` | HTTPS POST | Public Internet | Public (IP/Email Rate-Limited) | Learner Web Browser |
| `/api/v1/auth/refresh` | HTTPS POST | Public Internet | HttpOnly Refresh Cookie | Learner Web Browser |
| `/api/v1/auth/me` | HTTPS GET | Public Internet | Authorization: Bearer JWT | Learner Web Browser |
| `/api/v1/attribution/prescriptions`| HTTPS POST | Public Internet | Bearer JWT + Idempotency-Key | Learner Web Browser (Same-Origin) |
| `/health` | HTTP GET | Internal VPC Only | Public Internal | Legacy Orchestrators |
| `/health/live` | HTTP GET | Internal VPC Only | Public Internal | Container Orchestrator Liveness |
| `/health/ready` | HTTP GET | Internal VPC Only | Public Internal | Container Orchestrator Readiness |
| `/metrics` | HTTP GET | Internal VPC Only | Bearer `METRICS_SCRAPE_SECRET` | Prometheus Collector Task |

*Security Invariant*: ALB rules explicitly block external public access to `/health`, `/health/live`, `/health/ready`, and `/metrics`. These are accessible solely over the private container VPC network.

---

## 8. SECURITY ARCHITECTURE: TLS, HSTS, CSP, & HEADERS

### 8.1 TLS Termination Policy
- **Minimum Protocol**: TLS 1.2 (TLS 1.0 and 1.1 explicitly disabled). Preferred: **TLS 1.3**.
- **Cipher Suites (TLS 1.2)**: `ECDHE-ECDSA-AES128-GCM-SHA256`, `ECDHE-RSA-AES128-GCM-SHA256`, `ECDHE-ECDSA-AES256-GCM-SHA384`, `ECDHE-RSA-AES256-GCM-SHA384`.
- **Cipher Suites (TLS 1.3)**: `TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`.
- **Certificate Management**: Automated via AWS Certificate Manager (ACM) with automated DNS validation and renewal.
- **HTTP Redirection**: All plaintext HTTP requests on port 80 are permanently redirected via `HTTP 301 Moved Permanently` to `https://<host><request_uri>` at the ALB listener.

### 8.2 HSTS Policy
- **Header**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Max-Age**: 31,536,000 seconds (exactly 1 year).
- **includeSubDomains**: Enforced to protect the entire domain namespace.
- **Preload Decision**: `preload` flag is deferred during initial Phase 16 deployment until production domain stability is proven for at least 90 continuous days.

### 8.3 Content Security Policy (CSP) Specifications

Two distinct, non-conflicting CSP policies govern the platform, strictly matching the frozen specifications:

#### 1. Learner SPA Frontend CSP (Delivered by Static Frontend Nginx on `/` and HTML responses)
```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';
```
- `default-src 'self'`: Restricts resource loading to the origin.
- `script-src 'self'`: Permits only local Vite-built bundles. Zero external third-party scripts. Zero `'unsafe-eval'`.
- `style-src 'self'`: Permits Vite CSS chunks. **`'unsafe-inline'` is strictly ABSENT**. CSS Modules compile into external Vite-generated CSS stylesheets and do not require inline style execution.
- `img-src 'self' data:`: Permits local SVGs and SVG data URIs (cognitive analytics charts).
- `font-src 'self'`: Matches the frozen Phase 15 contract (allows local fonts, while ACC-16 enforces 0 uncompressed font files).
- `connect-src 'self'`: Restricts `fetch()` and `XMLHttpRequest` exclusively to the same origin (`/api/v1/*`), matching the production configuration where `VITE_API_BASE_URL` is relative (`/`).
- `frame-ancestors 'none'`: Prevents clickjacking by prohibiting framing in iframes.
- `base-uri 'self'`: Enforces base URI restriction.
- `form-action 'self'`: Enforces form submission restriction.
- `object-src 'none'`: **PHASE 16 ADDITIVE NON-BREAKING HARDENING**. Prohibits Flash, Java, and plugin execution without replacing or weakening any frozen Phase 15 directive.

#### 2. Backend API CSP (Delivered by Express `securityHeadersMiddleware` on `/api/v1/*`)
```text
Content-Security-Policy: default-src 'none'; frame-ancestors 'none';
```
- Strictly forbids the browser from rendering API JSON responses as active web documents. Unmodified from Phase 14 baseline.

### 8.4 Deterministic Security Header Ownership Matrix

To eliminate all ambiguity, every response path class is mapped to exactly one authoritative policy owner:

| Response Path Class | Authoritative Header Owner | Emitted Headers & Exact Directives | Rationale & Boundary Rules |
|---|---|---|---|
| **Class A: SPA HTML Entrypoint** (`/`, `/app/*`, `/login`, etc.) | **Frontend Static Server** (`nginx-unprivileged`) | • `Content-Security-Policy`: Frozen SPA CSP (Section 8.3.1)<br>• `X-Content-Type-Options: nosniff`<br>• `X-Frame-Options: DENY`<br>• `Referrer-Policy: strict-origin-when-cross-origin`<br>• `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`<br>• `Cache-Control: no-cache, no-store, must-revalidate` | Frontend server is the document source; owns document security headers and revalidation policy. |
| **Class B: Fingerprinted Static Assets** (`/assets/*.js`, `/assets/*.css`) | **Frontend Static Server** (`nginx-unprivileged`) | • `X-Content-Type-Options: nosniff`<br>• `Cache-Control: public, max-age=31536000, immutable` | Static assets are immutable content-addressed files. CSP not applicable to JS/CSS chunks. |
| **Class C: Backend API Responses** (`/api/v1/*`) | **Backend Express API** (`securityHeadersMiddleware`) | • `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`<br>• `X-Content-Type-Options: nosniff`<br>• `X-Frame-Options: DENY`<br>• `Referrer-Policy: strict-origin-when-cross-origin`<br>• `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`<br>• `Cache-Control: no-store, no-cache, must-revalidate` (auth paths) | Backend owns API responses; Ingress forwards these byte-for-byte and MUST NOT overwrite or strip them. |
| **Class D: All External HTTPS Traffic** | **Edge Ingress** (AWS ALB) | • `Strict-Transport-Security: max-age=31536000; includeSubDomains` | Ingress terminates TLS; strictly authoritative for transport encryption and HSTS. |

```text
SECURITY HEADER OWNERSHIP AMBIGUITIES: 0
HEADER VALUE CONFLICTS:                0
```

---

## 9. ENVIRONMENT CONFIGURATION & SECRETS MANAGEMENT

### 9.1 Canonical Environment Variable Registry (Categorized by Architectural Scope)

Every environment variable utilized across all production-relevant execution surfaces—backend web service, frontend compilation, test harnesses, administrative CLI tools, metrics collector infrastructure, and CI/CD pipelines—has been mechanically audited against source code (`adaptive-aptitude-api/src/**`, `adaptive-aptitude-api/scripts/**`, `adaptive-aptitude-app/src/**`). All invented, stale, or speculative names (such as `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_REGISTRATION_KEY`, `SESSION_SECRET`) are strictly eliminated.

Variables are strictly categorized into six distinct architectural scopes:

#### Scope A: Backend Web Application Runtime (`adaptive-aptitude-api/src/**`)

| Exact Name | Consumer Source | Required / Optional | Classification | Production Value Source | Secrets Manager Ownership | Rotation Requirement | Failure Behavior if Absent |
|---|---|---|---|---|---|---|---|
| `NODE_ENV` | `database.js`, `authConfig.js`, `llmProviderFactory.js` | **Required** | Non-Secret | ECS Task Definition `environment` (`production`) | None (Plaintext) | None (Immutable) | Degrades to dev mode; breaks prod security validation |
| `PORT` | `server.js` | Optional | Non-Secret | ECS Task Definition `environment` (`5000`) | None (Plaintext) | None | Defaults to `5000` in Node process |
| `MONGODB_URI` | `database.js` | **Required** | **Secret** | AWS Secrets Manager (`aptitude/production/backend` -> `MONGODB_URI`) | Injected via task execution role `secrets` block | Rotate Atlas DB user + update Secrets Manager + task redeploy | Fatal startup exception: `MONGODB_URI environment variable is not defined.` -> Process exits code 1 |
| `CORS_ALLOWED_ORIGINS` | `authConfig.js` | **Required** in prod | Non-Secret | ECS Task Definition `environment` (`https://app.example.com`) | None (Plaintext) | Update via Terraform on domain migration | Fatal exception: `CORS_ALLOWED_ORIGINS is mandatory in production/staging.` Wildcard `*` throws fatal error |
| `JWT_ACCESS_KEYS` | `authConfig.js` | **Required** in prod | **Secret** | AWS Secrets Manager (`aptitude/production/backend` -> `JWT_ACCESS_KEYS`) | Injected via task execution role `secrets` block | Add new `kid` to JSON map, redeploy tasks, promote active `kid`, prune old `kid` after 15m | Fatal exception: `JWT_ACCESS_KEYS must be a JSON object mapping kid to secret.` Secret < 32 bytes throws fatal error |
| `JWT_ACCESS_ACTIVE_KID`| `authConfig.js` | **Required** in prod | Non-Secret | ECS Task Definition `environment` (`kid-2026-v1`) | Managed via Secrets Manager or ECS env | Updated in tandem with `JWT_ACCESS_KEYS` to promote new active signing key | Fatal exception: `JWT_ACCESS_ACTIVE_KID is mandatory in production/staging.` If `kid` missing from keyring throws error |
| `COOKIE_SECURE` | `authConfig.js` | Optional | Non-Secret | ECS Task Definition `environment` (`true`) | None (Plaintext) | None | Defaults to `isProduction` (`true` in production) |
| `TRUST_PROXY_HOPS` | `authConfig.js` | Optional in source | Non-Secret | ECS Task Definition `environment` (`1`) | None (Plaintext) | None | **Source Default: `false`** (`app.set('trust proxy', false)`). **Phase 16 Production Config: `1`**, strictly justified by single-hop ALB topology (`backend-sg` restricts port 5000 ingress to `alb-sg`). Blind `trust proxy=true` and unjustified `trust proxy=1` are PROHIBITED |
| `RATE_LIMIT_MAX_KEYS` | `authConfig.js` | Optional | Non-Secret | ECS Task Definition `environment` (`10000`) | None (Plaintext) | None | Defaults to `10000` (bounded between 1,000 and 100,000) |
| `RATE_LIMIT_GLOBAL_MAX`| `authConfig.js` | Optional | Non-Secret | ECS Task Definition `environment` (`300`) | None (Plaintext) | None | Defaults to `300` req / 15m per IP (process-local) |
| `RATE_LIMIT_AUTH_MAX` | `authConfig.js` | Optional | Non-Secret | ECS Task Definition `environment` (`5`) | None (Plaintext) | None | Defaults to `5` attempts / 15m per IP+email (process-local) |
| `RATE_LIMIT_REFRESH_MAX`| `authConfig.js`| Optional | Non-Secret | ECS Task Definition `environment` (`20`) | None (Plaintext) | None | Defaults to `20` req / 15m per IP+tokenHash (process-local) |
| `RATE_LIMIT_LLM_MAX` | `authConfig.js` | Optional | Non-Secret | ECS Task Definition `environment` (`20`) | None (Plaintext) | None | Defaults to `20` req / 1m per userId (process-local) |
| `METRICS_ENABLED` | `app.js` | Optional | Non-Secret | ECS Task Definition `environment` (`true`) | None (Plaintext) | None | Defaults to disabled (`/metrics` route omitted from Express app) |
| `METRICS_SCRAPE_SECRET`| `app.js`, `entrypoint.sh`| **Required** when metrics enabled | **Secret** | AWS Secrets Manager (`aptitude/production/backend` -> `METRICS_SCRAPE_SECRET`) | Injected into backend task and collector task via Secrets Manager | Update secret in Secrets Manager + rolling restart of backend and collector | Scrapes rejected with HTTP 401 Unauthorized |
| `LEARNING_LLM_PROVIDER`| `llmProviderFactory.js`| Optional | Non-Secret | ECS Task Definition `environment` (`disabled` or `gemini`) | None (Plaintext) | None | Defaults to `'disabled'` |
| `GEMINI_API_KEY` | `llmProviderFactory.js`, `logger.js` | **Required** if provider=gemini | **Secret** | AWS Secrets Manager (`aptitude/production/backend` -> `GEMINI_API_KEY`) | Injected via task execution role `secrets` block | Rotate in Google AI Studio + update Secrets Manager + task restart | If provider=gemini in prod throws: `GEMINI_API_KEY is required in production.` |
| `GEMINI_MODEL` | `llmProviderFactory.js` | **Required** if provider=gemini | Non-Secret | ECS Task Definition `environment` (`gemini-1.5-pro`) | None (Plaintext) | None | If provider=gemini in prod throws: `GEMINI_MODEL is required in production.` |
| `LEARNING_REQUIRE_ZERO_RETENTION`| `llmProviderFactory.js` | Optional | Non-Secret | ECS Task Definition `environment` (`false` or `true`) | None (Plaintext) | None | Defaults to `false` |

#### Scope B: Frontend Build-Time Configuration (`adaptive-aptitude-app/`)

| Exact Name | Consumer Source | Required / Optional | Classification | Production Value Source | Secrets Manager Ownership | Rotation Requirement | Failure Behavior if Absent |
|---|---|---|---|---|---|---|---|
| `VITE_API_BASE_URL` | `apiBaseUrl.ts` | **Required** unset/`/` | Non-Secret | CI/CD build runner environment (unset or `/`) | None (Build-time) | None | Defaults to `'/'`, preserving same-origin W39. Setting absolute URL triggers ACC-16 build rejection |

#### Scope C: Test-Only Configuration (`tests/`)

| Exact Name | Consumer Source | Required / Optional | Classification | Production Value Source | Secrets Manager Ownership | Rotation Requirement | Failure Behavior if Absent |
|---|---|---|---|---|---|---|---|
| `TEST_MONGODB_URI` | `database.js` | Required in test | **Secret** | Excluded from prod ECS; configured in CI test jobs | None in production | N/A (Test only) | Throws fatal exception in test mode if absent |

#### Scope D: Administrative / Governance CLI Configuration (`adaptive-aptitude-api/scripts/`)

| Exact Name | Consumer Source | Required / Optional | Classification | Production Value Source | Secrets Manager Ownership | Rotation Requirement | Failure Behavior if Absent |
|---|---|---|---|---|---|---|---|
| `POLICY_GOVERNANCE_SECRET`| `scripts/managePolicy.js`, `logger.js` | **STRICTLY REQUIRED** in production/staging CLI | **Secret** | AWS Secrets Manager (`aptitude/production/governance` -> `POLICY_GOVERNANCE_SECRET`) | Injected **strictly** into one-off ECS administrative tasks; **EXCLUDED** from web backend tasks | Update secret in Secrets Manager | **Fail-closed**: If absent or mismatched in prod/staging, CLI exits immediately with code 1. Web routes non-existent |

#### Scope E: Metrics Collector Infrastructure Configuration (`docker/prometheus/`)

| Exact Name | Consumer Source | Required / Optional | Classification | Production Value Source | Secrets Manager Ownership | Rotation Requirement | Failure Behavior if Absent |
|---|---|---|---|---|---|---|---|
| `AMP_ENDPOINT` | `entrypoint.sh` | **Required** in collector | Non-Secret | ECS Task Definition `environment` (`https://aps-workspaces...`) | None (Plaintext) | None | Collector bootstrap script fails; cannot push remote_write |
| `AWS_REGION` | `entrypoint.sh` | **Required** in collector | Non-Secret | ECS Task Definition `environment` (`us-east-1`) | None (Plaintext) | None | SigV4 remote_write signing fails |

#### Scope F: CI/CD & Infrastructure-as-Code Configuration (`.github/`, `infra/terraform/`)

| Exact Name | Consumer Source | Required / Optional | Classification | Production Value Source | Secrets Manager Ownership | Rotation Requirement | Failure Behavior if Absent |
|---|---|---|---|---|---|---|---|
| `AWS_ACCOUNT_ID` | `deploy.yml`, `main.tf` | **Required** in CI/IaC | Non-Secret | GitHub Actions Environment Secret / Variable | None | None | ECR registry login and IAM role assumption fail |
| `AWS_ROLE_TO_ASSUME` | `ci.yml`, `deploy.yml` | **Required** in CI | Non-Secret | GitHub Actions Environment Variable | None | None | OIDC authentication to AWS fails |
| `TF_VAR_environment` | `main.tf` | **Required** in IaC | Non-Secret | Terraform CLI / Workspace Variable | None | None | Terraform validation fails |

### 9.2 Secrets Architecture & Anti-Leakage Invariants
- **Zero Secrets in Version Control**: No `.env` or credential files committed to Git.
- **Zero Secrets in Docker Images**: Container images built with generic instructions; zero `ARG` secrets baked into image layers.
- **Zero Secrets in Client Bundles**: Frontend build inspected to verify zero `VITE_*` variables containing backend keys or database URIs.
- **Runtime Secret Injection**: Secrets injected via AWS Secrets Manager directly into ECS Task Definition environment variables at task start.
- **Log Sanitization**: Phase 13/14 logger automatically intercepts and redacts `GEMINI_API_KEY` and `POLICY_GOVERNANCE_SECRET` from all emitted JSON log streams.

### 9.3 Administrative Governance Execution Boundary (`scripts/managePolicy.js`)
To strictly maintain the Phase 12/14 governance invariants:
1. **Execution Model**: Governed exclusively via an **explicitly authorized one-off ECS administrative task** (`aptitude-governance-task`) launched on-demand via `aws ecs run-task`.
2. **Ephemeral Lifecycle**: The administrative task launches in private VPC subnets, executes the requested command (`seed-baseline`, `promote`, `activate`, `rollback`, `list`, or `show`), emits structured audit logs to CloudWatch Log Group `/ecs/aptitude-governance-prod`, and immediately terminates. It is never a continuously running background daemon.
3. **Network Boundary**: Zero public IP address and zero open listening HTTP ports. Web API endpoints for policy governance are completely NON-EXISTENT (**0 web routes**; HOST-CLI-ONLY contract preserved).
4. **Least-Privilege Secret Isolation**:
   - `POLICY_GOVERNANCE_SECRET` is stored in AWS Secrets Manager at `aptitude/production/governance` and injected **strictly** into the one-off administrative task.
   - It is **strictly excluded** from the long-running backend web service task definition (`aptitude-backend`), minimizing secret attack surface.
5. **Fail-Closed Enforcement**: In `production` and `staging`, `scripts/managePolicy.js` strictly requires `POLICY_GOVERNANCE_SECRET` and `--secret <val>` matching via `crypto.timingSafeEqual`. If absent, mismatched, or if `--confirm` is attempted in prod/staging, the CLI fails closed with exit code 1.
6. **Audited Operator Execution**: Every invocation is audited via AWS CloudTrail (`RunTask` API call with IAM operator identity) and CloudWatch Logs.

---

## 10. MONGODB PRODUCTION CONNECTIVITY & TOPOLOGY

### 10.1 Cluster Topology & Network Isolation
- **Deployment Class**: MongoDB Atlas Dedicated Cluster (Tier M10+, MongoDB 7.x 3-node Replica Set with automated failover).
- **Network Isolation**: MongoDB Atlas cluster provisioned in a dedicated Atlas VPC; connected to AWS ECS VPC exclusively via **AWS VPC Peering**. Zero public internet IP exposure.
- **Security Group Rules**: Ingress restricted strictly to backend API ECS task security groups on port 27017.
- **Transport Security**: Mandatory TLS (`tls=true`), TLS 1.3 or 1.2 with strict certificate verification.
- **Authentication**: `authSource=admin` with dedicated application user using SCRAM-SHA-256.

### 10.2 Connection Pool Governance
- **Driver**: Mongoose 8.4 / MongoDB Node.js Driver 6.x.
- **Pool Sizing**:
  - `minPoolSize`: 10 (pre-warmed connections to prevent connection latency spikes).
  - `maxPoolSize`: 100 per container instance.
  - `maxIdleTimeMS`: 30,000 ms.
- **Timeouts**:
  - `serverSelectionTimeoutMS`: 5,000 ms (fail-fast on network partition).
  - `socketTimeoutMS`: 45,000 ms.
  - `READINESS_PING_TIMEOUT_MS`: 2,000 ms (Section 6 of healthService).

### 10.3 Startup Index Pre-Check Invariant
Before binding the HTTP port, `server.js` executes `verifyAndEnsureStartupIndexes()`:
1. Verifies physical index `userId_1` (unique) on `User`.
2. Verifies physical index `status_1` on `User`.
3. Verifies physical partial index `email_1_canonical_unique` on `User`.
4. Creates and deeply verifies all 7 physical indexes on `AuthSession` (`tokenId_1`, `tokenHash_1`, `userId_1`, `sessionId_1`, `expiresAt_1` TTL, compound `userId_1_sessionId_1_status_1`, and partial `sessionId_active_unique`).
5. If any index is missing or invalid, the process aborts with exit code 1, preventing corrupted traffic routing.

### 10.4 Backup, Recovery & Retention Objectives
- **Continuous Oplog Archival**: Enabled with point-in-time recovery (PITR) allowing restoration to any second within the retention window.
- **Snapshot Frequency**: Full automated snapshots taken every 24 hours.
- **Snapshot Retention**: 30 days of daily snapshots; 12 monthly snapshots retained offsite in cold storage.
- **Recovery Point Objective (RPO)**: **<= 5 minutes** (governed by continuous oplog sync).
- **Recovery Time Objective (RTO)**: **<= 60 minutes** (time to spin up fresh cluster and restore snapshot + oplog replay).
- **Disaster Recovery Testing**: Bi-annual automated restore drill to an isolated validation environment.

### 10.5 MongoDB Atlas Peering Governance & Ownership Boundary (Model B)

The platform formally freezes **MODEL B — PRE-EXISTING GOVERNED ATLAS PREREQUISITE** as the authoritative production peering architecture:

1. **Atlas-Side Peering Initiator Owner**:
   - **MongoDB Atlas Administrator** (Pre-Existing Governed Cloud Prerequisite).
   - The Atlas project administrator initiates the VPC Peering connection from the Atlas Project Network Access panel to the AWS Account ID and Application VPC ID (`10.0.0.0/16`) in target region `us-east-1`.
   - Atlas creates the pending peering connection and issues the canonical `atlas_peering_connection_id` (`pcx-...`).

2. **Governed Prerequisite Input Parameters**:
   - `atlas_project_id`: MongoDB Atlas Project ID (e.g., `60f1b2c3d4e5f67890abcdef`).
   - `atlas_cluster_name`: MongoDB Atlas Dedicated Cluster Name (`aptitude-prod-cluster`).
   - `atlas_cidr_block`: MongoDB Atlas Dedicated VPC CIDR (`192.168.0.0/21`).
   - `atlas_peering_connection_id`: Peering Connection ID issued by Atlas (`pcx-0123456789abcdef0`).
   - `atlas_region`: AWS Region matching the application VPC (`us-east-1`).

3. **AWS-Side Peering Owner**:
   - **Terraform (`infra/terraform/modules/vpc_peering/`)**.
   - Terraform manages all AWS-side resources:
     - `aws_vpc_peering_connection_accepter.atlas`: Accepts the incoming peering connection (`auto_accept = true`).
     - `aws_route.atlas_peering_routes`: Injects route for `192.168.0.0/21` across all private subnet route tables pointing to `pcx-...`.
     - `aws_security_group_rule.backend_to_atlas`: Egress rule on `backend-sg` granting outbound TCP traffic to `192.168.0.0/21` on port 27017.

4. **Zero Public Internet Network Access Invariant**:
   - **Public Atlas Network Access**: **STRICTLY 0.0.0.0/0 IP Access = 0 (Revoked / Blocked)**. Only the private AWS VPC CIDR (`10.0.0.0/16`) is allowed in the Atlas Project Network Access IP list.
   - All database communication traverses the private AWS-Atlas VPC Peering route.

```text
ATLAS PEERING OWNER:                PRE-EXISTING GOVERNED PREREQUISITE (ATLAS ADMIN)
AWS PEERING OWNER:                  TERRAFORM (modules/vpc_peering)
PUBLIC ATLAS NETWORK ACCESS:        0 (REVOKED / BLOCKED)
PEERING OWNERSHIP AMBIGUITIES:      0
```

---

## 11. OPERATIONAL PROBES & RELIABILITY

### 11.1 Container Lifecycle Probes

```text
================================================================================
ORCHESTRATOR PROBE SPECIFICATIONS
================================================================================
Probe Type:         Liveness Probe
Endpoint:           GET /health/live
Initial Delay:      10 seconds
Poll Period:        10 seconds
Timeout:            2 seconds
Failure Threshold:  3 consecutive failures (30 seconds)
Action on Failure:  Restart Container (Process Crash Recovery)
Responsibility:     healthService.evaluateLiveness() -> checks process loop alive

Probe Type:         Readiness Probe
Endpoint:           GET /health/ready
Initial Delay:      5 seconds
Poll Period:        5 seconds
Timeout:            2.5 seconds
Failure Threshold:  2 consecutive failures (10 seconds)
Action on Failure:  Remove Container from ALB Target Group (No Restarts)
Responsibility:     healthService.evaluateReadiness() -> verifies state === 'RUNNING'
                    AND executes dual-deadline MongoDB ping (<=2000ms)
================================================================================
```

### 11.2 Graceful Shutdown & Connection Draining
When the orchestrator terminates or replaces a container instance:
1. **Signal**: Orchestrator sends `SIGTERM` to the Node.js process.
2. **State Transition**: `server.js` sets `healthService.setLifecycleState('SHUTTING_DOWN')`.
3. **Traffic Detachment**: The subsequent readiness probe immediately fails with HTTP 503 `NOT_READY`, causing ALB to stop sending new incoming requests.
4. **Listener Close**: `httpServer.close()` stops accepting new TCP connections.
5. **Request Draining**: Active request counter (`getActiveRequestCount()`) is polled every 50ms until it reaches 0 or hits `NORMAL_SHUTDOWN_DRAIN_TIMEOUT_MS` (10,000 ms).
6. **Database Disconnect**: `database.disconnectDB()` cleanly flushes buffers and closes MongoDB sockets.
7. **Process Exit**: Process terminates with exit code 0.
8. **Orchestrator Timeout**: ECS Task `stopTimeout` is configured to **15 seconds** (providing a 5-second buffer above the 10-second drain window).

---

## 12. OBSERVABILITY: METRICS, LOGS, & ALERTING

### 12.1 Structured Logging Architecture
- **Format**: Single-line ndjson (Newline Delimited JSON) emitted to `stdout`.
- **Fields**: `timestamp`, `level` (`info`, `warn`, `error`), `event`, `component`, `message`, `correlationId`, `statusCode`, `durationMs`.
- **Ingestion Pipeline**: ECS Native `awslogs` log driver streams stdout directly from container tasks into AWS CloudWatch Logs Log Group `/ecs/adaptive-aptitude-api-prod` with 30-day retention.
- **Query Capability**: CloudWatch Logs Insights natively parses JSON fields for sub-second log filtering by `correlationId`, `event`, and `statusCode`.
- **PII & Secret Boundary**: The Phase 13/14 logger guarantees that passwords, bearer tokens, LLM API keys, and governance secrets are redacted before emission.

### 12.2 Prometheus Metric Collection & Internal Service Discovery
- **Endpoint**: `GET /metrics` on internal container port 5000.
- **Scraper Authentication**: Scraper supplies `Authorization: Bearer <METRICS_SCRAPE_SECRET>`.
- **Scrape Interval**: 15 seconds.
- **Metrics Scraper Owner**: Dedicated `prometheus-collector` ECS task running within the private VPC.
- **Internal Service Discovery (`backend.internal`) & All-Task Scrape Semantics**:
  - **Private Namespace**: AWS Cloud Map Private DNS Namespace `internal` (`aws_service_discovery_private_dns_namespace`), associated with the application VPC (`10.0.0.0/16`).
  - **Service Discovery Record**: `aws_service_discovery_service.backend` publishes Route53 private `A` records for `backend.internal` with a 10-second TTL and `MULTIVALUE` routing policy.
  - **Backend Task Registration**: ECS automatically registers task private IPs upon container start and deregisters them upon task termination / draining.
  - **Prometheus All-Task Discovery (`dns_sd_configs`)**: Rather than relying on a single round-robin host lookup, `docker/prometheus/prometheus.yml.tpl` specifies native Prometheus DNS service discovery:
    ```yaml
    scrape_configs:
      - job_name: 'backend'
        scrape_interval: 15s
        dns_sd_configs:
          - names:
              - 'backend.internal'
            type: 'A'
            port: 5000
            refresh_interval: 10s
        bearer_token_file: '/tmp/prometheus/secrets/scrape_token'
    ```
    Prometheus queries Route53 for all `A` records under `backend.internal`, dynamically expanding every registered backend container IP into an active scrape target.
  - **Metrics Coverage Guarantee**: **ALL REGISTERED TASKS** are discovered and scraped independently. Single-random-DNS-target assumption = **0**.
  - **Security Group Isolation**: `backend-sg` permits TCP port 5000 ingress strictly from `collector-sg`.
  - **Public Exposure Invariant**: Public ALB routing strictly forwards `/api/v1/*` to backend and blocks `/metrics` with HTTP 403 Forbidden; `/metrics` is 100% inaccessible from the public internet.
- **Deterministic Prometheus Scrape Configuration Artifact & Secret Delivery**:
  - **Source Artifacts**: `docker/prometheus/prometheus.yml.tpl` and bootstrap `docker/prometheus/entrypoint.sh` (version-controlled in Git, zero secrets).
  - **Secret Delivery**: `METRICS_SCRAPE_SECRET` is stored in AWS Secrets Manager (`aptitude/production/backend` -> `METRICS_SCRAPE_SECRET`) and injected into the container environment at launch via the ECS task execution role `secrets` block.
  - **Runtime Execution**: At container start, `entrypoint.sh`:
    1. Writes `METRICS_SCRAPE_SECRET` to `/tmp/prometheus/secrets/scrape_token` with restrictive `0600` permissions.
    2. Unsets `METRICS_SCRAPE_SECRET` from process memory to prevent inspection via environment dumps.
    3. Substitutes non-secret `${AMP_ENDPOINT}` and `${AWS_REGION}` in `prometheus.yml.tpl` to produce `/tmp/prometheus/prometheus.yml`.
    4. Launches `prometheus --config.file=/tmp/prometheus/prometheus.yml` under non-root UID 65534 (`nobody`).
  - **Secret Exposure Invariant**: Secret is never committed to Git, never baked into Docker images, never printed in CI logs, and never stored in Terraform state.
- **Metrics Storage**: Amazon Managed Service for Prometheus (AMP) via native AWS SigV4 `remote_write` authenticated by the collector's ECS Task IAM Role (`aps:RemoteWrite`).
- **Exact Frozen Prometheus Metric Families (Phase 14 Telemetry Contract)**:
  The Phase 14 frozen contract preserves **EXACTLY eight Prometheus metric families** (zero new metric families authorized; zero application source modifications):
  1. `http_requests_total`: Counter tracking total processed HTTP requests, partitioned by `method`, `route`, and `statusClass`.
  2. `http_request_duration_seconds`: Histogram measuring HTTP request duration in seconds with canonical buckets (`[0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500, 1.000, 2.500, 5.000, 10.000]` + `+Inf`).
  3. `http_active_requests`: Gauge tracking current number of active in-flight HTTP requests.
  4. `nodejs_eventloop_lag_seconds`: Gauge measuring Node.js event loop lag in seconds.
  5. `process_memory_heap_bytes`: Gauge tracking process heap memory consumption in bytes.
  6. `database_connection_status`: Gauge tracking MongoDB connection status (0=disconnected, 1=connected, 2=connecting, 3=disconnecting).
  7. `database_ping_duration_seconds`: Gauge tracking MongoDB ping round-trip latency in seconds.
  8. `process_uptime_seconds`: Gauge tracking Node.js process uptime in seconds.

### 12.3 Service Level Indicators (SLIs) & Objectives (SLOs)

| Service Objective | SLI Metric Source | PromQL / Measurement Formula | Target Objective | Measurement Window |
|---|---|---|---|---|
| **Platform Availability** | `http_requests_total` | $1 - \left( \frac{\text{rate}(http\_requests\_total\{statusClass="5xx"\}[30d])}{\text{rate}(http\_requests\_total[30d])} \right)$ | **>= 0.999** (99.9% Availability / Error Ratio <= 0.001) | Rolling 30 Days |
| **API Latency (p95)** | `http_request_duration_seconds` | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route!="/api/v1/learning/tutor"}[7d])) by (le))` | **<= 0.200 s** (200 ms) | Rolling 7 Days |
| **API Latency (p99)** | `http_request_duration_seconds` | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{route!="/api/v1/learning/tutor"}[7d])) by (le))` | **<= 0.500 s** (500 ms) | Rolling 7 Days |
| **Tutor LLM Latency (p95)**| `http_request_duration_seconds` | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{route="/api/v1/learning/tutor"}[7d])) by (le))` | **<= 3.000 s** (3,000 ms) | Rolling 7 Days |
| **Database Reachability** | `database_connection_status` | Fraction of scrape evaluations where `database_connection_status == 1` | **>= 0.9995** (99.95%) | Rolling 30 Days |
| **Database Ping Latency** | `database_ping_duration_seconds` | `database_ping_duration_seconds` during readiness health evaluations | **<= 1.000 s** (1,000 ms) | Rolling 7 Days |
| **Zero-Downtime Releases** | ALB / Ingress 5xx Errors | 5xx count during deployment cutover window | **0 unforced 5xx errors** | Per Release Event |

### 12.4 Production Alerting Ownership (Separated by Metric Source)

To ensure technical correctness, alert evaluation is explicitly partitioned by metric origin:

1. **AWS-Native Infrastructure & Structured Log Alert Owner**: **AWS CloudWatch Alarms**.
   - Evaluates native AWS metrics: ALB 5xx count (`HTTPCode_Target_5XX_Count`), Target Response Time (`TargetResponseTime`), Unhealthy Target Count (`UnHealthyHostCount`), ECS CPU utilization (`CPUUtilization`), ECS Memory utilization (`MemoryUtilization`), ECS container crash loops, and CodeDeploy deployment failures.
   - Evaluates infrastructure-derived security telemetry: A CloudWatch Logs Metric Filter parses the Phase 14 structured log stream for `event = "AUTH_REFRESH_REUSE_DETECTED"`, publishing custom metric `AuthRefreshReuseEvents` to CloudWatch without modifying application code or inventing unauthorized Prometheus metrics.
   - Action: Dispatches notifications directly to the unified **AWS SNS Topic** (`aptitude-production-alerts`).

2. **Application Prometheus Metric Alert Owner**: **Amazon Managed Service for Prometheus (AMP) Rule Groups / Alertmanager**.
   - Evaluates PromQL alerting rules natively against the 8 frozen Prometheus time-series metrics: `HighHttp5xxRate` (5xx ratio > 1.0%), `ElevatedApiLatency` (p95 > 0.500s), `DatabaseDown` (`database_connection_status == 0`), and `DatabasePingDegraded` (`database_ping_duration_seconds > 1.000s`).
   - Action: Routes triggered alerts via native Alertmanager webhook/SNS receiver to the identical **AWS SNS Topic** (`aptitude-production-alerts`).

3. **Alert Notification & Dispatch Owner**: **AWS SNS Topic (`aptitude-production-alerts`)**.
   - Serves as the single unified notification sink for all platform alerts, dispatching to engineering on-call rotations via email, Slack webhook, or PagerDuty integration.

4. **Visualization Ownership**:
   - **Infrastructure Metrics & Log Analytics**: **Amazon CloudWatch Dashboards & CloudWatch Logs Insights**.
   - **Application Prometheus Metrics**: **Amazon Managed Grafana (AMG)** workspace connected directly to the AMP workspace data source.

| Alert Name | Metric / Log Source | Condition & Threshold | Severity | Alert Owner | Notification Sink |
|---|---|---|---|---|---|
| `HighHttp5xxRate` | Prometheus (`http_requests_total`) | `rate(5xx) / rate(Total) > 0.010` (> 1.0% error ratio) for > 3m | P1 — Critical | AMP Rule Group | AWS SNS Topic |
| `ElevatedApiLatency` | Prometheus (`http_request_duration_seconds`)| p95 latency > 0.500s (500ms) for > 5m | P2 — Warning | AMP Rule Group | AWS SNS Topic |
| `DatabaseDown` | Prometheus (`database_connection_status`)| `database_connection_status == 0` for > 30s | P1 — Critical | AMP Rule Group | AWS SNS Topic |
| `DatabasePingDegraded` | Prometheus (`database_ping_duration_seconds`)| `database_ping_duration_seconds > 1.000` (> 1,000ms) for > 2m | P2 — Warning | AMP Rule Group | AWS SNS Topic |
| `ContainerCrashLoop` | CloudWatch (`ContainerExitCode`)| Container restart rate > 2 in 10m | P1 — Critical | CloudWatch Alarms | AWS SNS Topic |
| `AuthRefreshReuseSpike` | CloudWatch Logs Metric Filter (`AUTH_REFRESH_REUSE_DETECTED`)| Structured log reuse events > 5 in 5m | P2 — Security | CloudWatch Alarms | AWS SNS Topic |
| `HostResourceSaturation`| CloudWatch (`CPU/MemoryUtilization`)| CPU > 85% or Memory > 85% for > 5m | P2 — Warning | CloudWatch Alarms | AWS SNS Topic |
| `Alb5xxRateSpike` | CloudWatch (`HTTPCode_Target_5XX`)| > 10 target 5xx errors in 1 minute | P1 — Critical | CloudWatch Alarms | AWS SNS Topic |

```text
AWS-NATIVE ALERT OWNER:             AWS CLOUDWATCH ALARMS
PROMETHEUS METRIC ALERT OWNER:      AMAZON MANAGED SERVICE FOR PROMETHEUS (AMP) RULE GROUPS
ALERT NOTIFICATION OWNER:           AWS SNS TOPIC (aptitude-production-alerts)
VISUALIZATION OWNER:                CLOUDWATCH DASHBOARDS (INFRA) & MANAGED GRAFANA (METRICS)
AUTH_REFRESH_REUSE_DETECTED SOURCE: STRUCTURED SECURITY LOG (CLOUDWATCH LOGS METRIC FILTER)
OBSERVABILITY OWNERSHIP AMBIGUITIES: 0
PROMETHEUS METRIC FAMILIES:         8 / 8 EXACT
PROMETHEUS UNIT MISMATCHES:         0
NEW BACKEND METRIC FAMILIES:        0
```

---

## 13. CI/CD PIPELINE & ARTIFACT LIFECYCLE

### 13.1 Automated Pipeline Architecture

```text
================================================================================
MULTI-STAGE CI/CD PIPELINE ARCHITECTURE (EXISTING REPOSITORY CHECKS ONLY)
================================================================================
Stage 1: Validation & Code Hygiene (Zero New Dependencies)
  ├── Backend Jest Unit & Security Tests (npm test: 94 suites, 1,279 tests)
  ├── Frontend TypeScript Compilation (npm run typecheck: tsc --noEmit)
  └── Frontend Vitest Unit & Integration Tests (npm run test: 26 suites, 108 tests)
                          │ (All tests pass)
                          ▼
Stage 2: Deterministic Production Build & Verification
  ├── Frontend Production Build (npm run build -> tsc + vite build)
  ├── ACC-16 Inline Measurement Script (Verify JS <=115kB, CSS <=20kB, 0 fonts, 0 logs)
  └── Playwright E2E Multi-Browser Execution (npm run test:e2e: 36 tests)
                          │ (Build & E2E pass)
                          ▼
Stage 3: Container Build & Security Scan
  ├── Multi-stage build of frontend static container image (nginxinc/nginx-unprivileged:alpine)
  ├── Multi-stage build of backend API container image (node:20-alpine)
  └── Container Vulnerability Scan (Trivy: 0 Critical / High CVEs)
                          │ (Zero CVE violations)
                          ▼
Stage 4: Artifact Publishing & Staging Deployment
  ├── Tag images with Git commit SHA and semantic version (immutable tags)
  ├── Push images to Amazon ECR Private Registry
  └── Deploy to Staging Environment (Zero-downtime Blue/Green on Staging ECS)
                          │ (Staging deployment healthy)
                          ▼
Stage 5: Staging Smoke Verification
  ├── Automated smoke test against https://staging.example.com/
  ├── Verification of /health/ready, login flow, and Operation 64 same-origin headers
  └── Manual Approval Gate for Production Release
                          │ (Approved)
                          ▼
Stage 6: Production Blue/Green Promotion
  ├── Deploy new container tasks to Green Target Group
  ├── Await healthy readiness probes on Green
  ├── Flip ALB traffic from Blue to Green
  └── Monitor 5xx metrics for 15 minutes; decommission Blue on stability
================================================================================
```

### 13.2 Artifact Immutability Rules
- **Build Once, Deploy Everywhere**: The exact container images validated in Staging are promoted to Production without rebuilding.
- **No `latest` Tag in Production**: Deployments explicitly target immutable commit-sha tags (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/aptitude-api:sha-2c6498b`).
- **Provenance & SBOM**: Pipeline generates Software Bill of Materials (SBOM) using CycloneDX format during container packaging.

---

## 14. RELEASE, DEPLOYMENT & ROLLBACK STRATEGY

### 14.1 Dual-Service Blue/Green Deployment Architecture
AWS ECS CodeDeploy operates strictly at the individual ECS service scope. Because the platform comprises two independent ECS services (`frontend` and `backend`), deployments are governed by two distinct CodeDeploy application deployment groups with independent Blue/Green target groups, distinct ALB listener rules, and dedicated AppSpec specifications:

```text
================================================================================
ECS SERVICES & CODEDEPLOY DEPLOYMENT GROUP MAPPINGS
================================================================================
SERVICE 1: FRONTEND ECS SERVICE
  • CodeDeploy Application:      aptitude-frontend
  • Deployment Group:            frontend-dg
  • ECS Service Name:            frontend
  • Container Name:              frontend
  • Container Port:              8080 (Unprivileged Nginx)
  • Blue Target Group:           frontend-tg-blue (Port 8080)
  • Green Target Group:          frontend-tg-green (Port 8080)
  • ALB Production Listener:     Port 443 HTTPS (Default fallback rule /*)
  • ALB Test Listener:           Port 9443 HTTPS (Test listener rule /* -> Green)
  • Health Check Path:           /index.html (200 OK)
  • AppSpec Template:            docker/appspec-frontend.yml
  • Pre-Traffic Validation:      CI/CD Test-Listener Validation (GitHub Actions
                                 executing scripts/verifyProductionDeployment.js
                                 against restricted Test Listener Port 9443):
                                 - HTTP 200 on /index.html
                                 - Frozen SPA CSP headers (zero unsafe-inline)
                                 - Static JS/CSS asset bundle availability
  • Post-Traffic Validation:     15-minute observation window on port 443 monitoring:
                                 - 5xx error rate (< 0.5%)
                                 - Task restart counts (0)

SERVICE 2: BACKEND ECS SERVICE
  • CodeDeploy Application:      aptitude-backend
  • Deployment Group:            backend-dg
  • ECS Service Name:            backend
  • Container Name:              backend
  • Container Port:              5000 (Node.js Express unprivileged)
  • Blue Target Group:           backend-tg-blue (Port 5000)
  • Green Target Group:          backend-tg-green (Port 5000)
  • ALB Production Listener:     Port 443 HTTPS (Path rule /api/v1/*, Priority 10)
  • ALB Test Listener:           Port 8443 HTTPS (Test listener rule /api/v1/* -> Green)
  • Health Check Path:           /health/ready (200 OK with Mongo status)
  • AppSpec Template:            docker/appspec-backend.yml
  • Pre-Traffic Validation:      CI/CD Test-Listener Validation (GitHub Actions
                                 executing scripts/verifyProductionDeployment.js
                                 against restricted Test Listener Port 8443):
                                 - HTTP 200 on /health/ready
                                 - JWT verification and active KID validation
                                 - Idempotency-Key header handling (Operation 64)
  • Post-Traffic Validation:     15-minute observation window on port 443 monitoring:
                                 - HTTP 5xx error rate (< 0.5%)
                                 - p95 latency (< 2x baseline)
                                 - Readiness probe stability
================================================================================
```

### 14.2 CodeDeploy AppSpec Templates & Rendering Contract
To preserve build-once/deploy-everywhere and deterministic version control without unsupported Lambda lifecycle hook overhead:
- **Pre-Traffic Validation Architecture (Option B — CI/CD Test-Listener Validation)**:
  - AppSpec files omit the `Hooks:` block entirely, avoiding complex Lambda orchestration, additional IAM roles, or Lambda VPC attachments.
  - Pre-production validation is owned directly by the **GitHub Actions Deployment Pipeline** (`.github/workflows/deploy.yml` invoking `scripts/verifyProductionDeployment.js`).
  - CodeDeploy registers Green tasks and exposes them via the ALB test listeners (Port 8443 for backend, Port 9443 for frontend) while production traffic shifting remains held.
  - The CI workflow executes comprehensive synthetic checks against the test listeners. Upon successful verification, the pipeline authorizes the atomic traffic shift on Port 443. If verification fails, the pipeline cancels the deployment and triggers automated rollback.
  - **False CodeDeploy Hook Claims**: **0**.
  - **Pre-Production Validation Owner**: **GitHub Actions Deployment Pipeline** (`scripts/verifyProductionDeployment.js`).
  - **Frontend Validation Owner**: **GitHub Actions Deployment Pipeline** (verifying Port 9443).
  - **Backend Validation Owner**: **GitHub Actions Deployment Pipeline** (verifying Port 8443).
- **Test Listener Security Boundary**:
  - Ports 8443 and 9443 are **NOT** publicly accessible endpoints.
  - The ALB Security Group (`alb-sg`) strictly restricts ingress on ports 8443 and 9443 to the authorized GitHub Actions runner CIDR / private deployment VPC subnets.
  - Ingress from `0.0.0.0/0` on test listener ports is completely blocked.
  - **Test Listener Public Unrestricted Exposure**: **0**.
- **Frontend AppSpec Template ([`docker/appspec-frontend.yml`](file:///Users/rajakumaran/Documents/Aptitude/docker/appspec-frontend.yml))**:
  ```yaml
  version: 0.0
  Resources:
    - TargetService:
        Type: AWS::ECS::Service
        Properties:
          TaskDefinition: <TASK_DEFINITION_ARN>
          LoadBalancerInfo:
            ContainerName: "frontend"
            ContainerPort: 8080
  ```
- **Backend AppSpec Template ([`docker/appspec-backend.yml`](file:///Users/rajakumaran/Documents/Aptitude/docker/appspec-backend.yml))**:
  ```yaml
  version: 0.0
  Resources:
    - TargetService:
        Type: AWS::ECS::Service
        Properties:
          TaskDefinition: <TASK_DEFINITION_ARN>
          LoadBalancerInfo:
            ContainerName: "backend"
            ContainerPort: 5000
  ```
- **CI/CD Rendering & Submission**: During the deployment pipeline ([`.github/workflows/deploy.yml`](file:///Users/rajakumaran/Documents/Aptitude/.github/workflows/deploy.yml)):
  1. The pipeline registers new task definitions in Amazon ECS for frontend and backend container image tags.
  2. The registered Task Definition ARNs are deterministically substituted into `docker/appspec-frontend.yml` and `docker/appspec-backend.yml` as distinct deployment artifacts.
  3. CodeDeploy triggers independent, sequential deployments for backend and frontend deployment groups.
  4. **Multi-Service Single-AppSpec Claims**: **0**. AWS ECS CodeDeploy does not support deploying multiple ECS services under a single AppSpec or deployment group.

### 14.3 Deterministic Deployment Ordering & ALB Rule Isolation
To prevent client-side breakage and eliminate routing contention:
1. **ALB Path Rule Isolation**:
   - Backend CodeDeploy strictly modifies the action of the `/api/v1/*` listener rule (Rule Priority 10 on Port 443 and Port 8443).
   - Frontend CodeDeploy strictly modifies the default action (`/*`) of the Port 443 and Port 9443 listeners.
   - The two deployments manipulate mutually exclusive rule objects; neither operation can overwrite or corrupt the other's routing rules.
2. **Deterministic Deployment Sequence**:
   - **Step 1: Backend Deployment & Production Promotion**:
     - Deploy new backend tasks to `backend-tg-green`.
     - CI/CD deployment pipeline executes synthetic validation of `/health/ready`, active KID JWT verification, and Operation 64 idempotency headers via Test Listener Port 8443.
     - Upon validation pass, pipeline authorizes CodeDeploy to shift ALB rule `/api/v1/*` traffic from `backend-tg-blue` to `backend-tg-green`.
     - 10-second connection drain completes for existing requests on Blue.
     - Backend is verified live on production.
   - **Step 2: Frontend Deployment & Production Promotion**:
     - Deploy new frontend tasks to `frontend-tg-green`.
     - CI/CD deployment pipeline executes synthetic validation of `/index.html`, frozen SPA CSP (zero unsafe-inline), and static bundle availability via Test Listener Port 9443.
     - Upon validation pass, pipeline authorizes CodeDeploy to shift ALB default rule (`/*`) traffic from `frontend-tg-blue` to `frontend-tg-green`.
     - 10-second connection drain completes for existing requests on Blue.
     - Frontend is verified live on production.
   - **Rationale**: Backend APIs are strictly backward-compatible (additive schemas, non-breaking contract). Promoting the backend first ensures that when the new frontend is promoted, all new API endpoints or payload fields required by the new frontend are already available.

### 14.4 Ephemeral Operational State & Cutover Safety
During the cutover transition:
- **Application Durable State**: Shared continuously through MongoDB Atlas (`User`, `AuthSession`, `DailyObjective`, etc.).
- **Access JWT Verification**: Fully independent per replica because all replicas share the identical `JWT_ACCESS_KEYS` keyring. A token issued by Blue is immediately valid on Green.
- **Process-Local Rate-Limit Buckets**: Blue and Green maintain separate in-memory rate-limit sliding windows. Because both start clean, this is safe and fail-soft (does not lock out legitimate learners).
- **Process-Local Metrics**: Prometheus collector queries active tasks via AWS Cloud Map (`backend.internal:5000/metrics`) and pushes metrics to AMP.
- **No Local Filesystem Reliance**: Zero learner state relies on local disk. Cutover is 100% safe.

### 14.5 Decoupled Rollback Semantics
- **Rollback Triggers**: Any of the following events during the 15-minute cutover window triggers immediate automated rollback:
  - Global HTTP 5xx rate > 0.5% (CloudWatch Alarm `aptitude-alb-5xx-high`).
  - Readiness probe failure on any Green instance.
  - p95 latency increase > 100% over baseline.
- **Decoupled Failure Semantics**:
  - **Case 1: Backend Fails, Frontend Not Yet Started**: Backend CodeDeploy automatically shifts Port 443 rule `/api/v1/*` back to `backend-tg-blue`. The frontend deployment pipeline aborts immediately. Production remains 100% functional on stable Blue baseline.
  - **Case 2: Backend Succeeds, Frontend Fails**: Frontend CodeDeploy automatically shifts Port 443 default rule back to `frontend-tg-blue`. Because backend APIs are strictly backward-compatible with older frontend versions, the backend remains promoted on Green without needing rollback.
  - **Case 3: Post-Promotion Incident on Backend**: If an incident occurs during the backend 15-minute observation window while frontend deployment is waiting, backend rolls back to Blue. If frontend has already been promoted, backend rolls back to Blue; because Phase 1–15 database migrations are additive and backward-compatible, older backend versions continue servicing newer frontend requests.
- **Database Rollback**: Zero database rollbacks required due to strict additive schema invariants.

---

## 15. CDN & STATIC ASSET CACHING STRATEGY

```text
================================================================================
STATIC ASSET CACHING & EXPIRATION RULES
================================================================================
Resource Class:         HTML Entrypoint (index.html)
Path Pattern:           /index.html and /
Cache-Control:          no-cache, no-store, must-revalidate
Proxy-Revalidate:       Enforced
Rationale:              Ensures user browsers immediately receive new script
                        and stylesheet hashes upon deployment. Clients are never
                        pinned to obsolete asset graphs.

Resource Class:         Fingerprinted Production Assets
Path Pattern:           /assets/*.js, /assets/*.css
Cache-Control:          public, max-age=31536000, immutable
Rationale:              Vite incorporates cryptographic content hashes into all
                        emitted bundle filenames (e.g., index-D_tdnz8E.css).
                        Safe for permanent caching (1 year) across browsers and CDN.

Resource Class:         Static Media / Icons
Path Pattern:           /favicon.ico, /robots.txt
Cache-Control:          public, max-age=86400, must-revalidate
Rationale:              1-day cache with revalidation.

Resource Class:         Authenticated API Responses
Path Pattern:           /api/v1/*
Cache-Control:          no-store, no-cache, must-revalidate, private
CDN Caching:            STRICTLY PROHIBITED (Bypasses CDN cache entirely)
================================================================================
```

---

## 16. HORIZONTAL SCALING & STATE BOUNDARIES

### 16.1 Accurate Application State Classification
To ensure technical accuracy, application state is explicitly partitioned:

1. **APPLICATION BUSINESS & SESSION STATE**: **EXTERNALLY PERSISTED / HORIZONTALLY REPLICABLE**
   - User credentials, progress, cognitive analytics, and question banks live in MongoDB Atlas.
   - User session records live in MongoDB `AuthSession` collection with TTL indexing.
   - JWT tokens are cryptographically self-contained and verified statelessly against `JWT_ACCESS_KEYS`.
   - Containers share zero local disk state.

2. **PROCESS-LOCAL OPERATIONAL STATE**: **PRESENT (EPHEMERAL)**
   - In-memory rate-limiter sliding windows (`globalRateLimiter`, `authRateLimiter`, `refreshRateLimiter`, `llmRateLimiter`).
   - In-flight HTTP request counter (`http_active_requests`).
   - Prometheus metrics series cache and duration histograms.
   - Lifecycle state machine (`STARTING`, `RUNNING`, `SHUTTING_DOWN`).
   - *These are ephemeral runtime state variables, not durable business state, and reset cleanly on task restart.*

### 16.2 Two-Layer Distributed Rate-Limiting Policy

```text
================================================================================
TWO-LAYER RATE-LIMITING ARCHITECTURE
================================================================================
LAYER 1: EDGE / INGRESS DISTRIBUTED ABUSE PROTECTION (AWS WAF / ALB)
  • Scope: Edge / Ingress Level (Provider-Managed, Before Application)
  • Connection Flood Protection: SYN flood mitigation, HTTP connection concurrency caps.
  • IP-Based Coarse Rate Limiting: AWS WAF Rate-Based Rule (e.g. 2,000 req / 5 min per IP).
  • Payload Size Enforcement: Rejects HTTP bodies > 100 kB (matching Express limit).
  • Malformed Request Shield: Drops invalid HTTP verbs, malformed headers at ALB.
  • Application Code Modification: ZERO (100% infrastructure-owned).

LAYER 2: FROZEN APPLICATION RATE LIMITERS (EXPRESS MIDDLEWARE)
  • Scope: Container Process-Local (Phase 14 Preserved Invariants)
  • Global Tier: 300 req / 15m per IP (Process-Local Sliding Window)
  • Auth Tier: 5 attempts / 15m per IP+email (Process-Local Sliding Window)
  • Refresh Tier: 20 req / 15m per IP+tokenHash (Process-Local Sliding Window)
  • LLM Tier: 20 req / 1m per userId (Process-Local Sliding Window)
  • Enforcement Invariant: Counters are process-local per container instance.
  • Multi-Replica Semantics: Under 2 replicas, effective system-wide capacity is fail-soft
    (up to 2x nominal limits under ideal load balancing).
  • Zero False Global Claims: We explicitly DO NOT claim globally synchronized rate limits
    across replicas. Exact global synchronization would require a shared Redis tier
    inside Express middleware, which is an UPSTREAM APPLICATION CHANGE (strictly prohibited).
================================================================================
```

```text
EDGE DISTRIBUTED RATE-LIMIT CONTRACT: DEFINED
FROZEN BACKEND RATE LIMITERS:          PRESERVED / PER-INSTANCE
FALSE GLOBAL-LIMIT CLAIMS:             0
APPLICATION SOURCE CHANGES:            0
```

### 16.3 Non-Root Runtime Execution Contract

```text
================================================================================
CONTAINER NON-ROOT RUNTIME SPECIFICATION
================================================================================
FRONTEND CONTAINER (Static Nginx SPA):
  • Base Image: nginxinc/nginx-unprivileged:alpine
  • Runtime User: UID 101 (nginx) / GID 101 (nginx)
  • Listener Port: 8080 (Unprivileged port, non-root bindable)
  • Process PID: /tmp/nginx.pid (Writable by UID 101)
  • Temp/Cache Paths: client_body_temp_path /tmp/client_temp; etc. (Writable by UID 101)
  • Asset Mount: /usr/share/nginx/html mounted read-only
  • Privilege Escalation: security_opt: [no-new-privileges:true]
  • FRONTEND CONTAINER ROOT USER AT RUNTIME: NO

BACKEND CONTAINER (Node.js Express API):
  • Base Image: node:20-alpine
  • Runtime User: UID 1000 (node) / GID 1000 (node)
  • Listener Port: 5000 (Unprivileged port)
  • Privilege Escalation: security_opt: [no-new-privileges:true]
  • Process Directive: USER node in Dockerfile
  • Filesystem Posture: Read-only container rootfs with ephemeral /tmp
  • BACKEND CONTAINER ROOT USER AT RUNTIME: NO
================================================================================
```

---

## 17. ENVIRONMENT DEFINITIONS & PARITY MATRIX

| Dimension | Local Development | Continuous Integration (CI) | Staging Environment | Production Environment |
|---|---|---|---|---|
| **Domain Origin** | `http://localhost:5173` | Ephemeral localhost | `https://staging.example.com` | `https://app.example.com` |
| **API Path Ingress**| Relative `/api/v1/*` (Vite Proxy)| Relative `/api/v1/*` (MSW) | Same-Origin `/api/v1/*` (Nginx) | Same-Origin `/api/v1/*` (AWS ALB) |
| **TLS & HSTS** | Plaintext HTTP | Plaintext HTTP | Full TLS 1.3 + HSTS | Full TLS 1.3 + HSTS |
| **Database Target** | Local / Shared Dev Atlas | In-Memory / `TEST_MONGODB_URI`| Staging Atlas Replica Set | Production Atlas Dedicated M10+ |
| **Secrets Source** | Local `.env` | GitHub Actions Secrets | AWS Secrets Manager (Staging)| AWS Secrets Manager (Prod) |
| **Logging Output** | Formatted text / console | Silent / TAP report | Structured ndjson | Structured ndjson + CloudWatch |
| **Metrics Scrape** | Disabled | Disabled | Enabled (Internal Scrape) | Enabled (Prometheus Fleet Scrape) |
| **Deployment Gate** | Manual `npm run dev` | Automated on commit | Automated on main merge | Manual Approval Gate |

---

## 18. TRACEABILITY MATRIX: PHASE 15 HANDOFFS TO PHASE 16 ARCHITECTURE

| Phase 15 Upstream Contract / Handoff | Phase 16 Infrastructure Realization | Status in Phase 16 Architecture |
|---|---|---|
| **Same-Origin Production Contract** | Unified AWS ALB Ingress routes `/` to frontend and `/api/v1/*` to backend. | `PRESERVED & ENFORCED` |
| **`VITE_API_BASE_URL="/"`** | Frontend build uses default relative paths; zero cross-origin API hosts configured. | `PRESERVED & ENFORCED` |
| **Transport Finding W39** | Operation 64 sends `Idempotency-Key` without CORS preflight due to unified ingress origin. | `PRESERVED AS RESOLVED` |
| **Phase 15 CSP Directives** | Static Nginx delivers exact frozen CSP: `default-src 'self'`, `style-src 'self'`, `font-src 'self'`. | `PRESERVED & REALIZED` |
| **Zero `'unsafe-inline'`** | Enforced strictly in SPA CSP; CSS Modules compile into external stylesheets. | `PRESERVED & REALIZED` |
| **System Fonts Only (Section 35)** | Preserved; `font-src 'self'` permits local fonts while ACC-16 enforces 0 font assets. | `PRESERVED & REALIZED` |
| **Zero External Scripts (ACC-16)** | Ingress/Nginx sets `script-src 'self'`; zero third-party script origins permitted. | `PRESERVED & REALIZED` |
| **Phase 13 Health Endpoints** | Container orchestrator wires liveness to `/health/live` and readiness to `/health/ready`. | `CONSUMED & REALIZED` |
| **Phase 13 Prometheus Metrics** | Internal scraper queries `/metrics` with `Authorization: Bearer <METRICS_SCRAPE_SECRET>`. | `CONSUMED & REALIZED` |
| **Phase 13 Graceful Shutdown** | Orchestrator sets `stopTimeout: 15` matching backend 10s drain window. | `CONSUMED & REALIZED` |
| **Phase 14 Security Middleware** | Ingress terminates TLS and injects HSTS; backend preserves existing route middleware. | `PRESERVED & COMPLEMENTED` |
| **Phase 15 Client-Side SPA Routes** | Nginx implements `try_files $uri $uri/ /index.html` for all 19 canonical routes. | `PRESERVED & REALIZED` |
| **HttpOnly SameSite=Strict Refresh Cookie**| Delivered seamlessly because browser and API share identical origin scheme/host/port. | `PRESERVED & REALIZED` |

---

## 19. COMPLETE, BOUNDED FUTURE IMPLEMENTATION FOOTPRINT

The table below defines the complete, bounded inventory of exactly **62 files** that will be created when Phase 16 implementation is subsequently authorized. **Zero files are created in this architecture task.**

### 19.1 Inventory Summary
- **Root Compose Manifests**: 1 file
- **Application Container, Proxy & Collector Configs**: 9 files
- **CI/CD Automation Workflows**: 2 files
- **Operational Verification Scripts**: 1 file
- **Operational Documentation**: 1 file
- **Terraform Root Module & Variable Files**: 6 files
- **Terraform Reusable Infrastructure Modules**: 42 files (14 modules $\times$ 3 files)
- **Total Future Implementation Files**: **62 files**

### 19.2 Explicit File Manifest

| # | Exact File Path | Architectural Class | Purpose & Component Ownership | Secret Exposure Classification | Validation Method |
|---|---|---|---|---|---|
| 1 | `docker-compose.local.yml` | Composition Manifest | Local development & test parity linking ingress, frontend, backend, and test mongo | NONE (Reads local dev .env; zero prod secrets) | `docker compose config` |
| 2 | `docker/frontend.Dockerfile` | Container Build | Multi-stage build compiling frontend and serving via `nginxinc/nginx-unprivileged:alpine` (UID 101) | NONE (Zero secrets in container layers) | `docker build` + Trivy scan |
| 3 | `docker/backend.Dockerfile` | Container Build | Non-root production Node.js 20 runtime packaging backend API (UID 1000) | NONE (Zero secrets in container layers) | `docker build` + non-root audit |
| 4 | `docker/nginx-frontend.conf` | Web Server Config | Unprivileged Nginx config: port 8080, caching headers, frozen SPA CSP, SPA routing | NONE (Zero secrets) | `nginx -t` validation |
| 5 | `docker/nginx-ingress.conf` | Ingress Proxy Config | Ingress template for local container parity routing `/` -> frontend, `/api/v1/*` -> backend | NONE (Zero secrets) | `nginx -t` validation |
| 6 | `docker/appspec-frontend.yml` | CodeDeploy Manifest | AWS CodeDeploy deployment specification template for frontend ECS Blue/Green target groups | NONE (Zero secrets; task ARN substituted in CI) | YAML parser / CodeDeploy audit |
| 7 | `docker/appspec-backend.yml` | CodeDeploy Manifest | AWS CodeDeploy deployment specification template for backend ECS Blue/Green target groups | NONE (Zero secrets; task ARN substituted in CI) | YAML parser / CodeDeploy audit |
| 8 | `docker/prometheus/Dockerfile` | Collector Container | Dedicated Prometheus container image based on `prom/prometheus:v2.51.0` | NONE (Zero secrets in image layers) | `docker build` + Trivy scan |
| 9 | `docker/prometheus/prometheus.yml.tpl` | Scrape Config Template | Prometheus configuration template scraping `backend.internal:5000/metrics` and remote-writing to AMP | NONE (Config template; references scrape_token file) | `promtool check config` |
| 10 | `docker/prometheus/entrypoint.sh` | Container Bootstrap | Bootstrap script writing `METRICS_SCRAPE_SECRET` to `/tmp/prometheus/secrets/scrape_token` (0600) and starting Prometheus | NONE (Script only; reads runtime env to ephemeral file) | Shellcheck / execution test |
| 11 | `.github/workflows/ci.yml` | CI Pipeline | Automated typecheck, test, build, ACC-16, Playwright, container build, and security scan | NONE (Zero secrets committed; uses GitHub OIDC) | GitHub Actions dry-run |
| 12 | `.github/workflows/deploy.yml` | CD Pipeline | Staging and production Blue/Green promotion workflow with approval gate | NONE (Zero secrets committed; uses GitHub OIDC & IAM) | GitHub Actions dry-run |
| 13 | `scripts/verifyProductionDeployment.js` | Operational Script | Automated post-deployment smoke validator checking same-origin, TLS, CSP, health | NONE (Zero secrets committed; test script) | Executable smoke runner |
| 14 | `docs/PHASE16_PRODUCTION_RUNBOOK.md` | Operations Runbook | Runbook for on-call rotation, secret rotation, scaling, and disaster recovery | NONE (Documentation only) | Operational peer review |
| 15 | `infra/terraform/main.tf` | Terraform Root | Root composition linking all 14 infrastructure modules | NONE (IaC definition; zero hardcoded secrets) | `terraform validate` |
| 16 | `infra/terraform/variables.tf` | Terraform Variables | Root input variable definitions for AWS account, region, environment | NONE (Variable declarations; sensitive=true flagged) | `terraform validate` |
| 17 | `infra/terraform/outputs.tf` | Terraform Outputs | Root outputs (ALB DNS, ECR URLs, CloudWatch log group names) | NONE (Non-sensitive resource identifiers) | `terraform validate` |
| 18 | `infra/terraform/terraform.tfvars.example` | Terraform Variables | Example variable definitions template (zero secrets) | NONE (Example template with dummy values) | Syntax validation |
| 19 | `infra/terraform/staging.tfvars` | Environment Config | Staging environment input values | NONE (Environment parameters; zero secrets committed) | `terraform plan -var-file` |
| 20 | `infra/terraform/production.tfvars` | Environment Config | Production environment input values | NONE (Environment parameters; zero secrets committed) | `terraform plan -var-file` |
| 21 | `infra/terraform/modules/vpc/main.tf` | Network Module | VPC, public/private subnets across 2 AZs, NAT gateways, route tables | NONE (IaC network resources; zero secrets) | `terraform validate` |
| 22 | `infra/terraform/modules/vpc/variables.tf` | Network Module | Input variables for CIDR blocks and availability zones | NONE (Network parameters) | `terraform validate` |
| 23 | `infra/terraform/modules/vpc/outputs.tf` | Network Module | Exported VPC ID, public subnet IDs, private subnet IDs | NONE (Resource IDs) | `terraform validate` |
| 24 | `infra/terraform/modules/security_groups/main.tf` | Security Module | Security groups for ALB, Frontend ECS tasks, Backend ECS tasks | NONE (Security rules; zero secrets) | `terraform validate` |
| 25 | `infra/terraform/modules/security_groups/variables.tf` | Security Module | Port variables and VPC reference | NONE (Port and ID parameters) | `terraform validate` |
| 26 | `infra/terraform/modules/security_groups/outputs.tf` | Security Module | Exported security group IDs | NONE (Resource IDs) | `terraform validate` |
| 27 | `infra/terraform/modules/acm/main.tf` | TLS Module | ACM certificate resource and DNS validation records | NONE (Certificate resources; zero secrets) | `terraform validate` |
| 28 | `infra/terraform/modules/acm/variables.tf` | TLS Module | Domain name and Route53 zone ID variables | NONE (Domain parameters) | `terraform validate` |
| 29 | `infra/terraform/modules/acm/outputs.tf` | TLS Module | Exported certificate ARN | NONE (Resource ARN) | `terraform validate` |
| 30 | `infra/terraform/modules/alb/main.tf` | Ingress Module | ALB, HTTP/HTTPS listeners, path routing rules, Blue/Green target groups | NONE (ALB resources; zero secrets) | `terraform validate` |
| 31 | `infra/terraform/modules/alb/variables.tf` | Ingress Module | Subnet IDs, cert ARN, security group references | NONE (Resource references) | `terraform validate` |
| 32 | `infra/terraform/modules/alb/outputs.tf` | Ingress Module | Exported ALB DNS name, listener ARNs, target group ARNs | NONE (Resource ARNs and DNS) | `terraform validate` |
| 33 | `infra/terraform/modules/waf/main.tf` | Edge Protection Module | AWS WAFv2 WebACL with rate-based rules, body-size limits | NONE (WAF rules; zero secrets) | `terraform validate` |
| 34 | `infra/terraform/modules/waf/variables.tf` | Edge Protection Module | Rate limit thresholds and ALB ARN | NONE (Threshold parameters) | `terraform validate` |
| 35 | `infra/terraform/modules/waf/outputs.tf` | Edge Protection Module | Exported WebACL ARN | NONE (Resource ARN) | `terraform validate` |
| 36 | `infra/terraform/modules/ecr/main.tf` | Container Registry | Private Amazon ECR repositories for frontend, backend, and collector images | NONE (Registry resources; zero secrets) | `terraform validate` |
| 37 | `infra/terraform/modules/ecr/variables.tf` | Container Registry | Repository naming and lifecycle policy variables | NONE (Naming parameters) | `terraform validate` |
| 38 | `infra/terraform/modules/ecr/outputs.tf` | Container Registry | Exported repository URLs | NONE (Registry URLs) | `terraform validate` |
| 39 | `infra/terraform/modules/iam/main.tf` | Identity Module | IAM roles and execution policies for ECS tasks, collector, and CodeDeploy | NONE (IAM policies; zero secrets) | `terraform validate` |
| 40 | `infra/terraform/modules/iam/variables.tf` | Identity Module | Secrets ARNs and resource name prefixes | NONE (Resource ARN parameters) | `terraform validate` |
| 41 | `infra/terraform/modules/iam/outputs.tf` | Identity Module | Exported task execution role ARN, task role ARN, CodeDeploy role ARN | NONE (Resource ARNs) | `terraform validate` |
| 42 | `infra/terraform/modules/secrets/main.tf` | Secrets Module | AWS Secrets Manager secret placeholders and KMS encryption keys | NONE (Defines secret containers; values populated out-of-band) | `terraform validate` |
| 43 | `infra/terraform/modules/secrets/variables.tf` | Secrets Module | Secret names, KMS key settings, and environment tags | NONE (Configuration parameters) | `terraform validate` |
| 44 | `infra/terraform/modules/secrets/outputs.tf` | Secrets Module | Exported secret ARNs and KMS key ARN | NONE (Resource ARNs) | `terraform validate` |
| 45 | `infra/terraform/modules/ecs_cluster/main.tf` | Compute Module | ECS Cluster resource and Fargate capacity providers | NONE (Cluster resources; zero secrets) | `terraform validate` |
| 46 | `infra/terraform/modules/ecs_cluster/variables.tf` | Compute Module | Cluster naming variables | NONE (Naming parameters) | `terraform validate` |
| 47 | `infra/terraform/modules/ecs_cluster/outputs.tf` | Compute Module | Exported ECS cluster ID and ARN | NONE (Resource IDs) | `terraform validate` |
| 48 | `infra/terraform/modules/service_discovery/main.tf` | Discovery Module | AWS Cloud Map Private DNS Namespace `internal` and service for `backend.internal` | NONE (DNS and discovery resources; zero secrets) | `terraform validate` |
| 49 | `infra/terraform/modules/service_discovery/variables.tf` | Discovery Module | VPC ID, namespace name (`internal`), and service parameters | NONE (Namespace parameters) | `terraform validate` |
| 50 | `infra/terraform/modules/service_discovery/outputs.tf` | Discovery Module | Exported namespace ID, namespace ARN, and service ARN | NONE (Resource IDs) | `terraform validate` |
| 51 | `infra/terraform/modules/vpc_peering/main.tf` | Peering Module | AWS VPC Peering Connection Accepter and VPC route table entries for Atlas CIDR | NONE (Peering accepter and route resources; zero secrets) | `terraform validate` |
| 52 | `infra/terraform/modules/vpc_peering/variables.tf` | Peering Module | Atlas peering connection ID, Atlas CIDR (`192.168.0.0/21`), private route table IDs | NONE (Network peering parameters) | `terraform validate` |
| 53 | `infra/terraform/modules/vpc_peering/outputs.tf` | Peering Module | Exported peering connection ID and status | NONE (Resource ID) | `terraform validate` |
| 54 | `infra/terraform/modules/ecs_services/main.tf` | Service Module | ECS Task definitions and services for frontend, backend, and prometheus-collector | NONE (Task definitions reference secret ARNs; zero secrets) | `terraform validate` |
| 55 | `infra/terraform/modules/ecs_services/variables.tf` | Service Module | Task sizing, container image URIs, secret ARNs, subnet IDs, discovery service ARN | NONE (Configuration parameters) | `terraform validate` |
| 56 | `infra/terraform/modules/ecs_services/outputs.tf` | Service Module | Exported service names and task definition ARNs | NONE (Resource ARNs) | `terraform validate` |
| 57 | `infra/terraform/modules/codedeploy/main.tf` | Deployment Module | AWS CodeDeploy applications and deployment groups for frontend and backend Blue/Green | NONE (Deployment group resources; zero secrets) | `terraform validate` |
| 58 | `infra/terraform/modules/codedeploy/variables.tf` | Deployment Module | ALB listener ARNs, target group ARNs, ECS service names | NONE (Resource references) | `terraform validate` |
| 59 | `infra/terraform/modules/codedeploy/outputs.tf` | Deployment Module | Exported CodeDeploy application names and deployment group names | NONE (Resource names) | `terraform validate` |
| 60 | `infra/terraform/modules/observability/main.tf` | Monitoring Module | CloudWatch Log Groups, Alarms, SNS Topic, and AMP workspace resource | NONE (Observability resources; zero secrets) | `terraform validate` |
| 61 | `infra/terraform/modules/observability/variables.tf` | Monitoring Module | Retention days, alarm threshold variables, SNS subscription endpoints | NONE (Monitoring parameters) | `terraform validate` |
| 62 | `infra/terraform/modules/observability/outputs.tf` | Monitoring Module | Exported Log Group names, SNS topic ARN, and AMP workspace endpoint | NONE (Resource ARNs and endpoints) | `terraform validate` |

```text
================================================================================
FUTURE IMPLEMENTATION FOOTPRINT AUDIT
================================================================================
EXACT FILE COUNT:                     62 FILES
MANIFEST ROW COUNT:                   62 ROWS
UNBOUNDED IMPLEMENTATION FILES:        0
UNRESOLVED FILE PATHS:                0
"ETC." OR "AS NEEDED" REFERENCES:     0
DUPLICATE FILE PATHS:                 0
SECRET IN CONTAINER LAYERS:           0
SECRET IN GIT:                        0
SECRET IN CI LOGS:                    0
================================================================================
```

---

## 20. RISK REGISTER & MITIGATION STRATEGIES

| Risk ID | Risk Description | Severity | Impact | Mitigation Strategy |
|---|---|---|---|---|
| **RSK-16-01** | Ingress misconfiguration exposes `/metrics` or `/health/*` to the public internet. | High | Information disclosure | ALB listener rules explicitly block public access; internal probes communicate directly over private VPC subnets. |
| **RSK-16-02** | Stale `index.html` cached on user browsers preventing adoption of new deployment. | High | App broken / script mismatch | Strict `Cache-Control: no-cache, no-store, must-revalidate` enforced on `/index.html` at Nginx and ALB. |
| **RSK-16-03** | MongoDB Atlas network partition causes cascading readiness probe failures across all nodes. | High | Complete service outage | `serverSelectionTimeoutMS: 5000` prevents thread hangs; circuit-breaker logging alerts on-call; replica set auto-failover handles node drop. |
| **RSK-16-04** | Container image vulnerability introduced via base OS packages. | Medium | Potential exploit | CI/CD pipeline runs automated vulnerability scanning (Trivy) and blocks image publishing on Critical/High CVEs. |
| **RSK-16-05** | CORS preflight inadvertently triggered if frontend build accidentally sets an absolute `VITE_API_BASE_URL`. | High | Operation 64 fails | Pipeline enforces `VITE_API_BASE_URL` is unset or `/`; ACC-16 post-build checks reject absolute URLs in client bundle. |

---

## 21. MECHANICAL AUDIT OF ARCHITECTURAL DECISIONS

Every consequential architectural decision across all infrastructure tiers has been enumerated, evaluated, and closed:

| Decision ID | Architectural Scope | Status | Selected Option | Implementation Impact | Open Input Required? | Blocker? |
|---|---|---|---|---|---|---|
| **ADR-16-01** | Ingress & Reverse Proxy Architecture | **CLOSED** | Unified ALB Ingress routing path-based traffic | ALB listener rules for `/` and `/api/v1/*` | No | No |
| **ADR-16-02** | Frontend Delivery Model | **CLOSED** | `nginxinc/nginx-unprivileged:alpine` on Port 8080 | Multi-stage Dockerfile + `nginx.conf` | No | No |
| **ADR-16-03** | Production Container Platform | **CLOSED** | AWS ECS with AWS Fargate | Task definitions + ECS service + ALB | No | No |
| **ADR-16-04** | Container Packaging Strategy | **CLOSED** | Separate Specialized Containers (Frontend / Backend) | Two independent Dockerfiles | No | No |
| **ADR-16-05** | TLS Termination & Edge Security | **CLOSED** | ALB terminates TLS & injects HSTS; Nginx injects SPA CSP | ACM cert + ALB HSTS header | No | No |
| **ADR-16-06** | Secrets Management Architecture | **CLOSED** | AWS Secrets Manager runtime task injection (canonical backend inventory) | Task definition secret references | No | No |
| **ADR-16-07** | CI/CD Pipeline Architecture | **CLOSED** | Multi-Stage GitHub Actions using existing repo scripts | `.github/workflows/ci.yml` | No | No |
| **ADR-16-08** | Release & Rollback Strategy | **CLOSED** | Blue/Green Deployment with AWS CodeDeploy & ALB | CodeDeploy Blue/Green spec | No | No |
| **ADR-16-09** | Frontend CSP Contract | **CLOSED** | Frozen Phase 15 CSP (0 `'unsafe-inline'`, `font-src 'self'`) | Configured in `nginx-frontend.conf` | No | No |
| **ADR-16-10** | Security Header Ownership | **CLOSED** | Deterministic 4-class ownership (Section 8.4) | Implemented at distinct network tiers | No | No |
| **ADR-16-11** | Distributed Rate-Limiting Policy| **CLOSED** | Two-Layer: Edge WAF coarse + Backend process-local | AWS WAF rate rules + Phase 14 backend | No | No |
| **ADR-16-12** | Container Non-Root Runtime | **CLOSED** | Non-root UID 101 (Nginx) & UID 1000 (Node.js) | Specified in Dockerfile USER directives | No | No |
| **ADR-16-13** | Database Production Topology | **CLOSED** | MongoDB Atlas Dedicated M10+ 3-node Replica Set | VPC Peering in private subnet | No | No |
| **ADR-16-14** | MongoDB Private Connectivity | **CLOSED** | AWS VPC Peering (non-overlapping CIDRs) | Peer connection + route table entries | No | No |
| **ADR-16-15** | Infrastructure-as-Code Model | **CLOSED** | HashiCorp Terraform (v1.8+ with AWS Provider 5.x) | `infra/terraform/` modules | No | No |
| **ADR-16-16** | Production Logging Pipeline | **CLOSED** | ECS Native `awslogs` driver -> AWS CloudWatch Logs | CloudWatch Log Group + Insights | No | No |
| **ADR-16-17** | Metrics Scraping & Storage | **CLOSED** | Prometheus ECS Collector Task -> Amazon AMP via AWS Cloud Map `backend.internal:5000/metrics` | `prometheus-collector` task on Fargate | No | No |
| **ADR-16-18** | Static Asset CDN Policy | **CLOSED** | INITIAL PRODUCTION CDN: NONE (Direct ALB/Nginx) | Direct ALB routing; CloudFront deferred | No | No |
| **ADR-16-19** | Local Container Parity | **CLOSED** | `docker-compose.local.yml` (local testing only) | Local orchestration manifest | No | No |
| **ADR-16-20** | Static Asset Caching Strategy | **CLOSED** | Fingerprinted immutable (1y) + `index.html` no-cache | Nginx location block directives | No | No |
| **ADR-16-21** | CodeDeploy Artifact Ownership | **CLOSED** | Dual Service-Scoped AppSpecs (`docker/appspec-frontend.yml` & `docker/appspec-backend.yml`) | CodeDeploy ECS deployment workflow | No | No |
| **ADR-16-22** | Container Registry Architecture | **CLOSED** | Amazon ECR Private Repositories | Private repositories with Trivy/Inspector scans | No | No |
| **ADR-16-23** | TLS Certificate Management | **CLOSED** | AWS Certificate Manager (ACM) with Route53 DNS validation | ACM certificate resource + automated renewal | No | No |
| **ADR-16-24** | Observability Alert Ownership | **CLOSED** | CloudWatch Alarms for AWS Native & AMP Rule Groups for Prometheus Metrics (Unified SNS Topic) | P1/P2 Metric Alarms + AMP rules + SNS | No | No |

```text
================================================================================
ARCHITECTURAL DECISION AUDIT SUMMARY
================================================================================
TOTAL CONSEQUENTIAL DECISIONS EVALUATED: 24
DECISIONS CLOSED & RESOLVED:           24 / 24
OPEN ARCHITECTURE DECISIONS:           0
BLOCKERS:                              0
ARCHITECTURE CONTRADICTIONS:           0
================================================================================
```

---

## 22. SUBSEQUENT GOVERNANCE GATE

```text
================================================================================
PHASE 16 GOVERNANCE GATE STATUS
================================================================================
Phase 16 Architecture Proposal:    v1.0.4-PROPOSED
Status:                            PROPOSED / READY FOR FINAL ARCHITECTURE
                                   GOVERNANCE VERIFICATION
Implementation Authorization:      NONE (STRICTLY PROHIBITED IN THIS TASK)
Implementation Performed:          NO (0 CODE FILES CREATED OR MODIFIED)
Next Gate:                         PHASE 16 FINAL ARCHITECTURE GOVERNANCE
                                   VERIFICATION / FREEZE DECISION
================================================================================
```
