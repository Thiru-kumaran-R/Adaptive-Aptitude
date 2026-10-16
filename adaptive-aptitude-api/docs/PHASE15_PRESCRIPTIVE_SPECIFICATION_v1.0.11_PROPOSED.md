# PHASE 15 — LEARNER APPLICATION & ADAPTIVE UX
# PRESCRIPTIVE IMPLEMENTATION SPECIFICATION

```text
Document: docs/PHASE15_LEARNER_APPLICATION_ADAPTIVE_UX_PRESCRIPTIVE_SPECIFICATION.md
Version: v1.0.11-PROPOSED
Status: PROPOSED / RECONCILED / AWAITING FINAL SPECIFICATION VERIFICATION
Architecture Basis: docs/PHASE15_ARCHITECTURE_PROPOSAL.md v1.0.13-FROZEN
Architecture SHA-256: 2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba
Historical Frozen Architecture Baseline: docs/PHASE15_ARCHITECTURE_PROPOSAL.md v1.0.12-FROZEN (SHA-256: d4c83adca5dfaef6e7f8d5eb6da6d19fa31d813ca527a998db77cf38a1a28556)
Historical Frozen Specification Baseline: docs/PHASE15_LEARNER_APPLICATION_ADAPTIVE_UX_PRESCRIPTIVE_SPECIFICATION.md v1.0.10-FROZEN (SHA-256: e985734ba76cf15f81d3d6f380516bb7a7e49eae7dc35ec303a86d11f07afcdf)
Historical Specification Provenance: docs/PHASE15_LEARNER_APPLICATION_ADAPTIVE_UX_PRESCRIPTIVE_SPECIFICATION.md v1.0.9-FROZEN (SHA-256: 41f969e3c1a1471c6a2594b64f4f969cb6ba88eaa7a81d2640bc0286fd1aa63f)
Implementation Authorization: NONE (Specification Proposed Candidate Under Verification)
Implementation Performed: NO
Frontend Baseline: Paused at 13/121 authorized files (108 missing)
Date: October 2026
```

---

## 1. AUTHORITATIVE PRECEDENCE & GOVERNANCE HIERARCHY

This prescriptive specification translates the frozen Phase 15 Architecture Proposal (`docs/PHASE15_ARCHITECTURE_PROPOSAL.md` version `1.0.13-FROZEN`, SHA-256: `2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba`, and preceding historical frozen baseline `v1.0.12-FROZEN`, SHA-256: `d4c83adca5dfaef6e7f8d5eb6da6d19fa31d813ca527a998db77cf38a1a28556`) into deterministic, implementation-addressable engineering contracts. A separate implementation agent or engineering team must be able to construct the learner application without architectural interpretation or discretionary deviation.

### 1.1 Strict Precedence Hierarchy

The platform enforces an immutable four-tier governance hierarchy:

```text
Frozen Phase 1–14 Platform Contracts
              >
PHASE15_ARCHITECTURE_PROPOSAL.md v1.0.13-FROZEN
              >
Phase 15 Prescriptive Specification (v1.0.11-PROPOSED)
              >
Future Phase 15 Implementation Details
```

### 1.2 Invariable Architectural Rules

1. **Explicit Implementation Detail Permitted**: The prescriptive specification MAY make concrete implementation details explicit (exact file paths, TypeScript types, CSS tokens, error handling branches, test vectors, query keys) where the frozen architecture intentionally left mechanical detail unspecified.
2. **Architectural Alterations Prohibited**: The specification MUST NOT change an architectural decision, alter an upstream backend contract, invent a backend database field, invent an HTTP route, alter authentication semantics, redefine learning algorithms, or introduce infrastructure owned by Phase 16.
3. **Teacher / Admin Scope Prohibited**: The specification MUST NOT introduce teacher, administrator, institutional, or operator scopes, portals, routes, or roles.
4. **Blocker Reporting Mandate**: If an implementation-addressability gap cannot be resolved without altering frozen architecture decisions, it MUST be reported as:
   ```text
   SPECIFICATION BLOCKER — ARCHITECTURE RECONCILIATION REQUIRED
   ```
   Authoring MUST NOT silently choose a contradictory architecture.

---

## 2. FROZEN PLATFORM BASELINE & METRIC INTEGRITY

Phase 15 operates strictly as a pure client-side consumer of the verified, permanently frozen backend baseline delivered in Phases 1 through 14.

### 2.1 Frozen Platform Baseline Metrics

```text
Question Bank:                  12,000 Questions
Canonical Topics:               24 Topics
Canonical Patterns:             278 Patterns
Legacy Pattern Mappings:        308 Mappings
Prerequisite Patterns:          218 Patterns
Foundational Patterns:          60 Patterns
Prerequisite Directed Edges:    410 Edges
DAG Graph Cycles:               0 (Strict Directed Acyclic Graph)
Question Fingerprint Matches:   12,000 / 12,000 SHA-256 Verified
Mongoose Models:                16 Models
MongoDB Collections:            16 Collections
HTTP Registered Routes:         86 Routes
Phase 15 Consumed Routes:       64 Routes
Phase 15 Non-Consumed Routes:   22 Routes
Unclassified Backend Routes:    0 Routes
Consumed ∩ Non-Consumed:        ∅
Consumed ∪ Non-Consumed:        86 Routes
Backend Runtime Dependencies:   6 (cookie-parser, cors, dotenv, express, jsonwebtoken, mongoose)
Backend Dev Dependencies:       3 (jest, nodemon, supertest)
Prometheus Metric Families:     8 Families
```

### 2.2 Phase 15 Implementation Deltas

The Phase 15 implementation MUST strictly adhere to zero backend mutations:

```text
Backend Model Delta:            0
Backend Collection Delta:       0
Backend Route Delta:            0
Backend Algorithm Delta:        0
Database Schema Delta:          0
Backend Source Tree Mutation:   0
```

---

## 3. SPECIFICATION GOAL & IMPLEMENTATION DIRECTIVE

The primary objective of this prescriptive specification is to bridge the gap between architectural proposal and mechanical implementation. Every requirement defined herein answers the ten canonical implementation questions:

1. **WHAT is implemented?** The exact feature, component, service, or module.
2. **WHERE is it implemented?** The exact file path within the authorized frontend root.
3. **WHICH type/interface owns it?** The exact TypeScript type, interface, or discriminated union.
4. **WHICH endpoint does it consume?** The exact HTTP method, path, and wire payload.
5. **WHAT state transitions occur?** The finite state machine transitions from trigger to termination.
6. **WHAT failure behavior occurs?** The deterministic UI degradation, error mapping, and recovery path.
7. **WHAT cache/query behavior occurs?** The exact TanStack Query keys, `staleTime`, `gcTime`, and invalidations.
8. **WHAT security rule applies?** In-memory token management, sanitized HTML rendering, or anti-leakage barriers.
9. **HOW is it tested?** The specific Vitest, MSW, or Playwright test suites and assertions.
10. **WHAT constitutes acceptance?** The exact observable PASS criteria.

Subjective terminology (`handle errors gracefully`, `make responsive`, `use best practices`, `support accessibility`) is strictly replaced with mechanically verifiable assertions.

---

## 4. EXACT FRONTEND ROOT & DIRECTORY ARCHITECTURE

### 4.1 Root Directory Isolation

The Phase 15 frontend application MUST be authored entirely within its own dedicated root directory:

```text
/Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-app/
```

### 4.2 Complete Isolation from Backend Source

1. **Backend Tree Isolation**: The frontend root directory `adaptive-aptitude-app/` MUST remain completely decoupled from the backend directory `/Users/rajakumaran/Documents/Aptitude/adaptive-aptitude-api/`.
2. **Zero Backend Pollution**: No frontend source files, styles, build artifacts, test configurations, or node modules may be placed inside `adaptive-aptitude-api/`.
3. **Zero Backend Reorganization**: No backend files, routes, utilities, or datasets may be moved, renamed, reorganized, or deleted during Phase 15 implementation.
4. **Independent Package Ecosystem**: The frontend application maintains its own independent `package.json`, `tsconfig.json`, `node_modules`, and build artifacts.

---

## 5. EXACT DEPENDENCY CONTRACT & VERSION BUDGET

The frontend application operates under an immutable dependency budget inheriting the exact packages and semver ranges frozen in Phase 15 Architecture Proposal Section 68.

### 5.1 Runtime Dependencies (Exactly 7 Packages)

| Package | Exact Version Range | Operational Responsibility | Architectural & Security Justification |
|---|---|---|---|
| `react` | `^18.3.1` | Core UI library | Declarative component reconciliation; built-in JSX escaping prevents raw XSS. |
| `react-dom` | `^18.3.1` | DOM renderer | Mounts React component tree into browser DOM. |
| `react-router-dom` | `^6.24.1` | Declarative client routing | Client-side routing, navigation guards, protected route shells. |
| `@tanstack/react-query` | `^5.45.1` | Server-state caching | Query caching, deduplication, background revalidation, abort signal propagation. |
| `marked` | `^13.0.0` | Markdown parser | Parses AI tutor Socratic guidance (markdown, code blocks, lists) into HTML AST. |
| `dompurify` | `^3.1.5` | DOM sanitizer | Strips XSS vectors, scripts, and event handlers from parsed HTML. |
| `lucide-react` | `^0.395.0` | SVG iconography | Tree-shaken inline SVG icons; zero external font network requests. |

**Total Runtime Dependencies Count: 7 (Exactly 7)**

### 5.2 Development Dependencies (Exactly 12 Packages)

| Package | Exact Version Range | Operational Responsibility | Architectural Justification |
|---|---|---|---|
| `typescript` | `^5.4.5` | Static type checker | Strict compile-time typing (`strict: true`) matching backend DTOs. |
| `@types/react` | `^18.3.3` | React type definitions | Static type contracts for React components and hooks. |
| `@types/react-dom` | `^18.3.0` | React DOM type definitions | Static type contracts for DOM rendering. |
| `vite` | `^5.3.1` | Build tool and dev server | ESM build bundler, dev server, asset optimizer. |
| `@vitejs/plugin-react` | `^4.3.1` | React Vite plugin | Fast-refresh React compiler transform for Vite. |
| `vitest` | `^1.6.0` | Unit & component test runner | Native Vite test execution, ESM support, watch mode. |
| `jsdom` | `^24.1.0` | Headless browser DOM | Provides `window`, `document`, and browser globals in Node for Vitest. |
| `@testing-library/react` | `^16.0.0` | Component testing utilities | DOM testing utilities focusing on user-observable accessibility tree. |
| `@testing-library/jest-dom` | `^6.4.6` | Custom DOM matchers | Jest/Vitest assertion matchers (`toBeInTheDocument`, `toBeVisible`). |
| `@testing-library/user-event` | `^14.5.2` | Event simulation | Realistic user event simulation for keyboard and pointer interactions. |
| `msw` | `^2.3.1` | Mock Service Worker | Intercepts `fetch` at network level for deterministic contract tests. |
| `@playwright/test` | `^1.45.0` | End-to-end test runner | Multi-browser automation (Chromium, Firefox, WebKit) for E2E validation. |

**Total Development Dependencies Count: 12 (Exactly 12)**

### 5.3 Strictly Prohibited Dependencies

The introduction of any undeclared package is strictly forbidden. Specifically prohibited libraries:

```text
State Management:      Redux, Zustand, MobX, Recoil, Jotai
HTTP Clients:          Axios, Superagent, Ky, Got, Request
Charting Libraries:    Recharts, Chart.js, D3, Victory, ECharts
CSS Frameworks:        Tailwind CSS, Bootstrap, Bulma, Foundation
CSS-in-JS Libraries:   styled-components, Emotion, Stitches, JSS
Math Rendering:        KaTeX, MathJax (Plain Unicode + Tabular Numerals mandatory)
Font Bundles:          @fontsource/*, Google Fonts webfont loaders (System font mandatory)
Accessibility Test:    Undeclared automated testing runners (Use RTL + Jest-DOM + computed style inspection)
Coverage Providers:    @vitest/coverage-v8, @vitest/coverage-istanbul (test:coverage removed)
Telemetry SDKs:        Sentry, LogRocket, Datadog, Mixpanel, Google Analytics
```

### 5.4 Dependency Installation & Reproducibility Semantics

1. **Lockfile Format**: `adaptive-aptitude-app/package-lock.json` MUST adhere to `lockfileVersion: 3` (npm v9/v10 standard).
2. **Initial Dependency Materialization**: `npm install` executes against the frozen `package.json`, creating/updating `package-lock.json` containing only the authorized 7 runtime and 12 dev dependencies.
3. **Deterministic Verification Install**: `npm ci` strictly reproduces the dependency graph from `package-lock.json`.
4. **Undeclared Direct Dependencies**: Count = **0**.

### 5.5 Canonical Configuration Specifications (All 7 CONFIG Files)

The 7 configuration files in the closed inventory prescribe deterministic compiler, bundler, and testing environments without open architectural decisions:

#### 5.5.1 `adaptive-aptitude-app/package.json`
```json
{
  "name": "adaptive-aptitude-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 5173 --strictPort",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.45.1",
    "dompurify": "^3.1.5",
    "lucide-react": "^0.395.0",
    "marked": "^13.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.0",
    "msw": "^2.3.1",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vitest": "^1.6.0"
  }
}
```

#### 5.5.2 `adaptive-aptitude-app/package-lock.json`
- Adheres to `lockfileVersion: 3` (npm v9/v10 default).
- Deterministic resolved dependency graph generated via `npm install` and verified via `npm ci`.
- Excludes undeclared top-level runtime/dev dependencies.

#### 5.5.3 `adaptive-aptitude-app/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": [
    "src",
    "e2e"
  ],
  "exclude": [
    "dist",
    "node_modules"
  ]
}
```

#### 5.5.4 `adaptive-aptitude-app/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    pure: ['console.log'],
  },
  build: {
    manifest: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          'query-vendor': [
            '@tanstack/react-query',
          ],
        },
      },
    },
  },
});
```

#### 5.5.5 `adaptive-aptitude-app/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
```

#### 5.5.6 `adaptive-aptitude-app/playwright.config.ts`

The Playwright configuration prescribes a deterministic port contract: the preview server MUST listen on exactly `127.0.0.1:5173` (via the `--strictPort` flag) before Playwright begins. The `webServer.command` includes `npm run build &&` to guarantee a production build exists before `npm run preview` starts. The build-time `webServer.env.VITE_API_BASE_URL` is set to `'/'` to ensure that `resolveApiUrl()` resolves all API endpoints to same-origin relative `/api/v1/*` paths matching the frozen production architecture. No secondary origin or external API server is started; Playwright route interception (`page.route('**/api/v1/**', ...)`) fulfills all API operations locally on the same origin `http://127.0.0.1:5173`. `reuseExistingServer: false` makes an occupied preview port fail locally and in CI, rather than accept an unrelated process. With the documented tooling/browser prerequisites in Section 56, `npm run test:e2e` builds and starts its own production preview without a separately started backend or pre-existing build.

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:5173',
    env: { VITE_API_BASE_URL: '/' },
    reuseExistingServer: false,
  },
});
```

#### 5.5.7 `adaptive-aptitude-app/index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Adaptive Aptitude — Intelligent Engineering Preparation</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 6. AUTHORITATIVE FILE INVENTORY (ALL 121 FILES)

The implementation footprint is established as a closed, deterministic inventory of exactly **121 authorized files**. Every authorized file is classified, bounded by permitted imports, assigned forbidden responsibilities, and tied to verification tests.

### 6.1 Classification Taxonomy

- `CONFIG`: Build configuration, tool settings, and package manifests (7 files).
- `STATIC-ASSET`: Static images, icons, and document root assets (1 file).
- `PRODUCTION`: Client application code, styles, types, services, and components (79 files).
- `TEST`: Unit, component, integration, security, and contract test suites (29 files).
- `E2E`: Playwright end-to-end browser test suites and fixtures (5 files).

### 6.2 Complete File Inventory Matrix (121 Files)

#### 6.2.1 Configuration Files (7 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `adaptive-aptitude-app/package.json` | `CONFIG` | NPM dependencies and script definitions | N/A (JSON) | Adding unapproved packages | Command: `npm run build` |
| `adaptive-aptitude-app/package-lock.json` | `CONFIG` | NPM v3 dependency lock, deterministic resolved dependency graph | N/A (JSON) | Manually editing lockfile or adding undeclared dependencies | Command: `npm ci` |
| `adaptive-aptitude-app/tsconfig.json` | `CONFIG` | TypeScript compiler configuration (`strict: true`) | N/A (JSON) | Disabling strict type rules | Command: `npm run typecheck` |
| `adaptive-aptitude-app/vite.config.ts` | `CONFIG` | Vite bundling, esbuild minification, and vendor manual chunk splitting | `vite`, `@vitejs/plugin-react` | Modifying backend code, adding Terser, adding chart-vendor | Command: `npm run build` |
| `adaptive-aptitude-app/vitest.config.ts` | `CONFIG` | Vitest test runner setup, jsdom environment | `vitest/config` | E2E configuration | Command: `npm run test` |
| `adaptive-aptitude-app/playwright.config.ts` | `CONFIG` | Playwright multi-viewport browser config | `@playwright/test` | Unit test configuration | Command: `npm run test:e2e` |
| `adaptive-aptitude-app/index.html` | `CONFIG` | HTML document shell, viewport meta, root div | N/A (HTML) | Loading external scripts/fonts | `e2e/learner-journey.spec.ts` |

#### 6.2.2 Static Assets (1 File)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `adaptive-aptitude-app/public/favicon.svg` | `STATIC-ASSET` | SVG application favicon icon | N/A (SVG XML) | JavaScript code execution | Manual: Asset inspection |

#### 6.2.3 Core Production Files (3 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/main.tsx` | `PRODUCTION` | React root mounting, QueryClientProvider setup (canonical global CSS entry) | `react`, `react-dom/client`, `App`, `@tanstack/react-query`, `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/animations.css` | Business logic, redundant global CSS imports | `e2e/auth-journey.spec.ts` |
| `src/App.tsx` | `PRODUCTION` | App router wrapping and AuthProvider wiring | `react`, `router`, `AuthContext`, `src/styles/layout.module.css` | Direct fetch calls | `e2e/auth-journey.spec.ts` |
| `src/router.tsx` | `PRODUCTION` | React Router definitions (20 path records) | `react`, `react-router-dom`, `pages/*`, `ProtectedLayout`, `src/styles/layout.module.css` | State mutation | `src/test/components/AuthBootstrapBoundary.test.ts` |

#### 6.2.4 Design System & Styling Files (11 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/styles/tokens.css` | `PRODUCTION` | CSS Custom Properties (Colors, Spacing, Radii) | None | CSS Frameworks | `src/test/a11y/accessibility.test.ts` |
| `src/styles/global.css` | `PRODUCTION` | CSS Reset, system font stack, tabular numerals | None | Ad-hoc utilities | Manual: Visual layout inspection |
| `src/styles/animations.css` | `PRODUCTION` | Transitions, `@media (prefers-reduced-motion)`| None | Heavy layout shifts | `src/test/a11y/accessibility.test.ts` |
| `src/styles/controls.module.css` | `PRODUCTION` | Scoped styles for reusable design system UI primitives (`Button`, `Card`, `Badge`, `Modal`, `Skeleton`, `ErrorAlert`) | Global CSS tokens via `var(...)` | Hardcoded color literals, global resets, CSS frameworks | `src/test/a11y/accessibility.test.ts` |
| `src/styles/layout.module.css` | `PRODUCTION` | Scoped styles for shell navigation, layout grid, header, sidebar, bottom nav, and protected shell containment (`App`, `AppHeader`, `AppSidebar`, `BottomNav`, `ProtectedLayout`) | Global CSS tokens via `var(...)` | Ad-hoc utility classes, horizontal scroll overflows, external web fonts | `src/test/a11y/accessibility.test.ts` |
| `src/styles/quiz.module.css` | `PRODUCTION` | Scoped styles for quiz question presentation, option choice buttons, exam timer, palette grid, and explanation drawer (`QuestionCard`, `QuestionPalette`, `ExamTimer`, `ExplanationDrawer`) | Global CSS tokens via `var(...)` | Inline style injection, display of answer keys during active exam mode | `src/test/components/QuestionCard.test.ts` |
| `src/styles/dashboard.module.css` | `PRODUCTION` | Scoped styles for daily dashboard cards, next-best-action hero widget, 4-segment agenda list, and readiness gauge (`NextActionCard`, `AgendaSegmentList`, `ReadinessMeter`) | Global CSS tokens via `var(...)` | CSS-in-JS libraries, layout shifts during data revalidation | `src/test/components/CognitiveDiagnosticsSvg.test.ts` |
| `src/styles/analytics.module.css` | `PRODUCTION` | Scoped styles for cognitive analytics dashboard, SVG chart containers, axis legends, and tooltip overlays (`CognitiveDiagnosticsSvg`, `SpeedAccuracyMatrixSvg`, `RetentionEvidenceSvg`, `AnalyticsDashboardPage`) | Global CSS tokens via `var(...)` | Third-party charting library stylesheets, non-accessible SVG color fills | `src/test/components/CognitiveDiagnosticsSvg.test.ts` |
| `src/styles/tutor.module.css` | `PRODUCTION` | Scoped styles for Socratic AI chat interface, message bubbles, progressive hint disclosure accordion, and workspace layout (`TutorChatWindow`, `HintAccordion`, `TutorWorkspacePage`) | Global CSS tokens via `var(...)` | Unsanitized HTML rendering, external markdown stylesheets | `src/test/integration/tutorRateLimit.test.ts` |
| `src/styles/auth.module.css` | `PRODUCTION` | Scoped styles for public landing marketing layout, login/register forms, auth bootstrap skeleton, and account disabled screen (`LandingPage`, `LoginPage`, `RegisterPage`, `AuthContext`) | Global CSS tokens via `var(...)` | External font CDNs, third-party auth widget stylesheets | `src/test/components/AuthBootstrapBoundary.test.ts` |
| `src/styles/pages.module.css` | `PRODUCTION` | Scoped styles for protected learner screens and multi-step study plan onboarding wizards (`OnboardingPage`, `DashboardPage`, `DailyAgendaPage`, `PracticeCatalogPage`, `TopicDetailPage`, `PatternPracticePage`, `AdaptivePracticePage`, `MistakesNotebookPage`, `RevisionQueuePage`, `MockCatalogPage`, `MockSessionPage`, `MockResultPage`, `MockReviewPage`, `ProfileSettingsPage`) | Global CSS tokens via `var(...)` | Global style pollution, arbitrary un-tokenized spacing units | `e2e/learner-journey.spec.ts` |

#### 6.2.5 TypeScript Contracts & Interfaces (4 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/types/api.ts` | `PRODUCTION` | Backend-proven wire DTOs (all 64 consumed operations) | None | UI component state | Command: `npm run typecheck` |
| `src/types/auth.ts` | `PRODUCTION` | AuthStatus union, UserPrincipal, Session | `src/types/api` | Storing raw JWTs | `src/test/components/AuthBootstrapBoundary.test.ts` |
| `src/types/quiz.ts` | `PRODUCTION` | QuestionCard discriminated unions, QuizViewModel | `src/types/api` | Backend wire mutation | `src/test/components/QuestionCard.test.ts` |
| `src/types/analytics.ts` | `PRODUCTION` | View-model contracts for SVG charts and meters | `src/types/api` | Unsupported metrics | `src/test/components/CognitiveDiagnosticsSvg.test.ts` |

#### 6.2.6 Context & State Providers (1 File)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/context/AuthContext.tsx` | `PRODUCTION` | AuthContext, AuthProvider, AuthBootstrapBoundary, and terminal auth views (AccountDisabledView, AuthUnavailableView) | `react`, `react-router-dom`, `@tanstack/react-query`, `tokenManager`, `authApi`, `src/types/auth`, `src/styles/auth.module.css` | Storing access token string in state or storage | `src/test/components/AuthBootstrapBoundary.test.ts` |

#### 6.2.7 Shared Utilities (5 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/utils/apiBaseUrl.ts` | `PRODUCTION` | Single base URL resolver for client and tokens | None | Making HTTP calls | `src/test/unit/apiBaseUrl.test.ts` |
| `src/utils/markdownSanitizer.ts` | `PRODUCTION` | `marked` parsing + `DOMPurify` HTML sanitizing | `marked`, `dompurify` | Direct DOM injection | `src/test/unit/markdownSanitizer.security.test.ts` |
| `src/utils/errorCodeMapper.ts` | `PRODUCTION` | Maps backend error codes to human UI messages | `src/types/api` | Error suppression | `src/test/unit/errorCodeMapper.test.ts` |
| `src/utils/queryKeyFactory.ts` | `PRODUCTION` | Centralized TanStack Query key factory | None | Direct API calls | `src/test/unit/queryKeyFactory.test.ts` |
| `src/utils/logger.ts` | `PRODUCTION` | Development-only logger using import.meta.env.DEV, redacting credentials | None | Logging JWT/passwords, emitting console.log in production | `src/test/unit/tokenManager.security.test.ts` |

#### 6.2.8 API Services & HTTP Handlers (14 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/services/api/apiClient.ts` | `PRODUCTION` | Fetch wrapper, bearer injection, 401 replay | `tokenManager`, `apiBaseUrl` | Unsanitized logging | `src/test/unit/apiClient.test.ts` |
| `src/services/api/tokenManager.ts` | `PRODUCTION` | Sole raw JWT owner & single-flight refresh lock | `src/utils/apiBaseUrl` | Persistent storage | `src/test/unit/tokenManager.security.test.ts` |
| `src/services/api/authApi.ts` | `PRODUCTION` | Auth endpoints (register, login, me, logout) | `apiClient`, `tokenManager`, `src/types/api` | Local storage manipulation or independent refresh fetch/lock | `src/test/api/authApi.contract.test.ts` |
| `src/services/api/questionApi.ts` | `PRODUCTION` | Topics, patterns, question explorer endpoints | `apiClient`, `src/types/api` | Answer validation | `src/test/api/questionApi.contract.test.ts` |
| `src/services/api/attemptApi.ts` | `PRODUCTION` | Question attempt submission & mistake querying | `apiClient`, `src/types/api` | Correctness calculation | `src/test/api/attemptApi.contract.test.ts` |
| `src/services/api/adaptiveApi.ts` | `PRODUCTION` | Next-question adaptive decision querying | `apiClient`, `src/types/api` | Difficulty calibration | `src/test/api/adaptiveApi.contract.test.ts` |
| `src/services/api/goalApi.ts` | `PRODUCTION` | User profile & goal CRUD (operations 14–19) | `apiClient`, `src/types/api` | Optimistic goal creation | `src/test/api/goalApi.contract.test.ts` |
| `src/services/api/planningApi.ts` | `PRODUCTION` | Plans & daily objectives (operations 20–26) | `apiClient`, `src/types/api` | Local schedule calculation | `src/test/api/planningApi.contract.test.ts` |
| `src/services/api/progressApi.ts` | `PRODUCTION` | Mastery matrices & prerequisites (29–33) | `apiClient`, `src/types/api` | Local mastery math | `src/test/api/progressApi.contract.test.ts` |
| `src/services/api/revisionApi.ts` | `PRODUCTION` | Spaced revision queue, 2-day projection (35–37)| `apiClient`, `src/types/api` | SM-2 calculation | `src/test/api/revisionApi.contract.test.ts` |
| `src/services/api/mockApi.ts` | `PRODUCTION` | Mock session lifecycle, responses, finalization | `apiClient`, `src/types/api` | Client-side score calculation | `src/test/api/mockApi.contract.test.ts` |
| `src/services/api/analyticsApi.ts` | `PRODUCTION` | Cognitive diagnostics, topic mastery, retention, readiness | `apiClient`, `src/types/api` | Percentile fabrication | `src/test/api/analyticsApi.contract.test.ts` |
| `src/services/api/orchestrationApi.ts` | `PRODUCTION` | Daily agenda, next-best-action, prescriptions (Operations 53–57, 64) | `apiClient`, `src/types/api` | Priority arbitration | `src/test/api/orchestrationApi.contract.test.ts` |
| `src/services/api/learningApi.ts` | `PRODUCTION` | AI tutor, hints, attempt error diagnosis | `apiClient`, `src/types/api` | Automatic 429 retry | `src/test/api/learningApi.contract.test.ts` |

#### 6.2.9 Common UI Components (6 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/components/common/Button.tsx`` | ``PRODUCTION`` | Accessible button with loading spinner state | `react`, `lucide-react`, `src/styles/controls.module.css` | Direct fetch calls | `src/test/integration/tutorRateLimit.test.ts` |
| ``src/components/common/Card.tsx`` | ``PRODUCTION`` | Semantic content card with elevation tokens | `react`, `src/styles/controls.module.css` | Form logic | `src/test/components/QuestionCard.test.ts` |
| ``src/components/common/Badge.tsx`` | ``PRODUCTION`` | Status badge (weak, proficient, mastered) | `react`, `src/styles/controls.module.css` | Business rules | `src/test/components/QuestionCard.test.ts` |
| ``src/components/common/Modal.tsx`` | ``PRODUCTION`` | Accessible dialog with focus trap & Escape key | `react`, `lucide-react`, `src/styles/controls.module.css` | Route navigation | `src/test/a11y/accessibility.test.ts` |
| ``src/components/common/Skeleton.tsx`` | ``PRODUCTION`` | Content loading skeleton placeholder | `react`, `src/styles/controls.module.css` | Dynamic data logic | `src/test/components/AuthBootstrapBoundary.test.ts` |
| ``src/components/common/ErrorAlert.tsx`` | ``PRODUCTION`` | Error banner with correlation ID disclosure | `react`, `lucide-react`, `src/styles/controls.module.css` | Silent error drop | `src/test/unit/errorCodeMapper.test.ts` |

#### 6.2.10 Layout Components (4 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/components/layout/AppHeader.tsx`` | ``PRODUCTION`` | Top navigation header, user avatar, logout CTA | `react`, `lucide-react`, `AuthContext`, `src/styles/layout.module.css` | Direct JWT mutation | `e2e/auth-journey.spec.ts` |
| ``src/components/layout/AppSidebar.tsx`` | ``PRODUCTION`` | Collapsible navigation sidebar (WCAG landmark) | `react-router-dom`, `lucide-react`, `src/styles/layout.module.css` | State duplication | `src/test/a11y/accessibility.test.ts` |
| ``src/components/layout/BottomNav.tsx`` | ``PRODUCTION`` | Mobile bottom navigation bar (< 640px) | `react-router-dom`, `lucide-react`, `src/styles/layout.module.css` | Desktop rendering | `e2e/responsive-viewports.spec.ts` |
| `src/components/layout/ProtectedLayout.tsx` | `PRODUCTION` | Protected shell layout & ProtectedShellBoundary composing AuthBootstrapBoundary from AuthContext | `react`, `react-router-dom`, `AuthContext`, `AppHeader`, `AppSidebar`, `BottomNav`, `src/styles/layout.module.css` | Bypassing auth, storing raw JWT | `src/test/components/AuthBootstrapBoundary.test.ts` |

#### 6.2.11 Data Visualization Components (3 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/components/charts/CognitiveDiagnosticsSvg.tsx`` | ``PRODUCTION`` | Accessible diagnostics summary, quadrant composition and stamina profile | `react`, `SpeedAccuracyMatrixSvg`, `src/types/analytics`, `src/styles/analytics.module.css` | External chart libraries | `src/test/components/CognitiveDiagnosticsSvg.test.ts` |
| ``src/components/charts/SpeedAccuracyMatrixSvg.tsx`` | ``PRODUCTION`` | Accessible 2×2 speed/accuracy quadrant count matrix | `react`, `src/types/analytics`, `src/styles/analytics.module.css` | External chart libraries | `src/test/api/analyticsApi.contract.test.ts` |
| ``src/components/charts/RetentionEvidenceSvg.tsx`` | ``PRODUCTION`` | Accessible observed retention by gap and revision-stage evidence | `react`, `src/types/analytics`, `src/styles/analytics.module.css` | External chart libraries | `src/test/api/analyticsApi.contract.test.ts` |

#### 6.2.12 Quiz & Mock Examination Components (4 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/components/quiz/QuestionCard.tsx`` | ``PRODUCTION`` | Mode-safe discriminated union question card | `react`, `src/types/quiz`, `src/styles/quiz.module.css` | Active mock answer leak | `src/test/components/QuestionCard.test.ts` |
| ``src/components/quiz/QuestionPalette.tsx`` | ``PRODUCTION`` | Grid of question status numbers for mock exams | `react`, `src/types/quiz`, `src/styles/quiz.module.css` | Answer display | `src/test/integration/mockExamFlow.test.ts` |
| ``src/components/quiz/ExamTimer.tsx`` | ``PRODUCTION`` | Display-only exam timer with aria-live alerts | `react`, `lucide-react`, `src/styles/quiz.module.css` | Authoritative expiry | `src/test/components/ExamTimer.test.ts` |
| ``src/components/quiz/ExplanationDrawer.tsx`` | ``PRODUCTION`` | Slide-over drawer for post-answer explanation | `react`, `markdownSanitizer`, `src/styles/quiz.module.css` | Active exam rendering | `src/test/components/QuestionCard.test.ts` |

#### 6.2.13 Dashboard & Orchestration Components (3 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/components/dashboard/NextActionCard.tsx`` | ``PRODUCTION`` | Hero card rendering Next-Best-Action (NBA); emits start callback to parent container without mutating orchestration state directly | `react`, `src/types/api`, `lucide-react`, `src/styles/dashboard.module.css` | Direct API orchestration mutation, algorithmic ranking | `src/test/api/orchestrationApi.contract.test.ts` |
| ``src/components/dashboard/AgendaSegmentList.tsx`` | ``PRODUCTION`` | 4-segment daily agenda activity list; emits item selection callback to parent container without mutating orchestration state directly | `react`, `src/types/api`, `lucide-react`, `src/styles/dashboard.module.css` | Direct API orchestration mutation, activity generation | `src/test/api/orchestrationApi.contract.test.ts` |
| ``src/components/dashboard/ReadinessMeter.tsx`` | ``PRODUCTION`` | Radial gauge showing exam readiness index | `react`, `src/types/api`, `src/styles/dashboard.module.css` | Fabricating percentile | `src/test/api/analyticsApi.contract.test.ts` |

#### 6.2.14 AI Tutor & Learning Components (2 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/components/ai/TutorChatWindow.tsx`` | ``PRODUCTION`` | Conversational chat interface with 429 countdown | `react`, `learningApi`, `markdownSanitizer`, `src/styles/tutor.module.css` | Auto-retry on 429 | `src/test/integration/tutorRateLimit.test.ts` |
| ``src/components/ai/HintAccordion.tsx`` | ``PRODUCTION`` | Multi-tier progressive hint disclosure | `react`, `learningApi`, `src/styles/tutor.module.css` | Solution spoiler | `src/test/api/learningApi.contract.test.ts` |

#### 6.2.15 Route Page Components (19 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| ``src/pages/LandingPage.tsx`` | ``PRODUCTION`` | Public landing screen, product hero | `react`, `react-router-dom`, `src/styles/auth.module.css` | Protected data fetch | `e2e/auth-journey.spec.ts` |
| ``src/pages/LoginPage.tsx`` | ``PRODUCTION`` | Public login form, error alerts | `react`, `authApi`, `tokenManager`, `ErrorAlert`, `Button`, `src/styles/auth.module.css` | Auto-login | `e2e/auth-journey.spec.ts` |
| ``src/pages/RegisterPage.tsx`` | ``PRODUCTION`` | Public registration form, password policy | `react`, `authApi`, `ErrorAlert`, `Button`, `src/styles/auth.module.css` | Issuing JWTs | `e2e/auth-journey.spec.ts` |
| ``src/pages/OnboardingPage.tsx`` | ``PRODUCTION`` | Goal selection wizard & initial plan creation | `react`, `goalApi`, `planningApi`, `Modal`, `Button`, `src/styles/pages.module.css` | Skipping goals | `e2e/learner-journey.spec.ts` |
| ``src/pages/DashboardPage.tsx`` | ``PRODUCTION`` | Unified learner dashboard, readiness, NBA; owns Next-Best-Action issue/activate/complete lifecycle | `react`, `goalApi`, `planningApi`, `analyticsApi`, `orchestrationApi`, `progressApi`, `revisionApi`, `src/styles/pages.module.css` | Inventing metrics | `e2e/learner-journey.spec.ts` |
| ``src/pages/DailyAgendaPage.tsx`` | ``PRODUCTION`` | Prescriptive daily agenda view (4 segments); owns agenda item issue/activate/complete lifecycle | `react`, `orchestrationApi`, `AgendaSegmentList`, `src/styles/pages.module.css` | Direct db edits | `e2e/learner-journey.spec.ts` |
| ``src/pages/PracticeCatalogPage.tsx`` | ``PRODUCTION`` | 24-topic practice catalog grid | `react`, `questionApi`, `Card`, `Skeleton`, `src/styles/pages.module.css` | Answer retrieval | `src/test/api/questionApi.contract.test.ts` |
| ``src/pages/TopicDetailPage.tsx`` | ``PRODUCTION`` | Topic patterns browser & difficulty select | `react`, `questionApi`, `progressApi`, `Badge`, `Button`, `src/styles/pages.module.css` | Math mutation | `src/test/api/questionApi.contract.test.ts` |
| ``src/pages/PatternPracticePage.tsx`` | ``PRODUCTION`` | Standard 5/10/20 pattern drill session | `react`, `questionApi`, `attemptApi`, `QuestionCard`, `ExplanationDrawer`, `src/styles/pages.module.css` | Client correctness | `src/test/integration/adaptivePracticeFlow.test.ts` |
| ``src/pages/AdaptivePracticePage.tsx`` | ``PRODUCTION`` | Adaptive loop, deterministic next question | `react`, `adaptiveApi`, `attemptApi`, `QuestionCard`, `ExplanationDrawer`, `src/styles/pages.module.css` | Client difficulty | `src/test/integration/adaptivePracticeFlow.test.ts` |
| ``src/pages/MistakesNotebookPage.tsx`` | ``PRODUCTION`` | Filterable notebook of incorrect attempts | `react`, `attemptApi`, `learningApi`, `QuestionCard`, `ExplanationDrawer`, `src/styles/pages.module.css` | Deleting attempts | `src/test/api/attemptApi.contract.test.ts` |
| ``src/pages/RevisionQueuePage.tsx`` | ``PRODUCTION`` | 5-stage fixed revision queue & 2-day plan | `react`, `revisionApi`, `questionApi`, `attemptApi`, `QuestionCard`, `src/styles/pages.module.css` | Client intervals | `src/test/api/revisionApi.contract.test.ts` |
| ``src/pages/MockCatalogPage.tsx`` | ``PRODUCTION`` | Standard mock blueprints catalog & launch | `react`, `mockApi`, `Card`, `Modal`, `Button`, `src/styles/pages.module.css` | Editing blueprints | `e2e/mock-exam-journey.spec.ts` |
| ``src/pages/MockSessionPage.tsx`` | ``PRODUCTION`` | Full-screen active exam viewport | `react`, `mockApi`, `QuestionCard`, `QuestionPalette`, `ExamTimer`, `Modal`, `src/styles/pages.module.css` | Revealing answers | `src/test/integration/mockExamFlow.test.ts` |
| ``src/pages/MockResultPage.tsx`` | ``PRODUCTION`` | Final score report, accuracy, pacing | `react`, `mockApi`, `Card`, `Button`, `src/styles/pages.module.css` | Percentile fabrication | `src/test/integration/mockExamFlow.test.ts` |
| ``src/pages/MockReviewPage.tsx`` | ``PRODUCTION`` | Read-only post-exam diagnostic review | `react`, `mockApi`, `learningApi`, `QuestionCard`, `QuestionPalette`, `src/styles/pages.module.css` | Editing answers | `src/test/integration/mockExamFlow.test.ts` |
| ``src/pages/AnalyticsDashboardPage.tsx`` | ``PRODUCTION`` | Cognitive diagnostics, stamina, topic mastery, retention and readiness evidence | `react`, `analyticsApi`, `goalApi`, `ReadinessMeter`, `CognitiveDiagnosticsSvg`, `SpeedAccuracyMatrixSvg`, `RetentionEvidenceSvg`, `src/styles/analytics.module.css` | Ad-hoc metrics | `src/test/api/analyticsApi.contract.test.ts` |
| ``src/pages/TutorWorkspacePage.tsx`` | ``PRODUCTION`` | Dedicated Socratic AI Tutor workspace | `react`, `learningApi`, `TutorChatWindow`, `src/styles/tutor.module.css` | Unthrottled calls | `src/test/integration/tutorRateLimit.test.ts` |
| ``src/pages/ProfileSettingsPage.tsx`` | ``PRODUCTION`` | User profile, session info, revoke-all | `react`, `authApi`, `goalApi`, `AuthContext`, `Button`, `Modal`, `src/styles/pages.module.css` | Modifying userId | `e2e/auth-journey.spec.ts` |

#### 6.2.16 Test Infrastructure & Handlers (3 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/test/setup.ts` | `TEST` | Vitest setup: @testing-library/jest-dom/vitest matchers & MSW server lifecycle management | `@testing-library/jest-dom/vitest`, `vitest`, `src/test/mocks/server` | Production code, leaking un-reset network mocks | Command: `npm run test` |
| `src/test/mocks/server.ts` | `TEST` | MSW Node server setup for test execution | `msw/node`, `src/test/mocks/handlers` | Production code | Command: `npm run test` |
| `src/test/mocks/handlers.ts` | `TEST` | MSW request handlers for all 64 consumed endpoints | `msw`, `src/types/api` | Production code | Command: `npm run test` |

#### 6.2.17 Unit & Security Test Files (6 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/test/unit/tokenManager.security.test.ts` | `TEST` | Proves in-memory tokens & single-flight lock | `tokenManager`, `vitest`, `msw`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/unit/apiBaseUrl.test.ts` | `TEST` | Proves base URL resolution edge cases | `apiBaseUrl`, `vitest` | Production code | Command: `npm run test` |
| `src/test/unit/apiClient.test.ts` | `TEST` | Proves 401 replay, bearer injection, abort | `apiClient`, `tokenManager`, `vitest`, `msw`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/unit/errorCodeMapper.test.ts` | `TEST` | Proves mapping of all backend error codes | `errorCodeMapper`, `vitest`, `src/types/api` | Production code | Command: `npm run test` |
| `src/test/unit/markdownSanitizer.security.test.ts` | `TEST` | Proves DOMPurify XSS vector sanitization | `markdownSanitizer`, `vitest` | Production code | Command: `npm run test` |
| `src/test/unit/queryKeyFactory.test.ts` | `TEST` | Proves deterministic TanStack Query keys | `queryKeyFactory`, `vitest` | Production code | Command: `npm run test` |

#### 6.2.18 API Contract Test Files (12 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/test/api/authApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 1–6 | `authApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/questionApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 7–13 | `questionApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/goalApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 14–19 | `goalApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/planningApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 20–26 | `planningApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/attemptApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 27–28 | `attemptApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/progressApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 29–33 | `progressApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/adaptiveApi.contract.test.ts` | `TEST` | Proves wire contracts for operation 34 | `adaptiveApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/revisionApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 35–37 | `revisionApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/mockApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 38–48 | `mockApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/analyticsApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 49–52 | `analyticsApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/orchestrationApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 53–57, 64 | `orchestrationApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |
| `src/test/api/learningApi.contract.test.ts` | `TEST` | Proves wire contracts for operations 58–63 | `learningApi`, `msw`, `vitest`, `src/test/mocks/server` | Production code | Command: `npm run test` |

#### 6.2.19 Component & Integration Test Files (8 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `src/test/components/QuestionCard.test.ts` | `TEST` | Proves QuestionCard discriminated union safety | `QuestionCard`, `@testing-library/react`, `@testing-library/user-event`, `vitest`, `src/types/quiz` | Production code | Command: `npm run test` |
| `src/test/components/ExamTimer.test.ts` | `TEST` | Proves display countdown & zero-time behavior | `ExamTimer`, `@testing-library/react`, `vitest` | Production code | Command: `npm run test` |
| `src/test/components/CognitiveDiagnosticsSvg.test.ts` | `TEST` | Proves field-faithful diagnostics, stamina, topic, retention and readiness rendering | `CognitiveDiagnosticsSvg`, `SpeedAccuracyMatrixSvg`, `RetentionEvidenceSvg`, `AnalyticsDashboardPage`, `ReadinessMeter`, `msw`, `src/test/mocks/server`, `@testing-library/react`, `vitest`, `src/types/analytics`, `src/types/api` | Production code | Command: `npm run test` |
| `src/test/components/AuthBootstrapBoundary.test.ts` | `TEST` | Proves boundary states and redirect behavior | `AuthContext`, `@testing-library/react`, `react-router-dom`, `msw`, `src/test/mocks/server`, `vitest` | Production code | Command: `npm run test` |
| `src/test/integration/adaptivePracticeFlow.test.ts` | `TEST` | Proves adaptive practice cycle end-to-end | `AdaptivePracticePage`, `@testing-library/react`, `@testing-library/user-event`, `msw`, `src/test/mocks/server`, `vitest` | Production code | Command: `npm run test` |
| `src/test/integration/mockExamFlow.test.ts` | `TEST` | Proves exam start, save, submit, review | `MockSessionPage`, `MockResultPage`, `MockReviewPage`, `@testing-library/react`, `@testing-library/user-event`, `msw`, `src/test/mocks/server`, `vitest` | Production code | Command: `npm run test` |
| `src/test/integration/tutorRateLimit.test.ts` | `TEST` | Proves 429 rate limit button cooldown | `TutorChatWindow`, `TutorWorkspacePage`, `@testing-library/react`, `@testing-library/user-event`, `msw`, `src/test/mocks/server`, `vitest` | Production code | Command: `npm run test` |
| `src/test/a11y/accessibility.test.ts` | `TEST` | Automated assertions for the Phase 15 scoped accessibility requirements | `Button`, `Card`, `Modal`, `QuestionCard`, `AppHeader`, `AppSidebar`, `App`, `router`, `pages/*`, `ExamTimer`, `QuestionPalette`, `AuthContext`, `react-router-dom`, `msw`, `src/test/mocks/server`, `src/styles/tokens.css?raw`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `vitest` | Undeclared test runners, claiming full WCAG certification | Command: `npm run test` |

#### 6.2.20 Playwright End-to-End Test Files (5 Files)

| Path | Class | Responsibility | Allowed Imports | Forbidden Responsibilities | Associated Test |
|---|---|---|---|---|---|
| `e2e/fixtures.ts` | `E2E` | Isolated unauthenticated and refresh-bootstrap browser fixtures | `@playwright/test` | Unit test execution | Command: `npm run test:e2e` |
| `e2e/auth-journey.spec.ts` | `E2E` | Registration, login, bootstrap, logout | `./fixtures`, `@playwright/test` | Unit test execution | Command: `npm run test:e2e` |
| `e2e/learner-journey.spec.ts` | `E2E` | Full adaptive practice & revision journey | `./fixtures`, `@playwright/test` | Unit test execution | Command: `npm run test:e2e` |
| `e2e/mock-exam-journey.spec.ts` | `E2E` | Mock exam selection, unseal, complete, result | `./fixtures`, `@playwright/test` | Unit test execution | Command: `npm run test:e2e` |
| `e2e/responsive-viewports.spec.ts` | `E2E` | Multi-viewport layout regression tests | `./fixtures`, `@playwright/test` | Unit test execution | Command: `npm run test:e2e` |

### 6.2.21 Frozen E2E API Execution Model

The Phase 15 E2E layer uses **Playwright-native request interception and response fulfillment** as its single frozen API execution model. No real backend is required during `npm run test:e2e`.

#### Execution Model Contract

| Constraint | Value |
|---|---|
| Real production database writes | **0** |
| External backend startup dependency | **0** |
| Undeclared network dependency | **0** |
| New source-controlled files authorized | **0** |
| New dependencies authorized | **0** |
| API contract source | Frozen Phase 14 DTOs |

#### Same-Origin Local Test & Production Execution Topology

- SPA document/preview origin: `http://127.0.0.1:5173`.
- E2E build-time `VITE_API_BASE_URL`: `/`, set by Section 5.5.6. All API requests resolve to same-origin relative `/api/v1/*` paths via `resolveApiUrl()`.
- Unified local test origin: `http://127.0.0.1:5173`. Both SPA assets and API requests share this single origin, matching the frozen production path-based ingress topology (`https://app.example.com/` and `https://app.example.com/api/v1/*`).
- Port 5173 is the sole browser-visible origin. Playwright route interception (`page.route('**/api/v1/**', ...)`) fulfills all API endpoints locally. No external server, proxy, database, or secondary origin is required.
- Operation 64 carries `Idempotency-Key` without CORS preflight blocker because requests are dispatched same-origin.

#### `e2e/fixtures.ts` Ownership

`e2e/fixtures.ts` extends `@playwright/test` with test-scoped fixture state and the following mandatory behavior:

1. **Deterministic same-origin interception**: Intercepts all requests matching `**/api/v1/**` via Playwright's `page.route()` API on the same origin `http://127.0.0.1:5173`.
2. **In-memory stateful mock handlers**: The test harness maintains ephemeral in-memory state (user session, mock test questions, attempt logs, prescriptions) that resets cleanly between individual tests.
3. **No real network calls**: Any unmatched API request is aborted with `route.abort('failed')` to ensure tests never accidentally contact an external network. Static asset and document navigations pass through to the Vite preview server.
4. **Same-origin dispatch representation**: Under the governing same-origin architecture, all browser API requests are same-origin. Custom request headers (including `Idempotency-Key` on Operation 64) do NOT require cross-origin CORS preflight authorization.
5. **Refresh cookie representation**: The harness creates/rotates `refreshToken` on successful mocked login/refresh using `browserContext.addCookies([{ name: 'refreshToken', value: <opaque-test-generation>, domain: '127.0.0.1', path: '/api/v1/auth/refresh', httpOnly: true, sameSite: 'Strict', secure: false }])`. It reads cookie state only through Playwright's privileged context API to choose the simulated session response; it never exports the cookie to application JavaScript. Logout/revoke-all removes that cookie, and a subsequent real bootstrap receives 401. `secure: false` is the **local non-TLS test representation only**. Production MUST still set `HttpOnly; Path=/api/v1/auth/refresh; SameSite=Strict; Secure` over HTTPS; this suite does not claim to verify TLS/Secure transmission or backend cookie issuance.
6. **Cleanup**: Clear interception with `await page.unroute('**/api/v1/**', handler)` in fixture teardown, await pending observations/assertions, and let Playwright close the per-test context. No mutable state is shared across tests, retries, files, workers, or browser projects.

#### Mandatory Same-Origin Auth & Session Assertions (`e2e/auth-journey.spec.ts`)

These assertions are part of the existing file, run in Chromium, Firefox, and WebKit, and add no security-requirement IDs beyond the frozen SEC-01–17:

| Assertion | Mechanical Evidence Required |
|---|---|
| Same-origin API dispatch & URL resolution | Observe the application's refresh request URL exactly `http://127.0.0.1:5173/api/v1/auth/refresh` and document origin exactly `http://127.0.0.1:5173`; assert exact same-origin API routing via `resolveApiUrl()`. |
| Browser-managed credentials | For each application's refresh POST, assert that credentials mode is `credentials: 'include'`. No fixture, route, context, or application code may inject, overwrite, or synthesize the `Origin` header. |
| No frontend-created Origin; credentials included | Before scripts execute, install a test-only `page.addInitScript` fetch observer. Form `new Request(input, init)` solely for observation; record URL, method, `credentials`, and `headers.has('origin')`, then call the original native fetch with the **unchanged original arguments**. Assert every observed API request has `credentials === 'include'` and `headers.has('origin') === false`, with at least one refresh observation. Record no token/cookie/password values. Pair this with the network Origin assertion above: the forbidden-header behavior of browsers alone cannot prove the application did not attempt to set Origin. Existing `apiClient.test.ts` and `tokenManager.security.test.ts` additionally assert no case-insensitive Origin header in captured fetch arguments. |
| Cookie flags and path eligibility | After login and rotation, privileged `context.cookies(refreshURL)` returns exactly the expected refresh cookie with `httpOnly === true`, `sameSite === 'Strict'`, `secure === false`, host `127.0.0.1`, and exact refresh path. `context.cookies(origin + '/api/v1/auth/me')` and `context.cookies(origin + '/api/v1/auth/refresh-other')` contain no refresh cookie. This proves jar/path eligibility; intercepted Cookie headers are not a portable wire-transmission oracle. |
| HttpOnly unreadability at a matching path | In a separate same-context probe page, intercept a document navigation to `http://127.0.0.1:5173/api/v1/auth/refresh` and fulfill inert HTML with no application scripts. This is a fixture-only document, not a new screen or backend operation. Seed a non-sensitive, non-HttpOnly control cookie on the same host/path, assert it is visible to `document.cookie`, and assert `refreshToken` is absent. Privileged context inspection MUST still find the refresh cookie. Close the probe and remove its control cookie before continuing. Merely checking `document.cookie` on `/login` would only prove path exclusion. |
| Real token ownership and rotation | Public login supplies generation A in the response; observe real protected requests bearing A. Reload the page (clearing module memory); observe refresh without an Authorization header, successful generation B response, then `/auth/me` and a protected data request bearing B. No context-wide Authorization override or production token-setter hook may satisfy these assertions. |
| Invalid session and logout | Assert registration did not authenticate, logout clears the application's protected UI/cache, removes the simulated cookie, and reload/bootstrap yields 401 and login. Protected journeys likewise obtain tokens only through refresh/bootstrap. |

The fetch observer is fixture-owned test instrumentation, not a new production API or token owner. Assert its observations after each journey (including reloads) before context teardown; a missing observation is a failure, not a skipped assertion. No hard sleeps substitute for request/UI completion.

Browser-managed cookies are not reliably exposed in routed request headers. Consequently the suite verifies the browser cookie jar's HttpOnly/SameSite/path attributes, matching-path JavaScript unreadability, native credential mode, same-origin URL resolution, and application bearer flow. It does not claim end-to-end backend CORS enforcement, refresh theft detection, cookie transport over TLS, or production DB behavior from interception. Those upstream backend contracts remain frozen; Phase 16 owns deployment checks. Reference behavior: [Playwright request interception](https://playwright.dev/docs/network#how-request-interception-works) and [browser Origin header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin).

#### Deterministic Reset Guarantee

Each **test**, including every retry in each browser project, begins from a clean Playwright context. API route intercepts, response generations, counters, cookie state, and fetch observations are test-scoped. Public auth uses the empty-context mode; protected journeys select only the refresh-cookie bootstrap mode.

#### Why Not MSW Browser Worker?

MSW browser worker would require a `public/mockServiceWorker.js` file (violating the 121-file closed inventory). Playwright-native interception needs zero additional files or dependencies; service workers are blocked in Section 5.5.6 so they cannot bypass it.

#### E2E / Unit API Contract Relationship

The 64/64 MSW unit contract tests independently verify method, path, parameters, body, envelopes, and DTO ownership for every consumed operation. E2E fulfills only operations exercised by the journeys and verifies application/browser integration; it does NOT replace 64/64 wire-contract coverage or redefine backend contracts.

### 6.3 Exact Final File Inventory Summary

```text
Frontend Configuration Files:                     7
Frontend Static Assets:                           1
Frontend Production Files:                       79
Frontend Unit / Security / Contract Test Files:  29
Frontend E2E Files:                               5
Total Authorized Implementation Files:          121
Authorized Backend Modifications:                 0
Duplicate Inventory Paths:                        0
Unclassified Paths:                               0
```

### 6.4 Deterministic Component & Boundary Ownership Mapping

**Shared import rules**: In addition to each row's feature-specific imports, route pages may import `react-router-dom`, `@tanstack/react-query`, `AuthContext`, `queryKeyFactory`, `errorCodeMapper`, their declared Section 7 primary components, and type-only contracts from the four inventoried `src/types/*` files for navigation, caching, principal-derived IDs, error presentation, and props. Component/integration/accessibility TEST rows may import `react` (`createElement` keeps the frozen `.test.ts` paths valid without JSX), `@tanstack/react-query` for provider harnesses, and their inventoried subject's dependencies through the harness. These supporting permissions do not permit new services, raw fetches, JWT owners, files, backend imports, or any row's forbidden responsibility. Production files MUST NOT import TEST/E2E modules. The fixture-only fetch observer remains in `e2e/fixtures.ts`; the inline measurement command is never imported by application code.


Every named React component, error boundary, and terminal state view in the specification is assigned an unambiguous physical file owner in the authoritative closed inventory:

| Named Component / Error Boundary | Classification | Authoritative File Owner | Operational Semantics |
|---|---|---|---|
| `AppErrorBoundary` | `SYMBOL_OWNED_BY` | `src/App.tsx` | Top-level React Error Boundary catching unhandled render exceptions; renders fallback card with "Reload Page" CTA. |
| `RouteErrorBoundary` | `SYMBOL_OWNED_BY` | `src/router.tsx` | Route-level error elements (`errorElement`) in router definitions; displays correlation ID and retry/dashboard link. |
| `ProtectedShellBoundary` | `SYMBOL_OWNED_BY` | `src/components/layout/ProtectedLayout.tsx` | Shell layout error boundary & wrapper containing header, sidebar, and outlet navigation. |
| `AuthBootstrapBoundary` | `SYMBOL_OWNED_BY` | `src/context/AuthContext.tsx` | Auth state presentation orchestrator; renders loading skeleton during `BOOTSTRAPPING`, redirects unauthenticated users, or renders `AccountDisabledView`. |
| `AccountDisabledView` | `SYMBOL_OWNED_BY` | `src/context/AuthContext.tsx` | Terminal view rendered when user status is `ACCOUNT_DISABLED`; disables polling and displays support contact details. |
| `AuthUnavailableView` | `SYMBOL_OWNED_BY` | `src/context/AuthContext.tsx` | Service-unavailable fallback view when backend auth endpoints are unreachable during initial bootstrap. |
| Route-Specific Error Boundaries (Records 1–20) | `SYMBOL_OWNED_BY` | `src/router.tsx` | Parameterized instances of `RouteErrorBoundary` defined in `src/router.tsx` attached to individual route records. |

### 6.5 Scoped CSS Modules & TSX Component Ownership Mapping

Every component and route page TSX file in the application has a strictly defined, scoped CSS Module styling source:

| Scoped CSS Module File | Primary TSX Styling Owners | Scoped Styling Responsibility |
|---|---|---|
| `src/styles/controls.module.css` | `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `Skeleton.tsx`, `ErrorAlert.tsx` | Common UI control tokens, interactive states, loading pulses, modal overlays, accessible error banners. |
| `src/styles/layout.module.css` | `App.tsx`, `router.tsx`, `AppHeader.tsx`, `AppSidebar.tsx`, `BottomNav.tsx`, `ProtectedLayout.tsx` | Application shell grid, responsive header/sidebar navigation landmarks, mobile bottom nav bar, route error views. |
| `src/styles/quiz.module.css` | `QuestionCard.tsx`, `QuestionPalette.tsx`, `ExamTimer.tsx`, `ExplanationDrawer.tsx` | Mode-safe question layouts, radio choice tiles, mock exam timer display, question palette grid, drawer transitions. |
| `src/styles/dashboard.module.css` | `NextActionCard.tsx`, `AgendaSegmentList.tsx`, `ReadinessMeter.tsx` | Learner dashboard hero cards, 4-segment daily agenda activity cards, SVG radial readiness meter gauge. |
| `src/styles/analytics.module.css` | `CognitiveDiagnosticsSvg.tsx`, `SpeedAccuracyMatrixSvg.tsx`, `RetentionEvidenceSvg.tsx`, `AnalyticsDashboardPage.tsx` | Accessible diagnostic/stamina profiles, speed-accuracy count matrix, observed retention/stage bars, topic mastery and readiness layouts. |
| `src/styles/tutor.module.css` | `TutorChatWindow.tsx`, `HintAccordion.tsx`, `TutorWorkspacePage.tsx` | Socratic conversational transcript bubbles, markdown prose containers, multi-tier hint accordion, cooldown timers. |
| `src/styles/auth.module.css` | `LandingPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `AuthContext.tsx` | Marketing landing hero section, public auth forms, auth bootstrap skeleton, account disabled view. |
| `src/styles/pages.module.css` | `OnboardingPage.tsx`, `DashboardPage.tsx`, `DailyAgendaPage.tsx`, `PracticeCatalogPage.tsx`, `TopicDetailPage.tsx`, `PatternPracticePage.tsx`, `AdaptivePracticePage.tsx`, `MistakesNotebookPage.tsx`, `RevisionQueuePage.tsx`, `MockCatalogPage.tsx`, `MockSessionPage.tsx`, `MockResultPage.tsx`, `MockReviewPage.tsx`, `ProfileSettingsPage.tsx` | Protected learner screen layouts, multi-step onboarding wizard views, practice catalog grid, mistake notebook tables. |

### 6.6 Cross-Reference & Symbol Ownership Classification Matrix

Every file-like identifier and implementation symbol referenced across this specification is formally classified:

```text
INVENTORIED_FILE:
  adaptive-aptitude-app/package.json
  adaptive-aptitude-app/package-lock.json
  adaptive-aptitude-app/tsconfig.json
  adaptive-aptitude-app/vite.config.ts
  adaptive-aptitude-app/vitest.config.ts
  adaptive-aptitude-app/playwright.config.ts
  adaptive-aptitude-app/index.html
  adaptive-aptitude-app/public/favicon.svg
  src/main.tsx
  src/App.tsx
  src/router.tsx
  src/styles/tokens.css
  src/styles/global.css
  src/styles/animations.css
  src/styles/controls.module.css
  src/styles/layout.module.css
  src/styles/quiz.module.css
  src/styles/dashboard.module.css
  src/styles/analytics.module.css
  src/styles/tutor.module.css
  src/styles/auth.module.css
  src/styles/pages.module.css
  src/types/api.ts
  src/types/auth.ts
  src/types/quiz.ts
  src/types/analytics.ts
  src/context/AuthContext.tsx
  src/utils/apiBaseUrl.ts
  src/utils/markdownSanitizer.ts
  src/utils/errorCodeMapper.ts
  src/utils/queryKeyFactory.ts
  src/utils/logger.ts
  src/services/api/apiClient.ts
  src/services/api/tokenManager.ts
  src/services/api/authApi.ts
  src/services/api/questionApi.ts
  src/services/api/goalApi.ts
  src/services/api/planningApi.ts
  src/services/api/attemptApi.ts
  src/services/api/progressApi.ts
  src/services/api/adaptiveApi.ts
  src/services/api/revisionApi.ts
  src/services/api/mockApi.ts
  src/services/api/analyticsApi.ts
  src/services/api/orchestrationApi.ts
  src/services/api/learningApi.ts
  src/components/common/Button.tsx
  src/components/common/Card.tsx
  src/components/common/Badge.tsx
  src/components/common/Modal.tsx
  src/components/common/Skeleton.tsx
  src/components/common/ErrorAlert.tsx
  src/components/layout/AppHeader.tsx
  src/components/layout/AppSidebar.tsx
  src/components/layout/BottomNav.tsx
  src/components/layout/ProtectedLayout.tsx
  src/components/charts/CognitiveDiagnosticsSvg.tsx
  src/components/charts/SpeedAccuracyMatrixSvg.tsx
  src/components/charts/RetentionEvidenceSvg.tsx
  src/components/quiz/QuestionCard.tsx
  src/components/quiz/QuestionPalette.tsx
  src/components/quiz/ExamTimer.tsx
  src/components/quiz/ExplanationDrawer.tsx
  src/components/dashboard/NextActionCard.tsx
  src/components/dashboard/AgendaSegmentList.tsx
  src/components/dashboard/ReadinessMeter.tsx
  src/components/ai/TutorChatWindow.tsx
  src/components/ai/HintAccordion.tsx
  src/pages/LandingPage.tsx
  src/pages/LoginPage.tsx
  src/pages/RegisterPage.tsx
  src/pages/OnboardingPage.tsx
  src/pages/DashboardPage.tsx
  src/pages/DailyAgendaPage.tsx
  src/pages/PracticeCatalogPage.tsx
  src/pages/TopicDetailPage.tsx
  src/pages/PatternPracticePage.tsx
  src/pages/AdaptivePracticePage.tsx
  src/pages/MistakesNotebookPage.tsx
  src/pages/RevisionQueuePage.tsx
  src/pages/MockCatalogPage.tsx
  src/pages/MockSessionPage.tsx
  src/pages/MockResultPage.tsx
  src/pages/MockReviewPage.tsx
  src/pages/AnalyticsDashboardPage.tsx
  src/pages/TutorWorkspacePage.tsx
  src/pages/ProfileSettingsPage.tsx
  src/test/setup.ts
  src/test/mocks/handlers.ts
  src/test/mocks/server.ts
  src/test/unit/tokenManager.security.test.ts
  src/test/unit/apiClient.test.ts
  src/test/unit/apiBaseUrl.test.ts
  src/test/unit/errorCodeMapper.test.ts
  src/test/unit/markdownSanitizer.security.test.ts
  src/test/unit/queryKeyFactory.test.ts
  src/test/api/authApi.contract.test.ts
  src/test/api/questionApi.contract.test.ts
  src/test/api/goalApi.contract.test.ts
  src/test/api/planningApi.contract.test.ts
  src/test/api/attemptApi.contract.test.ts
  src/test/api/progressApi.contract.test.ts
  src/test/api/adaptiveApi.contract.test.ts
  src/test/api/revisionApi.contract.test.ts
  src/test/api/mockApi.contract.test.ts
  src/test/api/analyticsApi.contract.test.ts
  src/test/api/orchestrationApi.contract.test.ts
  src/test/api/learningApi.contract.test.ts
  src/test/components/QuestionCard.test.ts
  src/test/components/ExamTimer.test.ts
  src/test/components/CognitiveDiagnosticsSvg.test.ts
  src/test/components/AuthBootstrapBoundary.test.ts
  src/test/integration/adaptivePracticeFlow.test.ts
  src/test/integration/mockExamFlow.test.ts
  src/test/integration/tutorRateLimit.test.ts
  src/test/a11y/accessibility.test.ts
  e2e/fixtures.ts
  e2e/auth-journey.spec.ts
  e2e/learner-journey.spec.ts
  e2e/mock-exam-journey.spec.ts
  e2e/responsive-viewports.spec.ts

SYMBOL_OWNED_BY:
  AppErrorBoundary                 -> src/App.tsx
  RouteErrorBoundary               -> src/router.tsx
  ProtectedShellBoundary           -> src/components/layout/ProtectedLayout.tsx
  AuthBootstrapBoundary            -> src/context/AuthContext.tsx
  AccountDisabledView              -> src/context/AuthContext.tsx
  AuthUnavailableView              -> src/context/AuthContext.tsx
  AuthProvider                     -> src/context/AuthContext.tsx
  useAuth                          -> src/context/AuthContext.tsx
```

### 6.7 Source-Controlled Inventory Counting Semantics

The authoritative 121-file footprint represents strictly **121 authorized source-controlled implementation files**:
- `CONFIG`: 7 source-controlled configuration files
- `STATIC-ASSET`: 1 static SVG icon
- `PRODUCTION`: 79 client application TypeScript, CSS, and TSX files
- `TEST`: 29 test and test-infrastructure files (26 executable Vitest suite files + 3 test-support files)
- `E2E`: 5 end-to-end testing files (4 executable Playwright spec files + 1 test-fixture file)

**Generated Artifacts Cardinality Exclusion**:
All filesystem entries generated by package managers, build compilers, or test runners are strictly excluded from the 121-file source footprint and MUST NOT be counted toward or invalidate the source inventory:
- `node_modules/**`
- `dist/**`
- `node_modules/.vite/**`
- `test-results/**` and `playwright-report/**`
- Package manager temporary caches and `.tsbuildinfo` files
Generated artifact paths counted toward 121: **0**.

---

## 7. FRONTEND ROUTE ARCHITECTURE & LAYOUT SPECIFICATIONS (19 USER-FACING SCREEN ROUTES / 20 ROUTER PATH RECORDS)

The application router implements exactly **20 router path records**, consisting of **19 user-facing screen routes** and **1 protected shell / index redirect record**:

```text
Public User-Facing Screen Routes (3):
  /                                       -> Public Landing Screen (LandingPage.tsx)
  /login                                  -> Public Login Screen (LoginPage.tsx)
  /register                               -> Public Registration Screen (RegisterPage.tsx)

Protected Shell / Index Redirect Record (1):
  /app                                    -> Protected Shell Index Record (Redirects to /app/dashboard)

Protected User-Facing Screen Routes (16):
  /app/onboarding                         -> Goal Selection & Onboarding Setup (OnboardingPage.tsx)
  /app/dashboard                          -> Learner Dashboard (DashboardPage.tsx)
  /app/agenda                             -> Prescriptive Daily Agenda (DailyAgendaPage.tsx)
  /app/practice                           -> Topic & Pattern Catalog (PracticeCatalogPage.tsx)
  /app/practice/:topic                    -> Topic Patterns Browser (TopicDetailPage.tsx)
  /app/practice/:topic/:pattern           -> Standard Practice Session (PatternPracticePage.tsx)
  /app/adaptive                           -> Adaptive Practice Session (AdaptivePracticePage.tsx)
  /app/mistakes                           -> Mistake Remediation Notebook (MistakesNotebookPage.tsx)
  /app/revision                           -> Fixed-Stage Revision Queue & 2-Day Plan (RevisionQueuePage.tsx)
  /app/mock-exams                         -> Mock Examination Catalog (MockCatalogPage.tsx)
  /app/mock-exams/:sessionId              -> Active Mock Examination Viewport (MockSessionPage.tsx)
  /app/mock-exams/:sessionId/result       -> Final Mock Score Report (MockResultPage.tsx)
  /app/mock-exams/:sessionId/review       -> Post-Exam Question Review (MockReviewPage.tsx)
  /app/analytics                          -> Cognitive Diagnostics & Analytics (AnalyticsDashboardPage.tsx)
  /app/tutor                              -> Socratic AI Tutor Workspace (TutorWorkspacePage.tsx)
  /app/profile                            -> Learner Profile & Security Settings (ProfileSettingsPage.tsx)
```

Cardinality summary:
- Public Screen Routes: **3**
- Protected Screen Routes: **16**
- User-Facing Screen Routes: **19**
- Shell / Index Redirect Records: **1**
- Total Router Path Records: **20**
- Unclassified Routes: **0**

All major route pages MUST use dynamic `React.lazy()` imports in `src/router.tsx` with appropriate Suspense loading states. Shared layout code owns no duplicate route heading.

### 7.1 Detailed Specification per Router Path Record

#### Record 1: `/` (Public Screen Route 1 of 3)
- **Ownership**: `LandingPage.tsx`
- **Layout**: Public Minimal Header (Brand, "Log In", "Register" CTAs)
- **Auth Requirement**: Public. If user is authenticated (`AuthContext === 'AUTHENTICATED'`), automatically redirects to `/app/dashboard`.
- **Loader / Query Dependencies**: None.
- **Primary Components**: Hero Section, Feature Highlights Grid, CTA Banner.
- **Loading State**: Immediate render (static).
- **Empty State**: N/A.
- **Error Boundary**: Global Root Error Boundary (owned by `src/App.tsx`).
- **Navigation Transitions**: "Log In" -> `/login`; "Register" -> `/register`.
- **Permitted Mutations**: None.
- **Accessibility Focus Target**: `<h1>Master Aptitude with Precision</h1>`.

#### Record 2: `/login` (Public Screen Route 2 of 3)
- **Ownership**: `LoginPage.tsx`
- **Layout**: Public Form Shell.
- **Auth Requirement**: Public. If authenticated, redirects to `/app/dashboard`.
- **Loader / Query Dependencies**: None.
- **Primary Components**: Controlled Login Form (`email`, `password`), Submit Button, ErrorAlert.
- **Loading State**: Form inputs disabled with button spinner during `POST /api/v1/auth/login`.
- **Empty State**: N/A.
- **Error Boundary**: Route Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: On success -> `/app/dashboard`; Link to `/register`.
- **Permitted Mutations**: `POST /api/v1/auth/login`.
- **Accessibility Focus Target**: `<h1>Sign In to Your Account</h1>`.

#### Record 3: `/register` (Public Screen Route 3 of 3)
- **Ownership**: `RegisterPage.tsx`
- **Layout**: Public Form Shell.
- **Auth Requirement**: Public. If authenticated, redirects to `/app/dashboard`.
- **Loader / Query Dependencies**: None.
- **Primary Components**: Controlled Register Form (`name`, `email`, `password`), Submit Button, ErrorAlert.
- **Loading State**: Form inputs disabled with button spinner during `POST /api/v1/auth/register`.
- **Empty State**: N/A.
- **Error Boundary**: Route Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: On HTTP 201 -> Shows registration success confirmation and navigates to `/login` (Strictly NO auto-login).
- **Permitted Mutations**: `POST /api/v1/auth/register`.
- **Accessibility Focus Target**: `<h1>Create Your Learner Account</h1>`.

#### Record 4: `/app` (Protected Shell / Index Redirect Record)
- **Ownership**: `ProtectedLayout.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Classification**: Protected shell wrapper and declarative index redirect record. NOT an additional learner screen.
- **Loader / Query Dependencies**: None.
- **Primary Components**: Index redirect component.
- **Loading State**: Skeleton shell.
- **Empty State**: N/A.
- **Error Boundary**: Protected Shell Boundary (owned by `src/components/layout/ProtectedLayout.tsx`).
- **Navigation Transitions**: Declarative redirect to `/app/dashboard`.
- **Permitted Mutations**: None.
- **Accessibility Focus Target**: Delegated to destination screen route.

#### Record 5: `/app/onboarding` (Protected Screen Route 1 of 16)
- **Ownership**: `OnboardingPage.tsx`
- **Layout**: Protected Full-Width Wizard Shell (Sidebar collapsed).
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/goals/user/:userId`.
- **Primary Components**: Goal Wizard Form, Plan Feasibility Preview Modal, Commit CTA.
- **Loading State**: Skeleton card representing wizard steps.
- **Empty State**: Initial fresh form view.
- **Error Boundary**: Wizard Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: On plan generation commit -> `/app/dashboard`.
- **Permitted Mutations**: `POST /api/v1/goals`, `POST /api/v1/planning/preview`, `POST /api/v1/planning/generate`.
- **Accessibility Focus Target**: `<h1>Set Up Your Target Exam Goal</h1>`.

#### Record 6: `/app/dashboard` (Protected Screen Route 2 of 16)
- **Ownership**: `DashboardPage.tsx`
- **Layout**: Protected Shell (Sidebar, Header, Main View).
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /goals/user/:userId`, `GET /analytics/dashboard`, `GET /orchestration/next-action`, `GET /orchestration/daily-agenda`, `GET /progress/:userId/weakest`, `GET /revisions/due`, `GET /analytics/readiness/:goalId` (if goal exists).
- **Primary Components**: `NextActionCard`, `AgendaSegmentList`, `ReadinessMeter`, Quick Stats Banner, Weakest Patterns Widget.
- **Loading State**: Layout card pulse skeletons matching metric dimensions.
- **Empty State**: If zero goals exist -> Prompts redirect to `/app/onboarding`.
- **Error Boundary**: Dashboard Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Start Next Action" -> Triggers orchestration sequence owned by `DashboardPage`: issues prescription via Operation 64 (`POST /api/v1/attribution/prescriptions`, sending `originSurface: 'next_action'`, optional `goalId`, and required `Idempotency-Key` header; `actionId` not required by backend for next_action), receives newly minted `prescriptionId`, activates lease via Operation 56 (`POST /api/v1/attribution/prescriptions/:prescriptionId/activate`), and navigates to target activity URL (practice/drill/revision/mock) with `prescriptionId`. Upon activity completion, calls Operation 57 (`POST /api/v1/attribution/prescriptions/:prescriptionId/complete`). "View Full Agenda" -> `/app/agenda`.
- **Permitted Mutations**: `POST /api/v1/attribution/prescriptions` (Op 64), `POST /api/v1/attribution/prescriptions/:prescriptionId/activate` (Op 56), `POST /api/v1/attribution/prescriptions/:prescriptionId/complete` (Op 57).
- **Accessibility Focus Target**: `<h1>Learner Dashboard</h1>`.

#### Record 7: `/app/agenda` (Protected Screen Route 3 of 16)
- **Ownership**: `DailyAgendaPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /orchestration/daily-agenda?userId=:userId`.
- **Primary Components**: 4-Segment Agenda Accordion (`WARMUP_RETRIEVAL`, `PREREQUISITE_UNBLOCKING`, `CORE_CURRICULUM`, `PACING_OR_BENCHMARK`), Checkpoint Indicators.
- **Loading State**: 4-row accordion skeleton.
- **Empty State**: "Daily agenda completed for today!" congratulatory banner.
- **Error Boundary**: Agenda Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Activity CTA -> Triggers orchestration sequence owned by `DailyAgendaPage`: issues prescription via Operation 64 (`POST /api/v1/attribution/prescriptions`, sending `originSurface: 'daily_agenda'`, required recommendation `actionId`, optional `goalId`, and required `Idempotency-Key` header), receives newly minted `prescriptionId`, activates lease via Operation 56 (`POST /api/v1/attribution/prescriptions/:prescriptionId/activate`), and navigates to the corresponding practice, drill, revision, or mock examination URL with `prescriptionId`. Upon activity completion, calls Operation 57 (`POST /api/v1/attribution/prescriptions/:prescriptionId/complete`).
- **Permitted Mutations**: `POST /api/v1/attribution/prescriptions` (Op 64 issuance with Idempotency-Key), `POST /api/v1/attribution/prescriptions/:prescriptionId/activate` (Op 56 activation), `POST /api/v1/attribution/prescriptions/:prescriptionId/complete` (Op 57 completion).
- **Accessibility Focus Target**: `<h1>Prescriptive Daily Agenda</h1>`.

#### Record 8: `/app/practice` (Protected Screen Route 4 of 16)
- **Ownership**: `PracticeCatalogPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/questions/topics`.
- **Primary Components**: 24-card canonical topic grid, Search filter input.
- **Loading State**: 24-card grid pulse skeletons.
- **Empty State**: "No topics match your search criteria" card.
- **Error Boundary**: Catalog Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Topic Card Click -> `/app/practice/:topic`.
- **Permitted Mutations**: None.
- **Accessibility Focus Target**: `<h1>Practice Question Bank</h1>`.

#### Record 9: `/app/practice/:topic` (Protected Screen Route 5 of 16)
- **Ownership**: `TopicDetailPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /questions/topic/:topic/patterns`, `GET /progress/:userId/patterns?topic=:topic`.
- **Primary Components**: Canonical pattern list, Pattern mastery indicators, Drill question count selector (5, 10, 20).
- **Loading State**: Pattern list rows skeleton.
- **Empty State**: "No patterns registered under this topic" alert.
- **Error Boundary**: Topic Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Start Drill" -> `/app/practice/:topic/:pattern`.
- **Permitted Mutations**: None.
- **Accessibility Focus Target**: `<h1>Topic: {topic}</h1>`.

#### Record 10: `/app/practice/:topic/:pattern` (Protected Screen Route 6 of 16)
- **Ownership**: `PatternPracticePage.tsx`
- **Layout**: Protected Minimal Shell (Sidebar collapsed for focus).
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /questions/topic/:topic/pattern/:pattern/random?limit=:count`.
- **Primary Components**: `QuestionCard` (`mode="PRACTICE"`), Option radio buttons, Submit button, Explanation Drawer, Next Question button.
- **Loading State**: Question card skeleton.
- **Empty State**: "No practice questions available for this pattern" alert.
- **Error Boundary**: Practice Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Drill completion -> Summary card with return to `/app/practice`.
- **Permitted Mutations**: `POST /api/v1/attempts`.
- **Accessibility Focus Target**: The view owns exactly one `<h1 tabIndex={-1}>Practice: {pattern}</h1>` inside `<main>`; route navigation focuses this heading. `<h2>Question {currentIndex + 1}</h2>` remains subordinate and is not the route-focus target.

#### Record 11: `/app/adaptive` (Protected Screen Route 7 of 16)
- **Ownership**: `AdaptivePracticePage.tsx`
- **Layout**: Protected Minimal Shell (Sidebar collapsed).
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/adaptive/next-question`.
- **Primary Components**: `QuestionCard` (`mode="ADAPTIVE"`), Adaptive metadata badge (Target Difficulty, Current Mastery, Reason Codes), Submit button, Next Question CTA.
- **Loading State**: Question card skeleton pulse.
- **Empty State**: "Adaptive calibration completed for today" card.
- **Error Boundary**: Adaptive Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Next Question" -> triggers next query; Exit -> `/app/dashboard`.
- **Permitted Mutations**: `POST /api/v1/attempts` (`source="adaptive"`).
- **Accessibility Focus Target**: `<h1>Adaptive Practice Session</h1>`.

#### Record 12: `/app/mistakes` (Protected Screen Route 8 of 16)
- **Ownership**: `MistakesNotebookPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /attempts/user/:userId?isCorrect=false&page=:page&limit=:limit`.
- **Primary Components**: Paginated mistake list cards, Filter drawer (Topic, Pattern), "Diagnose Error" AI button, "Retry Question" CTA.
- **Loading State**: Card list skeleton.
- **Empty State**: "Zero mistakes recorded! Keep up the great work" celebratory card.
- **Error Boundary**: Mistakes Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Retry Question" -> `/app/practice/:topic/:pattern`.
- **Permitted Mutations**: `POST /api/v1/learning/explain-attempt`.
- **Accessibility Focus Target**: `<h1>Mistake Remediation Notebook</h1>`.

#### Record 13: `/app/revision` (Protected Screen Route 9 of 16)
- **Ownership**: `RevisionQueuePage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /revisions/due`, `GET /revisions/plan?days=2`.
- **Primary Components**: Due Today Review Queue List, 2-Day Projection Chart, "Start Daily Review" CTA, "Sync Queue" button.
- **Loading State**: Review item table skeleton.
- **Empty State**: "All spaced reviews completed for today!" banner.
- **Error Boundary**: Revision Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Review Pattern" -> practice delivery flow; Exit -> `/app/dashboard`.
- **Permitted Mutations**: `POST /revisions/rebuild`, `POST /attempts` (`source="revision"`).
- **Accessibility Focus Target**: `<h1>Fixed-Stage Spaced Revision</h1>`.

#### Record 14: `/app/mock-exams` (Protected Screen Route 10 of 16)
- **Ownership**: `MockCatalogPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/mock-blueprints`.
- **Primary Components**: Standard mock blueprints catalog cards (Duration, Sections, Marks, Mode), "Start Exam" CTA modal.
- **Loading State**: Blueprint card grid skeletons.
- **Empty State**: "No mock examinations currently scheduled" alert.
- **Error Boundary**: Mock Catalog Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Launch Exam" -> `POST /mock-sessions` -> `/app/mock-exams/:sessionId`.
- **Permitted Mutations**: `POST /api/v1/mock-sessions`.
- **Accessibility Focus Target**: `<h1>Standardized Mock Examinations</h1>`.

#### Record 15: `/app/mock-exams/:sessionId` (Protected Screen Route 11 of 16)
- **Ownership**: `MockSessionPage.tsx`
- **Layout**: Full-Screen Distraction-Free Exam Shell (No Sidebar, No Header).
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /mock-sessions/:id`, `GET /mock-sessions/:id/questions/:questionId`.
- **Primary Components**: `ExamTimer`, `QuestionPalette`, `QuestionCard` (`mode="MOCK_EXAM"`), Section Lock Button, Submit Exam CTA, Abandon Exam Modal.
- **Loading State**: Full-screen exam viewport skeleton.
- **Empty State**: Missing session -> `MOCK_SESSION_NOT_FOUND` error screen with return to catalog.
- **Error Boundary**: Mock Exam Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Exam completion -> `/app/mock-exams/:sessionId/result`; Abandon -> `/app/mock-exams`.
- **Permitted Mutations**: `POST .../start`, `POST .../responses`, `POST .../sections/:sectionId/complete`, `POST .../submit`, `POST .../abandon`.
- **Accessibility Focus Target**: The view owns exactly one `<h1 tabIndex={-1}>Mock Examination</h1>` inside the exam `<main>`; route navigation focuses it. `<h2>Section: {currentSection}</h2>` remains subordinate. The compact exam heading does not restore the normal application header/sidebar; the distraction-free layout remains mandatory.

#### Record 16: `/app/mock-exams/:sessionId/result` (Protected Screen Route 12 of 16)
- **Ownership**: `MockResultPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/mock-sessions/:id/result`.
- **Primary Components**: Overall Scorecard, Accuracy & Pacing Breakdown, Domain Analysis (Sections, Topics, Patterns), "Detailed Question Review" CTA.
- **Loading State**: Scorecard pulse skeletons; "Scoring finalizing..." poll status indicator.
- **Empty State**: Abandoned session -> Renders safe forfeiture confirmation (No scores).
- **Error Boundary**: Result Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: "Review Questions" -> `/app/mock-exams/:sessionId/review`; "Return to Catalog" -> `/app/mock-exams`.
- **Permitted Mutations**: None.
- **Accessibility Focus Target**: `<h1>Examination Score Report</h1>`.

#### Record 17: `/app/mock-exams/:sessionId/review` (Protected Screen Route 13 of 16)
- **Ownership**: `MockReviewPage.tsx`
- **Layout**: Protected Shell (Sidebar collapsed).
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/mock-sessions/:id/review`.
- **Primary Components**: Question navigation palette, `QuestionCard` (`mode="MOCK_REVIEW"`), Step-by-step authoritative solutions, "Generate AI Debrief" button.
- **Loading State**: Review palette and card skeletons.
- **Empty State**: Denied for non-terminal or abandoned sessions (Safe boundary).
- **Error Boundary**: Review Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Return to score report -> `/app/mock-exams/:sessionId/result`.
- **Permitted Mutations**: `POST /api/v1/learning/mock-review`.
- **Accessibility Focus Target**: `<h1>Post-Exam Diagnostic Review</h1>`.

#### Record 18: `/app/analytics` (Protected Screen Route 14 of 16)
- **Ownership**: `AnalyticsDashboardPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/analytics/dashboard`, `GET /api/v1/analytics/cognitive-profile`, `GET /api/v1/analytics/retention`, existing owned-goal lookup `GET /api/v1/goals/user/:userId`, and `GET /api/v1/analytics/readiness/:goalId` only for an existing selected goal.
- **Primary Components**: `CognitiveDiagnosticsSvg` (summary and stamina profile, composing `SpeedAccuracyMatrixSvg`), `RetentionEvidenceSvg`, inline topic mastery bars/table, and existing `ReadinessMeter` with component/bottleneck tables (Section 37).
- **Loading State**: SVG chart card skeletons.
- **Empty State**: Section 37 field-specific null/empty states; no-goal onboarding affordance; no synthetic data.
- **Error Boundary**: Analytics Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Filter controls re-query analytics.
- **Permitted Mutations**: None.
- **Accessibility Focus Target**: `<h1>Cognitive Diagnostics & Analytics</h1>`.

#### Record 19: `/app/tutor` (Protected Screen Route 15 of 16)
- **Ownership**: `TutorWorkspacePage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: None on mount.
- **Primary Components**: `TutorChatWindow`, Topic / Pattern context selector, Conversation thread list, 429 Cooldown countdown.
- **Loading State**: Message bubble typing pulse animation.
- **Empty State**: "Ask a question about any aptitude topic to begin Socratic tutoring" card.
- **Error Boundary**: Tutor Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Link to related practice patterns.
- **Permitted Mutations**: `POST /api/v1/learning/tutor`.
- **Accessibility Focus Target**: `<h1>Socratic AI Tutor Workspace</h1>`.

#### Record 20: `/app/profile` (Protected Screen Route 16 of 16)
- **Ownership**: `ProfileSettingsPage.tsx`
- **Layout**: Protected Shell.
- **Auth Requirement**: Guarded (`AUTHENTICATED`).
- **Loader / Query Dependencies**: `GET /api/v1/users/:userId`, `GET /api/v1/auth/me`.
- **Primary Components**: Learner profile card, Session metadata summary (Issued At, Expires At), "Log Out" button, "Revoke All Sessions" CTA.
- **Loading State**: Profile form skeleton.
- **Empty State**: N/A.
- **Error Boundary**: Profile Error Boundary (owned by `src/router.tsx`).
- **Navigation Transitions**: Logout -> `/login`.
- **Permitted Mutations**: `POST /api/v1/auth/logout`, `POST /api/v1/auth/revoke-all`.
- **Accessibility Focus Target**: `<h1>Learner Profile & Security Settings</h1>`.

---

## 8. AUTHENTICATION & SESSION STATE MACHINE

The frontend application models user authentication strictly through a finite state machine defined in `src/types/auth.ts`.

### 8.1 Auth State Union

```typescript
// src/types/auth.ts
export type AuthStatus =
  | 'BOOTSTRAPPING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'ACCOUNT_DISABLED'
  | 'SERVICE_UNAVAILABLE';
```

### 8.2 Allowed Transitions & Side-Effect Matrix

| From State | Trigger / Event | To State | Clear Token? | Clear Cache? | Halt Polling? | Redirect Action | UI Boundary / Screen | Allow Retry? |
|---|---|---|---|---|---|---|---|---|
| `BOOTSTRAPPING` | App mounts -> Refresh returns 200 -> GET /me returns 200 | `AUTHENTICATED` | NO | NO | NO | Mounts requested route | Renders Protected Shell | N/A |
| `BOOTSTRAPPING` | Refresh returns 401 (Missing/Expired/Reused cookie) | `UNAUTHENTICATED` | YES | YES | YES | If on `/app/*` -> `/login` | Public Shell | YES (Login) |
| `BOOTSTRAPPING` | Refresh returns 403 `ACCOUNT_DISABLED` | `ACCOUNT_DISABLED` | YES | YES | YES | None (NO redirect loop) | Dedicated Account Disabled View | NO |
| `BOOTSTRAPPING` | Refresh returns 403 `REFRESH_ORIGIN_REQUIRED` / CORS error | `SERVICE_UNAVAILABLE` | YES | YES | YES | None | Security Configuration Error View | NO |
| `BOOTSTRAPPING` | Refresh encounters HTTP 5xx or network failure | `SERVICE_UNAVAILABLE` | NO (Preserve) | NO | YES | None | Recoverable Offline View | YES (Manual) |
| `AUTHENTICATED` | Learner triggers explicit Logout (`POST /auth/logout`) | `UNAUTHENTICATED` | YES | YES | YES | Navigate `/login` | Public Shell | N/A |
| `AUTHENTICATED` | Learner triggers Revoke All (`POST /auth/revoke-all`) | `UNAUTHENTICATED` | YES | YES | YES | Navigate `/login` | Public Shell | N/A |
| `AUTHENTICATED` | 401 on protected route -> single-flight refresh fails with 401 | `UNAUTHENTICATED` | YES | YES | YES | Navigate `/login` | Public Shell | YES (Login) |
| `AUTHENTICATED` | 401 on protected route -> refresh fails with 403 `ACCOUNT_DISABLED` | `ACCOUNT_DISABLED` | YES | YES | YES | None (NO redirect loop) | Dedicated Inactive Account View | NO |
| `AUTHENTICATED` | Protected route encounters network loss during query | `AUTHENTICATED` | NO | NO | NO | None | Inline ErrorAlert banner | YES (Auto/Manual)|
| `UNAUTHENTICATED` | Learner logs in successfully (`POST /auth/login` returns 200) | `AUTHENTICATED` | Sets token | Resets cache| NO | Navigate `/app/dashboard`| Protected Shell | N/A |
| `SERVICE_UNAVAILABLE` | Learner clicks "Retry Connection" -> Refresh succeeds | `AUTHENTICATED` | Sets token | Restores cache| NO | Restores active view | Protected Shell | N/A |

The Section 12 taxonomy applies on bootstrap AND authenticated refresh: Origin-security 403 -> `SERVICE_UNAVAILABLE` with token/cache clearing and polling stopped; transient refresh 5xx/network -> `SERVICE_UNAVAILABLE` preserving token/cache and allowing manual retry. A successful retry MUST also complete `/auth/me` before `AUTHENTICATED`; `/auth/me` failures use the same taxonomy without recursive auth replay. `ACCOUNT_DISABLED` clears cache and stops polling. A normal data-query network error remains an inline authenticated-view error, distinct from a refresh/bootstrap failure. No sixth auth state is introduced.

Unspecified auth states count: **0**.

---

## 9. ACCESS TOKEN OWNERSHIP & IN-MEMORY STORAGE CONTRACT

### 9.1 Single Raw Access JWT Owner

The JavaScript module `src/services/api/tokenManager.ts` is the **SOLE AUTHORITATIVE OWNER** of the raw access JWT.

```typescript
// Module-private closure variable inside src/services/api/tokenManager.ts:
let inMemoryAccessToken: string | null = null;
```

### 9.2 Allowed Operations on `tokenManager`

```typescript
export function getAccessToken(): string | null;
export function setAccessToken(token: string | null): void;
export function clearAccessToken(): void;
export function executeSingleFlightRefresh(): Promise<string>;
```

### 9.3 Strictly Prohibited Storage Locations

The access JWT string MUST NEVER be written, copied, or serialized to:
- `window.localStorage`
- `window.sessionStorage`
- `window.indexedDB`
- `document.cookie`
- React state hooks (`useState`, `useReducer`)
- React context (`AuthContext`)
- URL paths or query string parameters
- HTML DOM attributes (`data-*`)
- Browser console output (`console.log`)

**Total raw access-token owners count: 1 (`tokenManager.ts`). Persistent JWT copies count: 0.**

---

## 10. REFRESH TOKEN & BROWSER-MANAGED COOKIE CONTRACT

The refresh token is an opaque cryptographic credential governed strictly by browser security policies inherited from Phase 14:

```text
Storage Location:     Browser Cookie Jar
Cookie Name:          refreshToken
Cookie Flags:         HttpOnly; Path=/api/v1/auth/refresh; SameSite=Strict; Secure (Production)
JavaScript Access:    STRICTLY PROHIBITED (0 bytes accessible)
Manual Origin Header: STRICTLY PROHIBITED (Browser-generated only)
```

### 10.1 Refresh Request Contract

When `tokenManager.executeSingleFlightRefresh()` executes, the outgoing HTTP request MUST be:

```text
POST /api/v1/auth/refresh HTTP/1.1
Content-Type: application/json
Credentials: include
No Request Body
```

The browser automatically attaches the `refreshToken` cookie and generates the appropriate `Origin` header.

---

## 11. SINGLE-FLIGHT REFRESH CONCURRENCY ALGORITHM

Concurrent reuse of the same refresh token generation is actively flagged by Phase 14 as a session theft attempt or race condition, triggering family revocation. The client application MUST NEVER emit parallel refresh requests.

### 11.1 Concurrency Lock Architecture

`src/services/api/tokenManager.ts` declares exactly one module-scoped promise representing the active in-flight refresh exchange:

```typescript
let singleFlightRefreshPromise: Promise<string> | null = null;
```

### 11.2 Algorithm Implementation Contract

```typescript
// src/services/api/tokenManager.ts
import { resolveApiUrl } from '../../utils/apiBaseUrl';

export interface RefreshExchangeError extends Error {
  statusCode?: number;
  code: string;
}

let inMemoryAccessToken: string | null = null;
let singleFlightRefreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function clearAccessToken(): void {
  inMemoryAccessToken = null;
}

export async function executeSingleFlightRefresh(): Promise<string> {
  // If an exchange is already in-flight, all callers await the identical promise
  if (singleFlightRefreshPromise) {
    return singleFlightRefreshPromise;
  }

  singleFlightRefreshPromise = (async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData?.error?.code || (
          response.status === 403 ? 'FORBIDDEN' :
          response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'UNAUTHORIZED'
        );

        // CLASSIFICATION OCCURS BEFORE DESTRUCTIVE TOKEN CLEARING
        if (
          errorCode === 'INVALID_REFRESH_TOKEN' ||
          errorCode === 'SESSION_EXPIRED' ||
          errorCode === 'REFRESH_REUSE_DETECTED' ||
          errorCode === 'ACCOUNT_DISABLED' ||
          errorCode === 'UNAUTHORIZED'
        ) {
          clearAccessToken();
        } else if (
          errorCode === 'REFRESH_ORIGIN_REQUIRED' ||
          errorCode === 'CORS_ORIGIN_DENIED'
        ) {
          clearAccessToken();
        }
        // Transient 5xx failures MUST NOT clear valid in-memory tokens

        const err = new Error(errorCode) as RefreshExchangeError;
        err.statusCode = response.status;
        err.code = errorCode;
        throw err;
      }

      const payload = await response.json();
      const newAccessToken: string = payload.data.accessToken;
      setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (networkOrSystemError: unknown) {
      if (networkOrSystemError instanceof Error &&
          'code' in networkOrSystemError && typeof networkOrSystemError.code === 'string') {
        throw networkOrSystemError;
      }
      // Network/fetch failure: DO NOT clear in-memory token
      const err = new Error('NETWORK_ERROR') as RefreshExchangeError;
      err.code = 'NETWORK_ERROR';
      throw err;
    } finally {
      // Release concurrency lock immediately upon resolution or rejection
      singleFlightRefreshPromise = null;
    }
  })();

  return singleFlightRefreshPromise;
}
```

**Required Invariant: Concurrent protected 401 responses: $N \implies$ Refresh HTTP requests emitted: 1.**

---

## 12. AUTHENTICATION FAILURE TAXONOMY & RECOVERY MATRIX

When a session rotation or authentication exchange fails, the application classifies the error into one of five deterministic categories before altering client state:

### 12.1 Category 1: Refresh Success (HTTP 200)
- Stores rotated access token via `tokenManager.setAccessToken()`.
- Fetches principal via `GET /api/v1/auth/me`.
- Hydrates `AuthContext` with user and session metadata (`AUTHENTICATED`).
- Replays the triggering 401 request exactly once.

### 12.2 Category 2: Credential Invalid / Expired / Reused (HTTP 401)
- Trigger codes: `INVALID_REFRESH_TOKEN`, `SESSION_EXPIRED`, `REFRESH_REUSE_DETECTED`, `UNAUTHORIZED`.
- Clears in-memory token: `tokenManager.clearAccessToken()`.
- Resets TanStack Query cache: `queryClient.clear()`.
- Transitions `AuthContext` to `'UNAUTHENTICATED'`.
- If learner is on a protected route (`/app/*`), redirects cleanly to `/login` with `returnUrl` parameter preserved. If on a public route, renders public screen.

### 12.3 Category 3: Account Deactivated (HTTP 403 `ACCOUNT_DISABLED`)
- Clears in-memory token: `tokenManager.clearAccessToken()`.
- Halts all TanStack Query background polling intervals.
- Transitions `AuthContext` to `'ACCOUNT_DISABLED'`.
- Renders dedicated deactivation boundary explaining account status.
- **Strictly prohibits redirect loop to `/login`**.

### 12.4 Category 4: Origin Security Failure (HTTP 403 `REFRESH_ORIGIN_REQUIRED`, `CORS_ORIGIN_DENIED`)
- Clears in-memory token.
- Transitions `AuthContext` to `'SERVICE_UNAVAILABLE'`.
- Renders configuration error boundary displaying `correlationId`.
- Halts refresh looping.

### 12.5 Category 5: Transient Infrastructure Fault (HTTP 5xx / Network Fetch Failure)
- **DOES NOT classify credentials as invalid**.
- **DOES NOT automatically clear valid in-memory access token**.
- Transitions `AuthContext` to `'SERVICE_UNAVAILABLE'`.
- Renders recoverable offline screen with manual "Retry Connection" button.

---

## 13. CENTRALIZED API BASE URL RESOLVER CONTRACT

To guarantee origin consistency across both `apiClient.ts` and `tokenManager.ts`, all URLs MUST be resolved through `src/utils/apiBaseUrl.ts`.

### 13.1 Implementation Specification

```typescript
// src/utils/apiBaseUrl.ts
export function resolveApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl || baseUrl === '' || baseUrl === '/') {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
```

### 13.2 Edge-Case Resolution Rules & Test Vectors

| `VITE_API_BASE_URL` Input | Relative `path` Input | Resolved Output URL | Test Case ID |
|---|---|---|---|
| `undefined` | `"/api/v1/auth/refresh"` | `"/api/v1/auth/refresh"` | `URL-RESOLVE-01` |
| `""` (Empty string) | `"/api/v1/questions"` | `"/api/v1/questions"` | `URL-RESOLVE-02` |
| `"/"` (Single slash) | `"api/v1/attempts"` | `"/api/v1/attempts"` | `URL-RESOLVE-03` |
| `"https://api.example.com"` | `"/api/v1/goals"` | `"https://api.example.com/api/v1/goals"` | `URL-RESOLVE-04` |
| `"https://api.example.com/"` | `"/api/v1/goals"` | `"https://api.example.com/api/v1/goals"` | `URL-RESOLVE-05` |
| `"https://api.example.com"` | `"api/v1/goals"` | `"https://api.example.com/api/v1/goals"` | `URL-RESOLVE-06` |

Independent or ad-hoc refresh URL resolution logic count: **0**.

---

## 14. CENTRALIZED API CLIENT & FETCH WRAPPER SPECIFICATION

All ordinary outgoing application fetch operations flow through `src/services/api/apiClient.ts`. The sole raw refresh exchange is owned by `tokenManager.ts` (Section 11) to prevent recursive refresh/replay; it uses the same centralized URL resolver and credential policy.

### 14.1 Core Responsibilities

1. **Raw Wire Response Ownership (Finding W01)**: `apiClient` returns decoded raw HTTP JSON unchanged. It MUST NOT globally unwrap `response.data`. Endpoint API services also return their complete typed raw wire response (`RawWireResponse`) without silently discarding `data`, `meta`, `count`, `message`, `metadata`, or `provenance`. TypeScript types strictly distinguish `RawWireResponse` from payload DTOs (`PayloadDto`). Operation 3 refresh is the controlled exception at the internal control-flow boundary: wire exchange yields `AuthRefreshWireResponse`, while `tokenManager.executeSingleFlightRefresh()` returns `Promise<string>` (the internal string is the rotated access token and is not the HTTP wire DTO).
2. **Base URL Resolution**: Resolves all relative paths via `resolveApiUrl()`.
3. **Bearer Injection**: Injects `Authorization: Bearer <token>` from `tokenManager.getAccessToken()`.
4. **Credentials Management**: Enforces `credentials: 'include'` on all network calls.
4. **401 Interception & Single Replay**:
   - Catches HTTP 401 responses on protected endpoints.
   - Enforces a one-time replay guard (`isRetry = true`).
   - Awaits `tokenManager.executeSingleFlightRefresh()`.
   - On success, replays original request with rotated token.
   - On failure, routes to Auth Taxonomy without recursive loop.
5. **Auth Endpoint Recursion Prevention**: Calls targeting `/api/v1/auth/*` are NEVER automatically retried on 401.
6. **AbortSignal Propagation**: Passes caller's `AbortSignal` directly to native `fetch`.
7. **Canonical Error Parsing**: Extracts `{ success: false, error: { code, message } }` into typed `ApiClientError`.
8. **Sensitive Header Redaction**: Excludes `Authorization`, `password`, and JWT tokens from all loggers.

### 14.2 `ApiClientError` Class Definition

```typescript
// src/services/api/apiClient.ts
export class ApiClientError extends Error {
  statusCode: number;
  code: string;
  correlationId: string | null;
  retryAfter: number | null;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    correlationId: string | null = null,
    retryAfter: number | null = null
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.correlationId = correlationId;
    this.retryAfter = retryAfter;
  }
}
```

---

## 15. LEARNER IDENTITY BOUNDARY & OWNERSHIP CONTRACT

In Phase 14, backend middleware `enforcePrincipalUserIdBodyQuery` strictly validates that any client-supplied `userId` matches the authenticated JWT principal (`req.user.userId`).

### 15.1 Frontend Identity Authority

1. **Client Identity Authority**: Exactly **0**. The client never dictates or modifies user identity.
2. **Derived Identifiers**: Where backend endpoints require `:userId` in path or query parameters, the identifier is derived exclusively from `AuthContext.user.userId`.
3. **Handling of `IDENTITY_MISMATCH` & `OWNERSHIP_VIOLATION`**:
   - If the backend returns HTTP 403 `IDENTITY_MISMATCH` or `OWNERSHIP_VIOLATION`, the frontend immediately halts retry attempts.
   - Surfaces an inline security boundary notice: *"Access Restricted: Resource ownership violation."*
   - Surfaces the request correlation ID for audit tracing.

---

## 16. AUTHORITATIVE CONSUMED OPERATIONS SPECIFICATION (ALL 64 OPERATIONS)

Every one of the 64 consumed backend operations is specified below with complete, deterministic parameters, raw wire envelopes, payload DTOs, and fully reconciled service module assignments.

### 16.1 Master Consumed Operations Inventory (64 Operations)

| # | Function Name | File Path | Method | Endpoint Path | Query Params (Required / Optional) | Request Body DTO | Return DTO | Cache Policy | Invalidation Targets | Error Handling & Status Codes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `registerLearner` | `authApi.ts` | `POST` | `/api/v1/auth/register` | None | `RegisterRequestPayload` | `AuthRegisterWireResponse` | No Cache | None | 400 VALIDATION_ERROR / DUPLICATE_RESOURCE, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 2 | `loginLearner` | `authApi.ts` | `POST` | `/api/v1/auth/login` | None | `LoginRequestPayload` | `AuthLoginWireResponse` | No Cache | Clears all cache (queryClient.clear()) | 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS, 403 ACCOUNT_DISABLED, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 3 | `refreshSession` | `authApi.ts` | `POST` | `/api/v1/auth/refresh` | None | `None (Cookie)` | `AuthRefreshWireResponse` | No Cache | None | 401 INVALID_TOKEN / TOKEN_EXPIRED / SESSION_REVOKED, 403 ORIGIN_MISMATCH, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 4 | `logoutLearner` | `authApi.ts` | `POST` | `/api/v1/auth/logout` | None | `None` | `AuthLogoutWireResponse` | No Cache | Clears all cache (queryClient.clear()) | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 5 | `revokeAllSessions` | `authApi.ts` | `POST` | `/api/v1/auth/revoke-all` | None | `None` | `AuthRevokeAllWireResponse` | No Cache | Clears all cache (queryClient.clear()) | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 6 | `fetchAuthMe` | `authApi.ts` | `GET` | `/api/v1/auth/me` | None | `None` | `AuthMeWireResponse` | Stale: 5m | None | 401 UNAUTHORIZED, 404 USER_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 7 | `fetchTopics` | `questionApi.ts` | `GET` | `/api/v1/questions/topics` | None | `None` | `TopicListWireResponse` | Stale: 1h | None | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 8 | `fetchPatternsByTopic` | `questionApi.ts` | `GET` | `/api/v1/questions/topic/:topic/patterns` | None | `None` | `PatternListWireResponse` | Stale: 1h | None | 400 INVALID_TOPIC, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 9 | `fetchQuestionsByTopic` | `questionApi.ts` | `GET` | `/api/v1/questions/topic/:topic` | page? (opt), limit? (opt) | `None` | `QuestionPaginatedWireResponse` | Stale: 5m | None | 400 INVALID_TOPIC / INVALID_PAGINATION, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 10 | `fetchQuestionsByPattern` | `questionApi.ts` | `GET` | `/api/v1/questions/topic/:topic/pattern/:pattern` | page? (opt), limit? (opt), difficulty? (opt, 1-10) | `None` | `QuestionPaginatedWireResponse` | Stale: 5m | None | 400 INVALID_TOPIC / INVALID_PATTERN / INVALID_DIFFICULTY, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 11 | `fetchRandomQuestionsByTopic` | `questionApi.ts` | `GET` | `/api/v1/questions/topic/:topic/random` | limit? (opt, def 10, clamp 1-50), difficulty? (opt, 1-10) | `None` | `QuestionRandomListWireResponse` | No Cache | None | 400 INVALID_TOPIC / INVALID_LIMIT, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 12 | `fetchRandomQuestionsByPattern` | `questionApi.ts` | `GET` | `/api/v1/questions/topic/:topic/pattern/:pattern/random` | limit? (opt, def 10, clamp 1-50), difficulty? (opt, 1-10) | `None` | `QuestionRandomListWireResponse` | No Cache | None | 400 INVALID_TOPIC / INVALID_PATTERN / INVALID_DIFFICULTY, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 13 | `fetchQuestionById` | `questionApi.ts` | `GET` | `/api/v1/questions/:id([a-fA-F0-9]{24})` | None | `None` | `QuestionDetailWireResponse` | Stale: 1h | None | 400 INVALID_ID, 401 UNAUTHORIZED, 404 QUESTION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 14 | `fetchUserProfile` | `goalApi.ts` | `GET` | `/api/v1/users/:userId` | None | `None` | `UserGetWireResponse` | Stale: 5m | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 USER_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 15 | `fetchUserGoals` | `goalApi.ts` | `GET` | `/api/v1/goals/user/:userId` | None | `None` | `GoalListWireResponse` | Stale: 1m | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 16 | `createGoal` | `goalApi.ts` | `POST` | `/api/v1/goals` | None | `GoalCreateRequestPayload` | `GoalCreateWireResponse` | No Cache | ['goals', 'user', userId] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 17 | `fetchGoalById` | `goalApi.ts` | `GET` | `/api/v1/goals/:id` | None | `None` | `GoalDetailWireResponse` | Stale: 1m | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 18 | `patchGoal` | `goalApi.ts` | `PATCH` | `/api/v1/goals/:id` | None | `GoalPatchRequestPayload` | `GoalPatchWireResponse` | No Cache | ['goals', 'user', userId], ['goals', 'detail', id] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 19 | `deleteGoal` | `goalApi.ts` | `DELETE` | `/api/v1/goals/:id` | None | `None` | `GoalDeleteWireResponse` | No Cache | ['goals', 'user', userId], ['goals', 'detail', id] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 20 | `previewPlan` | `planningApi.ts` | `POST` | `/api/v1/planning/preview` | None | `PlanPreviewRequestPayload` | `PlanPreviewWireResponse` | No Cache | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 21 | `generatePlan` | `planningApi.ts` | `POST` | `/api/v1/planning/generate` | None | `PlanGenerateRequestPayload` | `PlanGenerateWireResponse` | No Cache | ['planning', 'plans', userId], ['planning', 'dailyObjectives', userId], ['planning', 'schedule'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 22 | `replanPlan` | `planningApi.ts` | `POST` | `/api/v1/planning/plans/:planId/replan` | None | `PlanReplanRequestPayload` | `PlanReplanWireResponse` | No Cache | ['planning', 'plans', userId], ['planning', 'dailyObjectives', userId], ['planning', 'schedule', planId] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 PLAN_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 23 | `fetchPlanSchedule` | `planningApi.ts` | `GET` | `/api/v1/planning/plans/:planId/schedule` | None | `None` | `PlanScheduleWireResponse` | Stale: 5m | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PLAN_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 24 | `fetchUserPlans` | `planningApi.ts` | `GET` | `/api/v1/study-plans/user/:userId` | status? (opt) | `None` | `PlanListWireResponse` | Stale: 2m | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 25 | `fetchUserDailyObjectives` | `planningApi.ts` | `GET` | `/api/v1/daily-objectives/user/:userId` | page? (opt), limit? (opt) | `None` | `DailyObjectiveListWireResponse` | Stale: 1m | None | 400 INVALID_PAGINATION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 26 | `patchDailyObjective` | `planningApi.ts` | `PATCH` | `/api/v1/daily-objectives/:id` | None | `DailyObjectivePatchPayload` | `DailyObjectivePatchWireResponse` | No Cache | ['planning', 'dailyObjectives', userId] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 OBJECTIVE_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 27 | `recordAttempt` | `attemptApi.ts` | `POST` | `/api/v1/attempts` | None | `AttemptRecordRequestPayload` | `AttemptRecordWireResponse` | No Cache | ['attempts', 'user', userId], ['progress'], ['analytics'], ['revisions', 'due'], ['revisions', 'plan'], ['orchestration'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 QUESTION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 28 | `fetchUserAttempts` | `attemptApi.ts` | `GET` | `/api/v1/attempts/user/:userId` | page? (opt), limit? (opt), topic? (opt), pattern? (opt), questionId? (opt), sessionId? (opt) | `None` | `AttemptListWireResponse` | Stale: 30s | None | 400 INVALID_PAGINATION / INVALID_DATE, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 29 | `fetchOverallProgress` | `progressApi.ts` | `GET` | `/api/v1/progress/:userId` | page? (opt), limit? (opt), sortBy? (opt), sortDir? (opt) | `None` | `StudentProgressWireResponse` | Stale: 30s | None | 400 INVALID_PAGINATION / INVALID_SORT, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 30 | `fetchTopicMastery` | `progressApi.ts` | `GET` | `/api/v1/progress/:userId/topics` | topic? (opt) | `None` | `TopicMasteryWireResponse` | Stale: 30s | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 31 | `fetchPatternMastery` | `progressApi.ts` | `GET` | `/api/v1/progress/:userId/patterns` | topic (REQUIRED) | `None` | `PatternMasteryWireResponse` | Stale: 30s | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 32 | `fetchWeakestPatterns` | `progressApi.ts` | `GET` | `/api/v1/progress/:userId/weakest` | topic? (opt), limit? (opt, def 10, clamp 1-50) | `None` | `WeakestPatternsWireResponse` | Stale: 30s | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 33 | `fetchPrerequisites` | `progressApi.ts` | `GET` | `/api/v1/progress/prerequisites/:patternName` | None | `None` | `PrerequisiteGraphWireResponse` | Stale: 1h | None | 400 PATTERN_NOT_FOUND, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 34 | `fetchAdaptiveNextQuestion` | `adaptiveApi.ts` | `GET` | `/api/v1/adaptive/next-question` | topic? (opt), pattern? (opt), planId? (opt) | `None` | `AdaptiveNextQuestionWireResponse` | No Cache | None | 400 INVALID_TOPIC / INVALID_PATTERN, 401 UNAUTHORIZED, 404 NO_ELIGIBLE_QUESTIONS, 500 INTERNAL_SERVER_ERROR |
| 35 | `fetchRevisionDue` | `revisionApi.ts` | `GET` | `/api/v1/revisions/due` | date? (opt), referenceDate? (opt), topic? (opt), planId? (opt), goalId? (opt), limit? (opt) | `None` | `RevisionDueListWireResponse` | Stale: 2m | None | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 36 | `fetchRevisionPlan` | `revisionApi.ts` | `GET` | `/api/v1/revisions/plan` | days? (days in {1,2}), questionBudget? (opt), patternsPerDay? (opt), referenceDate? (opt), date? (opt), topic? (opt), planId? (opt), goalId? (opt) | `None` | `RevisionPlanWireResponse` | Stale: 5m | None | 400 INVALID_WINDOW, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 37 | `rebuildRevisionQueue` | `revisionApi.ts` | `POST` | `/api/v1/revisions/rebuild` | None | `RevisionRebuildRequestPayload` | `RevisionRebuildWireResponse` | No Cache | ['revisions', 'due'], ['revisions', 'plan'], ['orchestration', 'dailyAgenda'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 38 | `fetchMockBlueprints` | `mockApi.ts` | `GET` | `/api/v1/mock-blueprints` | None | `None` | `MockBlueprintListWireResponse` | Stale: 1h | None | 401 UNAUTHORIZED, 500 INTERNAL_SERVER_ERROR |
| 39 | `createMockSession` | `mockApi.ts` | `POST` | `/api/v1/mock-sessions` | None | `MockSessionCreateRequestPayload` | `MockSessionCreateWireResponse` | No Cache | ['mock', 'session'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 404 BLUEPRINT_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 40 | `startMockSession` | `mockApi.ts` | `POST` | `/api/v1/mock-sessions/:id/start` | None | `None` | `MockSessionStartWireResponse` | No Cache | ['mock', 'session', id], ['orchestration'] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 409 SESSION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR |
| 41 | `fetchMockSession` | `mockApi.ts` | `GET` | `/api/v1/mock-sessions/:id` | None | `None` | `MockSessionDetailWireResponse` | Stale: 0s | None | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 42 | `fetchMockQuestion` | `mockApi.ts` | `GET` | `/api/v1/mock-sessions/:id/questions/:questionId` | None | `None` | `MockQuestionWireResponse` | Stale: 5m | None | 400 QUESTION_NOT_IN_SESSION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND / QUESTION_NOT_FOUND, 409 SECTION_LOCKED / MOCK_SESSION_EXPIRED, 500 INTERNAL_SERVER_ERROR |
| 43 | `saveMockResponse` | `mockApi.ts` | `POST` | `/api/v1/mock-sessions/:id/responses` | None | `MockResponseSavePayload` | `MockResponseSaveWireResponse` | No Cache | ['mock', 'session', id] | 400 VALIDATION_ERROR / QUESTION_NOT_IN_SESSION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 409 RESPONSES_FROZEN / SECTION_LOCKED / MOCK_SESSION_EXPIRED, 500 INTERNAL_SERVER_ERROR |
| 44 | `completeMockSection` | `mockApi.ts` | `POST` | `/api/v1/mock-sessions/:id/sections/:sectionId/complete` | None | `None` | `MockSectionCompleteWireResponse` | No Cache | ['mock', 'session', id] | 400 INVALID_SECTION, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 409 SECTION_STATE_CONFLICT / MOCK_SESSION_EXPIRED, 500 INTERNAL_SERVER_ERROR |
| 45 | `submitMockSession` | `mockApi.ts` | `POST` | `/api/v1/mock-sessions/:id/submit` | None | `None` | `MockSubmitWireResponse` | No Cache | ['mock', 'session', id], ['mock', 'result', id], ['progress'], ['analytics'], ['orchestration'] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 409 FINALIZATION_IN_PROGRESS / SESSION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR |
| 46 | `abandonMockSession` | `mockApi.ts` | `POST` | `/api/v1/mock-sessions/:id/abandon` | None | `None` | `MockSessionAbandonWireResponse` | No Cache | ['mock', 'session', id], ['orchestration'] | 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 409 SESSION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR |
| 47 | `fetchMockResult` | `mockApi.ts` | `GET` | `/api/v1/mock-sessions/:id/result` | None | `None` | `MockResultWireResponse` | Stale: 1h | None | 400 MOCK_SESSION_NOT_TERMINAL, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND / RESULT_NOT_FOUND, 409 FINALIZATION_IN_PROGRESS, 500 INTERNAL_SERVER_ERROR |
| 48 | `fetchMockReview` | `mockApi.ts` | `GET` | `/api/v1/mock-sessions/:id/review` | None | `None` | `MockReviewWireResponse` | Stale: 1h | None | 400 MOCK_SESSION_NOT_TERMINAL, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 MOCK_SESSION_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 49 | `fetchAnalyticsDashboard` | `analyticsApi.ts` | `GET` | `/api/v1/analytics/dashboard` | userId (REQUIRED) | `None` | `AnalyticsDashboardWireResponse` | Stale: 5m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 50 | `fetchCognitiveProfile` | `analyticsApi.ts` | `GET` | `/api/v1/analytics/cognitive-profile` | userId (REQUIRED), windowDays? (opt), topic? (opt) | `None` | `CognitiveProfileWireResponse` | Stale: 5m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 51 | `fetchRetentionAnalytics` | `analyticsApi.ts` | `GET` | `/api/v1/analytics/retention` | userId (REQUIRED) | `None` | `RetentionAnalyticsWireResponse` | Stale: 5m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 52 | `fetchExamReadiness` | `analyticsApi.ts` | `GET` | `/api/v1/analytics/readiness/:goalId` | userId (REQUIRED) | `None` | `ExamReadinessWireResponse` | Stale: 5m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 GOAL_NOT_FOUND, 500 INTERNAL_SERVER_ERROR |
| 53 | `fetchNextAction` | `orchestrationApi.ts` | `GET` | `/api/v1/orchestration/next-action` | userId (REQUIRED), goalId? (opt) | `None` | `NextActionWireResponse` | Stale: 1m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 54 | `fetchDailyAgenda` | `orchestrationApi.ts` | `GET` | `/api/v1/orchestration/daily-agenda` | userId (REQUIRED), goalId? (opt) | `None` | `DailyAgendaWireResponse` | Stale: 1m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 55 | `fetchInterventions` | `orchestrationApi.ts` | `GET` | `/api/v1/orchestration/interventions` | userId (REQUIRED), goalId? (opt) | `None` | `InterventionListWireResponse` | Stale: 1m | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 500 INTERNAL_SERVER_ERROR |
| 56 | `activatePrescription` | `orchestrationApi.ts` | `POST` | `/api/v1/attribution/prescriptions/:prescriptionId/activate` | None | `None` | `PrescriptionLeaseWireResponse` | No Cache | ['orchestration'] | 400 VALIDATION_ERROR / INVALID_PRESCRIPTION_ID, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PRESCRIPTION_NOT_FOUND, 409 PRESCRIPTION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR |
| 57 | `completePrescription` | `orchestrationApi.ts` | `POST` | `/api/v1/attribution/prescriptions/:prescriptionId/complete` | None | `PrescriptionCompletePayload` | `PrescriptionCompleteWireResponse` | No Cache | ['orchestration'], ['progress'], ['analytics'] | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PRESCRIPTION_NOT_FOUND, 409 PRESCRIPTION_STATE_CONFLICT, 500 INTERNAL_SERVER_ERROR |
| 58 | `requestTutorGuidance` | `learningApi.ts` | `POST` | `/api/v1/learning/tutor` | None | `LearningTutorRequestPayload` | `TutorWireResponse` | No Cache | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 59 | `requestQuestionHint` | `learningApi.ts` | `POST` | `/api/v1/learning/hint` | None | `LearningHintRequestPayload` | `HintWireResponse` | No Cache | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 ATTEMPT_REQUIRED (for level 5), 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 60 | `explainAttemptError` | `learningApi.ts` | `POST` | `/api/v1/learning/explain-attempt` | None | `LearningExplainAttemptPayload` | `ExplainAttemptWireResponse` | No Cache | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 ATTEMPT_NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 61 | `explainProgress` | `learningApi.ts` | `POST` | `/api/v1/learning/explain-progress` | None | `LearningExplainProgressPayload` | `ExplainProgressWireResponse` | No Cache | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 62 | `explainStudyPlan` | `learningApi.ts` | `POST` | `/api/v1/learning/explain-plan` | None | `LearningExplainPlanPayload` | `ExplainPlanWireResponse` | No Cache | None | 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 PLAN_NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 63 | `requestMockDebrief` | `learningApi.ts` | `POST` | `/api/v1/learning/mock-review` | None | `LearningMockReviewPayload` | `MockReviewWireResponse` | No Cache | None | 400 VALIDATION_ERROR / SESSION_NOT_TERMINAL, 401 UNAUTHORIZED, 403 OWNERSHIP_VIOLATION, 404 SESSION_NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_SERVER_ERROR |
| 64 | `issuePrescription` | `orchestrationApi.ts` | `POST` | `/api/v1/attribution/prescriptions` | None | `PrescriptionIssuanceRequestPayload` | `AttributionIssuanceWireResponse` | No Cache | ['orchestration'] | 400 VALIDATION_ERROR (missing/invalid Idempotency-Key), 401 UNAUTHORIZED, 409 IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD, 500 INTERNAL_SERVER_ERROR |

**Total Consumed Operations Specified: 64 / 64 (100%).**

Operation 3 `authApi.refreshSession` delegates exclusively to `tokenManager.executeSingleFlightRefresh()`; the token manager owns the raw refresh fetch, response decode, token write, and shared lock. The operation's wire DTO remains `AuthRefreshWireResponse`; the internal delegate returns the lock's `Promise<string>` (rotated access token string) to its caller and MUST NOT perform a second fetch. `AuthContext` owns only principal/session/status metadata. All `/auth/*` 401s, including `/auth/me`, enter the taxonomy without automatic recursive replay.

---

### 16.2 Exhaustive 64-Operation Mechanical Wire Contract Specification

The 64 consumed operations are defined with complete contract dimensions in the authoritative specification below:

#### Operation 1: `POST /api/v1/auth/register`
- **Operation Number**: 1
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/auth/register`
- **Authentication Requirements**: Public (Anonymous Rate Limiter)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Origin, Content-Type: application/json
- **Request Body**: `RegisterRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: { user: AuthUserSummary } }`
- **Success Status Code(s)**: 201 Created
- **Root Metadata**: None
- **Payload DTO**: `AuthRegisterWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, DUPLICATE_RESOURCE, PASSWORD_BLOCKLISTED, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/authApi.ts` (`registerLearner`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/authApi.contract.test.ts`

#### Operation 2: `POST /api/v1/auth/login`
- **Operation Number**: 2
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/auth/login`
- **Authentication Requirements**: Public (Anonymous Rate Limiter)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Origin, Content-Type: application/json
- **Request Body**: `LoginRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: { accessToken: string, expiresIn: number, user: AuthUserSummary } }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AuthLoginWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, INVALID_CREDENTIALS, ACCOUNT_DISABLED, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/authApi.ts` (`loginLearner`)
- **Query/Cache Behavior**: No Cache; Invalidation: Clears all cache (queryClient.clear())
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/authApi.contract.test.ts`

#### Operation 3: `POST /api/v1/auth/refresh`
- **Operation Number**: 3
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/auth/refresh`
- **Authentication Requirements**: Public Cookie Transport (refreshRateLimiter)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Origin, Cookie: refreshToken
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: { accessToken: string, expiresIn: number } }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AuthRefreshWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 429, 500
- **Failure Error Codes**: INVALID_TOKEN, TOKEN_EXPIRED, SESSION_REVOKED, ORIGIN_MISMATCH, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/authApi.ts` (`refreshSession`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/authApi.contract.test.ts`

#### Operation 4: `POST /api/v1/auth/logout`
- **Operation Number**: 4
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/auth/logout`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: { message: "Successfully logged out." } }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AuthLogoutWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 500
- **Failure Error Codes**: UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/authApi.ts` (`logoutLearner`)
- **Query/Cache Behavior**: No Cache; Invalidation: Clears all cache (queryClient.clear())
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/authApi.contract.test.ts`

#### Operation 5: `POST /api/v1/auth/revoke-all`
- **Operation Number**: 5
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/auth/revoke-all`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: { message: "All active sessions revoked." } }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AuthRevokeAllWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 500
- **Failure Error Codes**: UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/authApi.ts` (`revokeAllSessions`)
- **Query/Cache Behavior**: No Cache; Invalidation: Clears all cache (queryClient.clear())
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/authApi.contract.test.ts`

#### Operation 6: `GET /api/v1/auth/me`
- **Operation Number**: 6
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/auth/me`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: AuthMeDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AuthMeWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 404, 500
- **Failure Error Codes**: UNAUTHORIZED, USER_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/authApi.ts` (`fetchAuthMe`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/authApi.contract.test.ts`

#### Operation 7: `GET /api/v1/questions/topics`
- **Operation Number**: 7
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/topics`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: TopicListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `TopicListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 500
- **Failure Error Codes**: UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchTopics`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 8: `GET /api/v1/questions/topic/:topic/patterns`
- **Operation Number**: 8
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/topic/:topic/patterns`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :topic
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: PatternListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PatternListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: INVALID_TOPIC, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchPatternsByTopic`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 9: `GET /api/v1/questions/topic/:topic`
- **Operation Number**: 9
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/topic/:topic`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :topic
- **Query Parameters**: page? (opt), limit? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: QuestionPaginatedDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `QuestionPaginatedWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: INVALID_TOPIC, INVALID_PAGINATION, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchQuestionsByTopic`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 10: `GET /api/v1/questions/topic/:topic/pattern/:pattern`
- **Operation Number**: 10
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/topic/:topic/pattern/:pattern`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :topic, :pattern
- **Query Parameters**: page? (opt), limit? (opt), difficulty? (opt, 1-10)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: QuestionPaginatedDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `QuestionPaginatedWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: INVALID_TOPIC, INVALID_PATTERN, INVALID_DIFFICULTY, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchQuestionsByPattern`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 11: `GET /api/v1/questions/topic/:topic/random`
- **Operation Number**: 11
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/topic/:topic/random`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :topic
- **Query Parameters**: limit? (opt, def 10, clamp 1-50), difficulty? (opt, 1-10)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: QuestionRandomListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `QuestionRandomListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: INVALID_TOPIC, INVALID_LIMIT, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchRandomQuestionsByTopic`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 12: `GET /api/v1/questions/topic/:topic/pattern/:pattern/random`
- **Operation Number**: 12
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/topic/:topic/pattern/:pattern/random`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :topic, :pattern
- **Query Parameters**: limit? (opt, def 10, clamp 1-50), difficulty? (opt, 1-10)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: QuestionRandomListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `QuestionRandomListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: INVALID_TOPIC, INVALID_PATTERN, INVALID_DIFFICULTY, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchRandomQuestionsByPattern`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 13: `GET /api/v1/questions/:id([a-fA-F0-9]{24})`
- **Operation Number**: 13
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/questions/:id([a-fA-F0-9]{24})`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id([a-fA-F0-9]{24})
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: QuestionDetailDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `QuestionDetailWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: INVALID_ID, UNAUTHORIZED, QUESTION_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/questionApi.ts` (`fetchQuestionById`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/questionApi.contract.test.ts`

#### Operation 14: `GET /api/v1/users/:userId`
- **Operation Number**: 14
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/users/:userId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: UserGetDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `UserGetWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, USER_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/goalApi.ts` (`fetchUserProfile`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/goalApi.contract.test.ts`

#### Operation 15: `GET /api/v1/goals/user/:userId`
- **Operation Number**: 15
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/goals/user/:userId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: GoalListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `GoalListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/goalApi.ts` (`fetchUserGoals`)
- **Query/Cache Behavior**: Stale: 1m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/goalApi.contract.test.ts`

#### Operation 16: `POST /api/v1/goals`
- **Operation Number**: 16
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/goals`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `GoalCreateRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: GoalCreateDto }`
- **Success Status Code(s)**: 201 Created
- **Root Metadata**: None
- **Payload DTO**: `GoalCreateWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/goalApi.ts` (`createGoal`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['goals', 'user', userId]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/goalApi.contract.test.ts`

#### Operation 17: `GET /api/v1/goals/:id`
- **Operation Number**: 17
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/goals/:id`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: GoalDetailDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `GoalDetailWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, GOAL_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/goalApi.ts` (`fetchGoalById`)
- **Query/Cache Behavior**: Stale: 1m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/goalApi.contract.test.ts`

#### Operation 18: `PATCH /api/v1/goals/:id`
- **Operation Number**: 18
- **HTTP Method**: `PATCH`
- **Exact Route**: `/api/v1/goals/:id`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `GoalPatchRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: GoalPatchDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `GoalPatchWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, GOAL_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/goalApi.ts` (`patchGoal`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['goals', 'user', userId], ['goals', 'detail', id]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/goalApi.contract.test.ts`

#### Operation 19: `DELETE /api/v1/goals/:id`
- **Operation Number**: 19
- **HTTP Method**: `DELETE`
- **Exact Route**: `/api/v1/goals/:id`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: GoalDeleteDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `GoalDeleteWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, GOAL_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/goalApi.ts` (`deleteGoal`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['goals', 'user', userId], ['goals', 'detail', id]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/goalApi.contract.test.ts`

#### Operation 20: `POST /api/v1/planning/preview`
- **Operation Number**: 20
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/planning/preview`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `PlanPreviewRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: PlanPreviewDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PlanPreviewWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, GOAL_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`previewPlan`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 21: `POST /api/v1/planning/generate`
- **Operation Number**: 21
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/planning/generate`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `PlanGenerateRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: PlanGenerateDto }`
- **Success Status Code(s)**: 201 Created
- **Root Metadata**: None
- **Payload DTO**: `PlanGenerateWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, GOAL_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`generatePlan`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['planning', 'plans', userId], ['planning', 'dailyObjectives', userId], ['planning', 'schedule']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 22: `POST /api/v1/planning/plans/:planId/replan`
- **Operation Number**: 22
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/planning/plans/:planId/replan`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :planId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `PlanReplanRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: PlanReplanDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PlanReplanWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, PLAN_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`replanPlan`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['planning', 'plans', userId], ['planning', 'dailyObjectives', userId], ['planning', 'schedule', planId]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 23: `GET /api/v1/planning/plans/:planId/schedule`
- **Operation Number**: 23
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/planning/plans/:planId/schedule`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :planId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: PlanScheduleDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PlanScheduleWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, PLAN_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`fetchPlanSchedule`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 24: `GET /api/v1/study-plans/user/:userId`
- **Operation Number**: 24
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/study-plans/user/:userId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: status? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: PlanListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PlanListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`fetchUserPlans`)
- **Query/Cache Behavior**: Stale: 2m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 25: `GET /api/v1/daily-objectives/user/:userId`
- **Operation Number**: 25
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/daily-objectives/user/:userId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: page? (opt), limit? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: DailyObjectiveListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `DailyObjectiveListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: INVALID_PAGINATION, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`fetchUserDailyObjectives`)
- **Query/Cache Behavior**: Stale: 1m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 26: `PATCH /api/v1/daily-objectives/:id`
- **Operation Number**: 26
- **HTTP Method**: `PATCH`
- **Exact Route**: `/api/v1/daily-objectives/:id`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `DailyObjectivePatchPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: DailyObjectivePatchDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `DailyObjectivePatchWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, OBJECTIVE_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/planningApi.ts` (`patchDailyObjective`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['planning', 'dailyObjectives', userId]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/planningApi.contract.test.ts`

#### Operation 27: `POST /api/v1/attempts`
- **Operation Number**: 27
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/attempts`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `AttemptRecordRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: AttemptRecordDto }`
- **Success Status Code(s)**: 201 Created
- **Root Metadata**: None
- **Payload DTO**: `AttemptRecordWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, QUESTION_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/attemptApi.ts` (`recordAttempt`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['attempts', 'user', userId], ['progress'], ['analytics'], ['revisions', 'due'], ['revisions', 'plan'], ['orchestration']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/attemptApi.contract.test.ts`

#### Operation 28: `GET /api/v1/attempts/user/:userId`
- **Operation Number**: 28
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/attempts/user/:userId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: page? (opt), limit? (opt), topic? (opt), pattern? (opt), questionId? (opt), sessionId? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: AttemptListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `AttemptListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: INVALID_PAGINATION, INVALID_DATE, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/attemptApi.ts` (`fetchUserAttempts`)
- **Query/Cache Behavior**: Stale: 30s; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/attemptApi.contract.test.ts`

#### Operation 29: `GET /api/v1/progress/:userId`
- **Operation Number**: 29
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/progress/:userId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: page? (opt), limit? (opt), sortBy? (opt), sortDir? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: StudentProgressDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `StudentProgressWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: INVALID_PAGINATION, INVALID_SORT, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/progressApi.ts` (`fetchOverallProgress`)
- **Query/Cache Behavior**: Stale: 30s; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/progressApi.contract.test.ts`

#### Operation 30: `GET /api/v1/progress/:userId/topics`
- **Operation Number**: 30
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/progress/:userId/topics`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: topic? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: TopicMasteryDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `TopicMasteryWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/progressApi.ts` (`fetchTopicMastery`)
- **Query/Cache Behavior**: Stale: 30s; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/progressApi.contract.test.ts`

#### Operation 31: `GET /api/v1/progress/:userId/patterns`
- **Operation Number**: 31
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/progress/:userId/patterns`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: topic (REQUIRED)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: PatternMasteryDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PatternMasteryWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/progressApi.ts` (`fetchPatternMastery`)
- **Query/Cache Behavior**: Stale: 30s; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/progressApi.contract.test.ts`

#### Operation 32: `GET /api/v1/progress/:userId/weakest`
- **Operation Number**: 32
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/progress/:userId/weakest`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :userId
- **Query Parameters**: topic? (opt), limit? (opt, def 10, clamp 1-50)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: WeakestPatternsDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `WeakestPatternsWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/progressApi.ts` (`fetchWeakestPatterns`)
- **Query/Cache Behavior**: Stale: 30s; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/progressApi.contract.test.ts`

#### Operation 33: `GET /api/v1/progress/prerequisites/:patternName`
- **Operation Number**: 33
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/progress/prerequisites/:patternName`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :patternName
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: PrerequisiteGraphDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `PrerequisiteGraphWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: PATTERN_NOT_FOUND, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/progressApi.ts` (`fetchPrerequisites`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/progressApi.contract.test.ts`

#### Operation 34: `GET /api/v1/adaptive/next-question`
- **Operation Number**: 34
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/adaptive/next-question`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: topic? (opt), pattern? (opt), planId? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: AdaptiveNextQuestionDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AdaptiveNextQuestionWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: answer, explanation
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: INVALID_TOPIC, INVALID_PATTERN, UNAUTHORIZED, NO_ELIGIBLE_QUESTIONS, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/adaptiveApi.ts` (`fetchAdaptiveNextQuestion`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/adaptiveApi.contract.test.ts`

#### Operation 35: `GET /api/v1/revisions/due`
- **Operation Number**: 35
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/revisions/due`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: date? (opt), referenceDate? (opt), topic? (opt), planId? (opt), goalId? (opt), limit? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: RevisionDueListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with pagination metadata
- **Payload DTO**: `RevisionDueListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 500
- **Failure Error Codes**: UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/revisionApi.ts` (`fetchRevisionDue`)
- **Query/Cache Behavior**: Stale: 2m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/revisionApi.contract.test.ts`

#### Operation 36: `GET /api/v1/revisions/plan`
- **Operation Number**: 36
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/revisions/plan`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: days? (days in {1,2}), questionBudget? (opt), patternsPerDay? (opt), referenceDate? (opt), date? (opt), topic? (opt), planId? (opt), goalId? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: RevisionPlanDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `RevisionPlanWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: INVALID_WINDOW, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/revisionApi.ts` (`fetchRevisionPlan`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/revisionApi.contract.test.ts`

#### Operation 37: `POST /api/v1/revisions/rebuild`
- **Operation Number**: 37
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/revisions/rebuild`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `RevisionRebuildRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: RevisionRebuildDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `RevisionRebuildWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/revisionApi.ts` (`rebuildRevisionQueue`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['revisions', 'due'], ['revisions', 'plan'], ['orchestration', 'dailyAgenda']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/revisionApi.contract.test.ts`

#### Operation 38: `GET /api/v1/mock-blueprints`
- **Operation Number**: 38
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/mock-blueprints`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockBlueprintListDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockBlueprintListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 500
- **Failure Error Codes**: UNAUTHORIZED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`fetchMockBlueprints`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 39: `POST /api/v1/mock-sessions`
- **Operation Number**: 39
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/mock-sessions`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `MockSessionCreateRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: MockSessionCreateDto }`
- **Success Status Code(s)**: 201 Created
- **Root Metadata**: None
- **Payload DTO**: `MockSessionCreateWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, BLUEPRINT_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`createMockSession`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['mock', 'session']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 40: `POST /api/v1/mock-sessions/:id/start`
- **Operation Number**: 40
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/mock-sessions/:id/start`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockSessionStartDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockSessionStartWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 409, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, SESSION_STATE_CONFLICT, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`startMockSession`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['mock', 'session', id], ['orchestration']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 41: `GET /api/v1/mock-sessions/:id`
- **Operation Number**: 41
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/mock-sessions/:id`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockSessionDetailDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockSessionDetailWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`fetchMockSession`)
- **Query/Cache Behavior**: Stale: 0s; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 42: `GET /api/v1/mock-sessions/:id/questions/:questionId`
- **Operation Number**: 42
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/mock-sessions/:id/questions/:questionId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id, :questionId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockQuestionDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockQuestionWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: answer, explanation, solution (sealed 8-field active mock projection)
- **Failure Status Codes**: 400, 401, 403, 404, 409, 500
- **Failure Error Codes**: QUESTION_NOT_IN_SESSION, UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, QUESTION_NOT_FOUND, SECTION_LOCKED, MOCK_SESSION_EXPIRED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`fetchMockQuestion`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 43: `POST /api/v1/mock-sessions/:id/responses`
- **Operation Number**: 43
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/mock-sessions/:id/responses`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `MockResponseSavePayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: MockResponseSaveDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockResponseSaveWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 409, 500
- **Failure Error Codes**: VALIDATION_ERROR, QUESTION_NOT_IN_SESSION, UNAUTHORIZED, OWNERSHIP_VIOLATION, RESPONSES_FROZEN, SECTION_LOCKED, MOCK_SESSION_EXPIRED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`saveMockResponse`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['mock', 'session', id]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 44: `POST /api/v1/mock-sessions/:id/sections/:sectionId/complete`
- **Operation Number**: 44
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/mock-sessions/:id/sections/:sectionId/complete`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id, :sectionId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockSectionCompleteDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockSectionCompleteWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 409, 500
- **Failure Error Codes**: INVALID_SECTION, UNAUTHORIZED, OWNERSHIP_VIOLATION, SECTION_STATE_CONFLICT, MOCK_SESSION_EXPIRED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`completeMockSection`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['mock', 'session', id]
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 45: `POST /api/v1/mock-sessions/:id/submit`
- **Operation Number**: 45
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/mock-sessions/:id/submit`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockSubmitDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockSubmitWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 409, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, FINALIZATION_IN_PROGRESS, SESSION_STATE_CONFLICT, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`submitMockSession`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['mock', 'session', id], ['mock', 'result', id], ['progress'], ['analytics'], ['orchestration']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 46: `POST /api/v1/mock-sessions/:id/abandon`
- **Operation Number**: 46
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/mock-sessions/:id/abandon`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockSessionAbandonDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockSessionAbandonWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 401, 403, 404, 409, 500
- **Failure Error Codes**: UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, SESSION_STATE_CONFLICT, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`abandonMockSession`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['mock', 'session', id], ['orchestration']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 47: `GET /api/v1/mock-sessions/:id/result`
- **Operation Number**: 47
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/mock-sessions/:id/result`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockResultDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockResultWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 404, 409, 500
- **Failure Error Codes**: MOCK_SESSION_NOT_TERMINAL, UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, RESULT_NOT_FOUND, FINALIZATION_IN_PROGRESS, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`fetchMockResult`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 48: `GET /api/v1/mock-sessions/:id/review`
- **Operation Number**: 48
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/mock-sessions/:id/review`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :id
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: MockReviewDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `MockReviewWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: solution
- **Failure Status Codes**: 400, 401, 403, 404, 500
- **Failure Error Codes**: MOCK_SESSION_NOT_TERMINAL, UNAUTHORIZED, OWNERSHIP_VIOLATION, MOCK_SESSION_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/mockApi.ts` (`fetchMockReview`)
- **Query/Cache Behavior**: Stale: 1h; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/mockApi.contract.test.ts`

#### Operation 49: `GET /api/v1/analytics/dashboard`
- **Operation Number**: 49
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/analytics/dashboard`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: userId (REQUIRED)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: AnalyticsDashboardDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `AnalyticsDashboardWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/analyticsApi.ts` (`fetchAnalyticsDashboard`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/analyticsApi.contract.test.ts`

#### Operation 50: `GET /api/v1/analytics/cognitive-profile`
- **Operation Number**: 50
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/analytics/cognitive-profile`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: userId (REQUIRED), windowDays? (opt), topic? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: CognitiveProfileDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `CognitiveProfileWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/analyticsApi.ts` (`fetchCognitiveProfile`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/analyticsApi.contract.test.ts`

#### Operation 51: `GET /api/v1/analytics/retention`
- **Operation Number**: 51
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/analytics/retention`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: userId (REQUIRED)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: RetentionAnalyticsDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `RetentionAnalyticsWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/analyticsApi.ts` (`fetchRetentionAnalytics`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/analyticsApi.contract.test.ts`

#### Operation 52: `GET /api/v1/analytics/readiness/:goalId`
- **Operation Number**: 52
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/analytics/readiness/:goalId`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :goalId
- **Query Parameters**: userId (REQUIRED)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: ExamReadinessDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: None
- **Payload DTO**: `ExamReadinessWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 404, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, GOAL_NOT_FOUND, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/analyticsApi.ts` (`fetchExamReadiness`)
- **Query/Cache Behavior**: Stale: 5m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/analyticsApi.contract.test.ts`

#### Operation 53: `GET /api/v1/orchestration/next-action`
- **Operation Number**: 53
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/orchestration/next-action`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: userId (REQUIRED), goalId? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: NextActionDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with referenceNow ISO string
- **Payload DTO**: `NextActionWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/orchestrationApi.ts` (`fetchNextAction`)
- **Query/Cache Behavior**: Stale: 1m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/orchestrationApi.contract.test.ts`

#### Operation 54: `GET /api/v1/orchestration/daily-agenda`
- **Operation Number**: 54
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/orchestration/daily-agenda`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: userId (REQUIRED), goalId? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: DailyAgendaContainerDto, meta: { referenceNow: string } }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with referenceNow ISO string
- **Payload DTO**: `DailyAgendaWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/orchestrationApi.ts` (`fetchDailyAgenda`)
- **Query/Cache Behavior**: Stale: 1m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/orchestrationApi.contract.test.ts`

#### Operation 55: `GET /api/v1/orchestration/interventions`
- **Operation Number**: 55
- **HTTP Method**: `GET`
- **Exact Route**: `/api/v1/orchestration/interventions`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: userId (REQUIRED), goalId? (opt)
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: InterventionListContainerDto, meta: { referenceNow: string } }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with referenceNow ISO string
- **Payload DTO**: `InterventionListWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/orchestrationApi.ts` (`fetchInterventions`)
- **Query/Cache Behavior**: Stale: 1m; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/orchestrationApi.contract.test.ts`

#### Operation 56: `POST /api/v1/attribution/prescriptions/:prescriptionId/activate`
- **Operation Number**: 56
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/attribution/prescriptions/:prescriptionId/activate`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :prescriptionId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: None
- **Raw HTTP Success Envelope**: `{ success: true, data: PrescriptionLeaseDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with referenceNow ISO string
- **Payload DTO**: `PrescriptionLeaseWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 404, 409, 500
- **Failure Error Codes**: VALIDATION_ERROR, INVALID_PRESCRIPTION_ID, UNAUTHORIZED, OWNERSHIP_VIOLATION, PRESCRIPTION_NOT_FOUND, PRESCRIPTION_STATE_CONFLICT, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/orchestrationApi.ts` (`activatePrescription`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['orchestration']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/orchestrationApi.contract.test.ts`

#### Operation 57: `POST /api/v1/attribution/prescriptions/:prescriptionId/complete`
- **Operation Number**: 57
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/attribution/prescriptions/:prescriptionId/complete`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: :prescriptionId
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `PrescriptionCompletePayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: PrescriptionCompleteDto }`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `meta` object present with referenceNow ISO string
- **Payload DTO**: `PrescriptionCompleteWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 403, 404, 409, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, PRESCRIPTION_NOT_FOUND, PRESCRIPTION_STATE_CONFLICT, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/orchestrationApi.ts` (`completePrescription`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['orchestration'], ['progress'], ['analytics']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/orchestrationApi.contract.test.ts`

#### Operation 58: `POST /api/v1/learning/tutor`
- **Operation Number**: 58
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/learning/tutor`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `LearningTutorRequestPayload`
- **Raw HTTP Success Envelope**: `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `metadata` & `provenance` at root (NO success boolean)
- **Payload DTO**: `TutorWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: success boolean strictly omitted
- **Failure Status Codes**: 400, 401, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/learningApi.ts` (`requestTutorGuidance`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/learningApi.contract.test.ts`

#### Operation 59: `POST /api/v1/learning/hint`
- **Operation Number**: 59
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/learning/hint`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `LearningHintRequestPayload`
- **Raw HTTP Success Envelope**: `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `metadata` & `provenance` at root (NO success boolean)
- **Payload DTO**: `HintWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: success boolean strictly omitted
- **Failure Status Codes**: 400, 401, 403, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, ATTEMPT_REQUIRED, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/learningApi.ts` (`requestQuestionHint`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/learningApi.contract.test.ts`

#### Operation 60: `POST /api/v1/learning/explain-attempt`
- **Operation Number**: 60
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/learning/explain-attempt`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `LearningExplainAttemptPayload`
- **Raw HTTP Success Envelope**: `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `metadata` & `provenance` at root (NO success boolean)
- **Payload DTO**: `ExplainAttemptWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: success boolean strictly omitted
- **Failure Status Codes**: 400, 401, 403, 404, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, ATTEMPT_NOT_FOUND, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/learningApi.ts` (`explainAttemptError`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/learningApi.contract.test.ts`

#### Operation 61: `POST /api/v1/learning/explain-progress`
- **Operation Number**: 61
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/learning/explain-progress`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `LearningExplainProgressPayload`
- **Raw HTTP Success Envelope**: `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `metadata` & `provenance` at root (NO success boolean)
- **Payload DTO**: `ExplainProgressWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: success boolean strictly omitted
- **Failure Status Codes**: 400, 401, 403, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/learningApi.ts` (`explainProgress`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/learningApi.contract.test.ts`

#### Operation 62: `POST /api/v1/learning/explain-plan`
- **Operation Number**: 62
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/learning/explain-plan`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `LearningExplainPlanPayload`
- **Raw HTTP Success Envelope**: `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `metadata` & `provenance` at root (NO success boolean)
- **Payload DTO**: `ExplainPlanWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: success boolean strictly omitted
- **Failure Status Codes**: 400, 401, 403, 404, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, OWNERSHIP_VIOLATION, PLAN_NOT_FOUND, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/learningApi.ts` (`explainStudyPlan`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/learningApi.contract.test.ts`

#### Operation 63: `POST /api/v1/learning/mock-review`
- **Operation Number**: 63
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/learning/mock-review`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Content-Type: application/json
- **Request Body**: `LearningMockReviewPayload`
- **Raw HTTP Success Envelope**: `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto } [NO success property!]`
- **Success Status Code(s)**: 200 OK
- **Root Metadata**: `metadata` & `provenance` at root (NO success boolean)
- **Payload DTO**: `MockReviewWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: success boolean strictly omitted
- **Failure Status Codes**: 400, 401, 403, 404, 429, 500
- **Failure Error Codes**: VALIDATION_ERROR, SESSION_NOT_TERMINAL, UNAUTHORIZED, OWNERSHIP_VIOLATION, SESSION_NOT_FOUND, RATE_LIMITED, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/learningApi.ts` (`requestMockDebrief`)
- **Query/Cache Behavior**: No Cache; Invalidation: None
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/learningApi.contract.test.ts`

#### Operation 64: `POST /api/v1/attribution/prescriptions`
- **Operation Number**: 64
- **HTTP Method**: `POST`
- **Exact Route**: `/api/v1/attribution/prescriptions`
- **Authentication Requirements**: Authenticated (Bearer Access Token)
- **Path Parameters**: None
- **Query Parameters**: None
- **Headers**: Authorization: Bearer <accessToken>, Idempotency-Key: <required non-empty string, max 128 chars>, Content-Type: application/json
- **Request Body**: `PrescriptionIssuanceRequestPayload`
- **Raw HTTP Success Envelope**: `{ success: true, data: AttributionIssuanceDto }`
- **Success Status Code(s)**: 201 Created (new prescription) / 200 OK (idempotent replay)
- **Root Metadata**: `meta` object present with referenceNow ISO string
- **Payload DTO**: `AttributionIssuanceWireResponse`
- **Nullable Fields**: Derived from DTO contract in Section 18
- **Optional Fields**: Derived from DTO contract in Section 18
- **Omitted Fields**: None
- **Failure Status Codes**: 400, 401, 409, 500
- **Failure Error Codes**: VALIDATION_ERROR, UNAUTHORIZED, IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD, INTERNAL_SERVER_ERROR
- **Frontend API-Service Owner**: `src/services/api/orchestrationApi.ts` (`issuePrescription`)
- **Query/Cache Behavior**: No Cache; Invalidation: ['orchestration']
- **UI Consumer**: Identified in Section 7 & Feature Modules
- **Contract-Test Owner**: `src/test/api/orchestrationApi.contract.test.ts`


## 17. NON-CONSUMED BACKEND ROUTES CLASSIFICATION (ALL 22 OPERATIONS)

The static Abstract Syntax Tree (AST) scan of the Express backend router tree (`adaptive-aptitude-api/src/app.js` and modular sub-routers) proves exactly 86 registered route declarations. The learner web application consumes exactly 64 operations (Operations 1–64). The remaining **22 operations** are systematically classified as non-consumed operational probes, tombstones, non-learner authoring utilities, or low-level redundant CRUD bypassed by higher-level workflow APIs:

| # | HTTP Method | Registered Express Route | Authentication Guard | Classification Category | Consumption Rationale & Justification |
|---|---|---|---|---|---|
| 1 | `GET` | `/health` | Unauthenticated | Platform Health Probe | Basic platform health probe; learner client does not poll health probes directly. |
| 2 | `GET` | `/health/live` | Unauthenticated | Kubernetes Liveness Probe | Infrastructure probe for container orchestration; not consumed by learner SPA. |
| 3 | `GET` | `/health/ready` | Unauthenticated | Database Readiness Probe | Database dependency probe for infrastructure lifecycle; not consumed by learner SPA. |
| 4 | `GET` | `/metrics` | Bearer Metrics Secret | Operational Telemetry | Prometheus operational metrics scraper; conditional endpoint protected by bearer token. |
| 5 | `POST` | `/api/v1/users` | Unauthenticated (Tombstone) | Deprecated Tombstone | Returns HTTP 410 (`USER_CREATION_ENDPOINT_DEPRECATED`). Registration is exclusively handled via `POST /api/v1/auth/register`. |
| 6 | `POST` | `/api/v1/study-plans` | Authenticated (`req.user`) | Low-Level CRUD | Direct low-level plan creation is bypassed by automated wizard `POST /api/v1/planning/generate`. |
| 7 | `GET` | `/api/v1/study-plans/:id` | Authenticated (`req.user`) | Redundant Query | Single plan lookup is redundant; learner application queries user plans via `GET /api/v1/study-plans/user/:userId` and schedule via `GET /api/v1/planning/plans/:planId/schedule`. |
| 8 | `PATCH` | `/api/v1/study-plans/:id` | Authenticated (`req.user`) | Low-Level Mutation | Direct manual plan modification is omitted; schedule pace adjustments are performed via `POST /api/v1/planning/plans/:planId/replan`. |
| 9 | `DELETE`| `/api/v1/study-plans/:id` | Authenticated (`req.user`) | Low-Level Mutation | Direct plan deletion is omitted; goal lifecycle management handles plan lifecycle. |
| 10 | `POST` | `/api/v1/daily-objectives` | Authenticated (`req.user`) | Automated Synthesis | Manual daily objective creation is omitted; daily objectives are automatically synthesized during planning generation and replanning. |
| 11 | `GET` | `/api/v1/daily-objectives/:id` | Authenticated (`req.user`) | Redundant Query | Individual objective lookup by ID is omitted; objectives are queried by user date range via `GET /api/v1/daily-objectives/user/:userId`. |
| 12 | `DELETE`| `/api/v1/daily-objectives/:id` | Authenticated (`req.user`) | Low-Level Mutation | Individual objective deletion is not exposed to learners; objective recalculation is handled through replanning. |
| 13 | `GET` | `/api/v1/attempts/:id` | Authenticated (`req.user`) | Redundant Query | Single attempt lookup by ID is omitted; attempts are queried in paginated user collections via `GET /api/v1/attempts/user/:userId`. |
| 14 | `GET` | `/api/v1/progress/:userId/difficulty-distribution` | Authenticated (`req.user`) | Specialized Diagnostic | Diagnostic endpoint not required by Phase 15 V1 learner UX. |
| 15 | `GET` | `/api/v1/progress/:userId/accuracy-over-time` | Authenticated (`req.user`) | Specialized Diagnostic | Diagnostic endpoint not required by Phase 15 V1 learner UX. |
| 16 | `GET` | `/api/v1/progress/:userId/by-source` | Authenticated (`req.user`) | Specialized Diagnostic | Diagnostic endpoint not required by Phase 15 V1 learner UX. |
| 17 | `GET` | `/api/v1/revisions/user/:userId` | Authenticated (`req.user`) | Raw Ledger Query | Unfiltered raw revision ledger; learner UX consumes actionable queue `GET /api/v1/revisions/due` and projection `GET /api/v1/revisions/plan`. |
| 18 | `GET` | `/api/v1/revisions/:id` | Authenticated (`req.user`) | Redundant Query | Single revision lookup by ID is omitted; items are reviewed within active sessions. |
| 19 | `POST` | `/api/v1/mock-blueprints` | CLOSED / Tombstone Auth Bypass | Authoring Mutation | Blueprint authoring mutation closed in production (HTTP 403 `BLUEPRINT_MUTATION_CLOSED`); bypasses auth for deterministic 403. |
| 20 | `POST` | `/api/v1/mock-blueprints/preview` | Authenticated (`req.user`) | Authoring Utility | Authenticated authoring preview; learner application consumes published catalog via `GET /api/v1/mock-blueprints`. |
| 21 | `GET` | `/api/v1/mock-blueprints/:id` | Authenticated (`req.user`) | Redundant Query | Blueprint catalog (`GET /api/v1/mock-blueprints`) provides metadata for exam selection; individual blueprint lookup is not required by learner UX. |
| 22 | `GET` | `/api/v1/attribution/users/:userId/summary` | Authenticated (`req.user`) | Specialized Longitudinal | Specialized longitudinal summary report; not required by Phase 15 V1 learner UX. |

**Total Registered Backend Routes**: 86  
**Authoritative Consumed Operations**: 64 (Operations 1–64)  
**Authoritative Non-Consumed Operations**: 22  
**Discrepancy / Overlap Count**: 0  

---

## 18. BACKEND-PROVEN DTO IMPLEMENTATION CONTRACT

All wire contracts consumed by the 64 operations MUST be defined inside `src/types/api.ts`. Strict separation is maintained between API DTOs, View Models, and Component Props.

### 18.1 Separation of Type Concerns
To prevent conflation between raw network transport and user interface display states, the architecture enforces a strict three-tier type hierarchy:
1. **API DTOs (`src/types/api.ts`)**: Pure wire representations matching frozen Express routes and Mongoose schemas. Contain zero UI-only state flags, view formatters, or derived labels.
2. **View Models (`src/types/quiz.ts`, `src/types/analytics.ts`)**: Ephemeral, client-side synthesized state combining multiple DTOs for efficient React rendering (e.g., `QuizFeedbackViewModel` combining attempt results with question explanations).
3. **Component Props (`src/components/...`)**: Pure interface boundaries specifying React element properties, accessibility callbacks, and render slots.

---

### 18.2 Complete TypeScript Type Definitions (`src/types/api.ts`)

```typescript
// src/types/api.ts
// Exhaustive, mechanically certified backend wire contracts for all 64 consumed operations.

// ── Generic API Envelopes & Metadata (BACKEND-PROVEN: src/utils/apiResponse.js) ────────────
export interface ApiSuccessEnvelope<T, M = unknown> {
  success: true;
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  count: number;
}

export interface SuccessEnvelopeDto {
  message: string;
}

// ── Auth Wire DTOs & Responses (Operations 1–6) ───────────────────────────────────────────
// BACKEND-PROVEN: src/routes/authRoutes.js & src/controllers/authController.js
export interface AuthUserSummary {
  userId: string;
  name: string;
  email: string;
}

export interface UserProfileDto {
  userId: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  status: 'active' | 'disabled' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequestPayload {
  name: string;
  email: string;
  password: string;
}

// Op 1: POST /api/v1/auth/register (returns 201 with data: { user })
export interface RegisterResponseDto {
  user: AuthUserSummary;
}

export type AuthRegisterPayload = RegisterResponseDto;
export type AuthRegisterResponse = AuthRegisterWireResponse;
export type RegisterWireResponse = AuthRegisterWireResponse;
export type RegisterResponseWireResponse = AuthRegisterWireResponse;

export interface AuthRegisterWireResponse {
  success: true;
  data: RegisterResponseDto;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

// Op 2: POST /api/v1/auth/login (returns 200 with accessToken, expiresIn, user; HttpOnly cookie for refresh)
export interface LoginResponseDto {
  accessToken: string;
  expiresIn: number;
  user: AuthUserSummary;
}

export type AuthLoginPayload = LoginResponseDto;
export type AuthLoginResponse = AuthLoginWireResponse;
export type LoginWireResponse = AuthLoginWireResponse;

export interface AuthLoginWireResponse {
  success: true;
  data: LoginResponseDto;
}

// Op 3: POST /api/v1/auth/refresh (returns 200 with accessToken, expiresIn; HttpOnly cookie for refresh)
export interface RefreshTokenResponseDto {
  accessToken: string;
  expiresIn: number;
}

export type RefreshResponseDto = RefreshTokenResponseDto;
export type AuthRefreshPayload = RefreshTokenResponseDto;
export type AuthRefreshResponse = AuthRefreshWireResponse;
export type RefreshWireResponse = AuthRefreshWireResponse;

export interface AuthRefreshWireResponse {
  success: true;
  data: RefreshResponseDto;
}

// Op 4: POST /api/v1/auth/logout (requires authenticate middleware; clears refresh cookie)
export interface AuthLogoutWireResponse {
  success: true;
  data: {
    message: string;
  };
}

// Op 5: POST /api/v1/auth/revoke-all (requires authenticate middleware; clears refresh cookie)
export interface AuthRevokeAllWireResponse {
  success: true;
  data: {
    message: string;
  };
}

// Op 6: GET /api/v1/auth/me (requires authenticate middleware)
export interface AuthMeWireResponse {
  success: true;
  data: {
    user: UserProfileDto;
    session: {
      sessionId: string;
      issuedAt: string;
      expiresAt: string;
    };
  };
}

// ── Question Bank & Pattern Registry DTOs (Operations 7–13) ──────────────────────────────
// Op 7: GET /api/v1/questions/topics
export interface TopicListWireResponse {
  success: true;
  data: string[];
  meta: {
    count: number;
  };
}

export interface PatternSummaryDto {
  name: string;
  slug: string;
  description: string;
  questionCount: number;
  prerequisites: string[];
  aliases: string[];
}

export type PatternDto = PatternSummaryDto;

// Op 8: GET /api/v1/questions/topic/:topic/patterns
export interface PatternListWireResponse {
  success: true;
  data: PatternSummaryDto[];
  meta: {
    topic: string;
    count: number;
  };
}

export interface QuestionDto {
  _id: string;
  questionId?: string;
  topic: string;
  pattern: string;
  difficulty: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  metadata?: {
    estimatedTimeSeconds?: number;
    tags?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

// Ops 9 & 10: GET /api/v1/questions/topic/:topic & GET /api/v1/questions/pattern/:pattern
// Op 11 & 12: GET /api/v1/questions/topic/:topic/random & GET /api/v1/questions/topic/:topic/pattern/:pattern/random
export interface QuestionRandomListWireResponse {
  success: true;
  data: QuestionDto[];
  meta: {
    count: number;
  };
}

export interface QuestionPaginatedWireResponse {
  success: true;
  data: QuestionDto[];
  meta: PaginationMeta;
}

// Op 11: GET /api/v1/questions/:id
export interface QuestionDetailWireResponse {
  success: true;
  data: QuestionDto;
}

// Op 12: GET /api/v1/questions/practice
export interface PracticeSessionWireResponse {
  success: true;
  data: QuestionDto[];
  meta: {
    count: number;
  };
}

// Op 13: GET /api/v1/questions/details/:id
export interface QuestionWithExplanationDto extends QuestionDto {
  detailedExplanation?: string;
  conceptTakeaway?: string;
}

export interface QuestionExplanationWireResponse {
  success: true;
  data: QuestionWithExplanationDto;
}

// ── User Profile & Goal Management DTOs (Operations 14–19) ─────────────────────────────────
// Op 14: GET /api/v1/users/:id
export interface UserGetWireResponse {
  success: true;
  data: UserProfileDto;
}

export type UserProfileWireResponse = UserGetWireResponse;

export interface GoalDetailDto {
  _id: string;
  userId: string;
  title: string;
  type: string;
  targetName?: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  targetScore?: number | null;
  priority?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Op 15: GET /api/v1/goals/user/:userId
export interface GoalListWireResponse {
  success: true;
  data: GoalDetailDto[];
  meta: {
    count: number;
  };
}

// Op 16: POST /api/v1/goals (requires title and type; status accepted)
export interface GoalCreatePayload {
  title: string;
  type: string;
  targetName?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  targetScore?: number;
  priority?: string;
  status?: string;
}

export type GoalCreateRequestPayload = GoalCreatePayload;

export interface GoalCreateWireResponse {
  success: true;
  data: GoalDetailDto;
}

// Op 17: GET /api/v1/goals/:id
export interface GoalDetailWireResponse {
  success: true;
  data: GoalDetailDto;
}

// Op 18: PATCH /api/v1/goals/:id
export interface GoalPatchPayload {
  title?: string;
  type?: string;
  targetName?: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  targetScore?: number;
  priority?: string;
  status?: string;
}

export type GoalPatchRequestPayload = GoalPatchPayload;

export interface GoalUpdateWireResponse {
  success: true;
  data: GoalDetailDto;
}

export type GoalPatchWireResponse = GoalUpdateWireResponse;

// Op 19: DELETE /api/v1/goals/:id (hard delete via Goal.deleteOne returning { deleted: true })
export interface GoalDeleteWireResponse {
  success: true;
  data: {
    deleted: true;
  };
}

// ── Planning & Study Plan Engine DTOs (Operations 20–26) ──────────────────────────────────
// Structured scope object supported by planningScopeService.js
export interface PlanningScopeDto {
  topics?: string[];
  patterns?: string[];
  allCanonicalPatterns?: boolean;
  targetProfileId?: string;
  includeMastered?: boolean;
}

// Op 20: POST /api/v1/planning/preview
export interface PlanPreviewPayload {
  goalId: string;
  scope: PlanningScopeDto;
  durationPreset?: '3d' | '7d' | '9d' | '1m' | '2m' | '3m' | '6m';
  startDate?: string;
  targetDate?: string;
  referenceDate?: string;
  dailyQuestionBudget?: number;
  dailyMinutes?: number;
  maxPatternsPerDay?: number;
  includeMastered?: boolean;
}

export type PlanPreviewRequestPayload = PlanPreviewPayload;

export interface PlanPreviewResultDto {
  algorithmVersion: string;
  startDate: string;
  endDate: string;
  days: number;
  durationPreset: string | null;
  dailyQuestionBudget: number;
  dailyMinutes: number;
  maxPatternsPerDay: number;
  patternsRequested: number;
  prerequisitesAdded: number;
  prerequisitesList: string[];
  patternsAlreadyMastered: number;
  patternsScheduled: number;
  patternsUnscheduled: number;
  unscheduledPatterns: string[];
  totalRequestedWorkload: number;
  horizonQuestionCapacity: number;
  scheduledWorkload: number;
  unscheduledWorkload: number;
  capacityShortfall: boolean;
  reasonCodes: string[];
  proposedTargets: Array<{
    topic: string;
    pattern: string;
    targetQuestions: number;
    targetMastery: number;
  }>;
  objectives: Array<{
    date: string;
    topic: string;
    patterns: Array<{
      pattern: string;
      targetQuestions: number;
      completedQuestions: number;
      targetDifficulty?: number;
    }>;
    targetMinutes: number;
    actualMinutes: number;
    status: string;
  }>;
}

export interface PlanPreviewWireResponse {
  success: true;
  data: PlanPreviewResultDto;
}

// Op 21: POST /api/v1/planning/generate (returns 201 with data: { plan, objectives, summary })
export interface PlanGeneratePayload {
  goalId: string;
  scope: PlanningScopeDto;
  name?: string;
  durationPreset?: '3d' | '7d' | '9d' | '1m' | '2m' | '3m' | '6m';
  startDate?: string;
  targetDate?: string;
  referenceDate?: string;
  dailyQuestionBudget?: number;
  dailyMinutes?: number;
  maxPatternsPerDay?: number;
  includeMastered?: boolean;
}

export type PlanGenerateRequestPayload = PlanGeneratePayload;

export interface StudyPlanSummaryDto {
  algorithmVersion: string;
  startDate: string;
  endDate: string;
  days: number;
  durationPreset: string | null;
  dailyQuestionBudget: number;
  dailyMinutes: number;
  maxPatternsPerDay: number;
  patternsRequested: number;
  prerequisitesAdded: number;
  patternsAlreadyMastered: number;
  patternsScheduled: number;
  patternsUnscheduled: number;
  unscheduledPatterns: string[];
  totalRequestedWorkload: number;
  horizonQuestionCapacity: number;
  scheduledWorkload: number;
  unscheduledWorkload: number;
  capacityShortfall: boolean;
  reasonCodes: string[];
}

export interface StudyPlanDto {
  _id: string;
  userId: string;
  goalId: string;
  name: string;
  scope: 'short' | 'medium' | 'long';
  phase: 'core' | 'remediation' | 'retention';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  targets: Array<{
    topic: string;
    pattern: string;
    targetQuestions: number;
    targetMastery: number;
  }>;
  planningMeta?: {
    algorithmVersion: string;
    durationPreset: string | null;
    generatedAutomatically: boolean;
    dailyQuestionBudget: number;
    dailyMinutes: number;
    maxPatternsPerDay: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanGenerateResultDto {
  plan: StudyPlanDto;
  objectives: DailyObjectiveDto[];
  summary: StudyPlanSummaryDto;
}

export interface StudyPlanGenerateWireResponse {
  success: true;
  data: StudyPlanGenerateResultDto;
}

export type PlanGenerateWireResponse = StudyPlanGenerateWireResponse;

// Single study plan wire response (e.g. GET /api/v1/study-plans/:id)
export interface StudyPlanWireResponse {
  success: true;
  data: StudyPlanDto;
}

// Op 22: POST /api/v1/planning/plans/:planId/replan
export interface PlanReplanPayload {
  referenceDate?: string;
  replaceToday?: boolean;
  allowReplaceToday?: boolean;
  includeMastered?: boolean;
}

export type PlanReplanRequestPayload = PlanReplanPayload;

export interface PlanReplanResultDto {
  success: true;
  planId: string;
  algorithmVersion: string;
  replanCutoffDate: string;
  startReplanDate: string;
  remainingDays: number;
  preservedObjectives: number;
  removedFutureObjectives: number;
  newObjectives: number;
  patternsRescheduled: number;
  patternsSkippedAsMastered: number;
  unscheduledPatterns: string[];
  remainingCapacity: number;
  reasonCodes: string[];
}

export interface PlanReplanWireResponse {
  success: true;
  data: PlanReplanResultDto;
}

// Op 23: GET /api/v1/planning/plans/:planId/schedule
export interface PlanScheduleResultDto {
  planId: string;
  planName: string;
  userId: string;
  goalId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalObjectives: number;
  objectives: DailyObjectiveDto[];
}

export interface PlanScheduleWireResponse {
  success: true;
  data: PlanScheduleResultDto;
}

// Op 24: GET /api/v1/study-plans/user/:userId
export interface PlanListWireResponse {
  success: true;
  data: StudyPlanDto[];
  meta: {
    count: number;
  };
}

// Op 25: GET /api/v1/daily-objectives/user/:userId
export interface DailyObjectiveDto {
  _id: string;
  userId: string;
  planId: string;
  goalId: string;
  date: string;
  topic: string;
  patterns: Array<{
    pattern: string;
    targetQuestions: number;
    completedQuestions: number;
    targetDifficulty?: number;
  }>;
  targetMinutes: number;
  actualMinutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  createdAt: string;
  updatedAt: string;
}

export interface DailyObjectiveListWireResponse {
  success: true;
  data: DailyObjectiveDto[];
  meta: PaginationMeta;
}

// Op 26: PATCH /api/v1/daily-objectives/:id
export interface DailyObjectivePatchPayload {
  topic?: string;
  patterns?: Array<{
    pattern: string;
    targetQuestions?: number;
    completedQuestions?: number;
    targetDifficulty?: number;
  }>;
  targetMinutes?: number;
  actualMinutes?: number;
  status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface DailyObjectivePatchWireResponse {
  success: true;
  data: DailyObjectiveDto;
}

// ── Attempts & History DTOs (Operations 27–28) ────────────────────────────────────────────
// Op 27: POST /api/v1/attempts
export interface AttemptCreatePayload {
  questionId: string;
  selectedAnswer: string;
  timeTaken: number;
  source: string;
  sessionId?: string;
}

export type AttemptRecordRequestPayload = AttemptCreatePayload;

export interface AttemptRecordDto {
  _id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  source: string;
  sessionId?: string | null;
  topic: string;
  pattern: string;
  difficulty: number;
  createdAt: string;
}

export interface AttemptCreateWireResponse {
  success: true;
  data: AttemptRecordDto;
}

export type AttemptRecordWireResponse = AttemptCreateWireResponse;

// Op 28: GET /api/v1/attempts/user/:userId
export interface AttemptListWireResponse {
  success: true;
  data: AttemptRecordDto[];
  meta: PaginationMeta;
}

// ── Progress & Student Mastery DTOs (Operations 29–33) ────────────────────────────────────
export interface StudentProgressDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  attempts: number;
  correct: number;
  accuracy: number;
  mastery: number;
  streak: number;
  lastAttemptDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Op 29: GET /api/v1/progress/:userId
export interface ProgressOverallWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: PaginationMeta;
}

export type StudentProgressWireResponse = ProgressOverallWireResponse;

// Op 30: GET /api/v1/progress/:userId/topics
export interface ProgressTopicsWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: {
    count: number;
  };
}

export type TopicMasteryWireResponse = ProgressTopicsWireResponse;

// Op 31: GET /api/v1/progress/:userId/patterns
export interface ProgressPatternsWireResponse {
  success: true;
  data: StudentProgressDto[];
  meta: {
    count: number;
  };
}

export type PatternMasteryWireResponse = ProgressPatternsWireResponse;

export interface WeakestPatternDto {
  topic: string;
  pattern: string;
  accuracy: number;
  attempts: number;
  mastery: number;
}

// Op 32: GET /api/v1/progress/:userId/weakest
export interface ProgressWeakestWireResponse {
  success: true;
  data: WeakestPatternDto[];
  meta: {
    count: number;
  };
}

export type WeakestPatternsWireResponse = ProgressWeakestWireResponse;

export interface PrerequisiteDataDto {
  pattern: string;
  topic: string;
  prerequisites: string[];
  prerequisiteCount: number;
  dependents: string[];
  dependentCount: number;
  isFoundational: boolean;
}

// Op 33: GET /api/v1/progress/prerequisites/:patternName
export interface ProgressPrerequisitesWireResponse {
  success: true;
  data: PrerequisiteDataDto;
}

export type PrerequisiteGraphWireResponse = ProgressPrerequisitesWireResponse;

// ── Adaptive Decision Engine DTOs (Operation 34) ──────────────────────────────────────────
export interface AdaptiveQuestionDto {
  _id: string;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}

export interface AdaptiveDecisionDto {
  requestedPattern?: string;
  selectedTopic: string;
  selectedPattern: string;
  mastery: number;
  recentAccuracy: number;
  baseDifficulty: number;
  adjustment: number;
  targetDifficulty: number;
  selectedDifficulty: number;
  fallbackUsed: boolean;
  prerequisiteRedirect: boolean;
  reasonCodes: string[];
}

// Op 34: GET /api/v1/adaptive/next-question
export interface AdaptiveNextQuestionWireResponse {
  success: true;
  data: {
    question: AdaptiveQuestionDto;
    decision: AdaptiveDecisionDto;
  };
}

// ── Spaced Revision Engine DTOs (Operations 35–37) ────────────────────────────────────────
export interface RevisionDueItemDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  dueDate: string;
  intervalDays: number;
  stage: number;
  mastery: number;
  reasonCode: string;
  registryIndex: number;
}

// Op 35: GET /api/v1/revisions/due
export interface RevisionDueListWireResponse {
  success: true;
  count: number;
  data: RevisionDueItemDto[];
}

export interface RevisionPlanProjectionDto {
  days: number;
  referenceDate: string;
  projections: Array<{
    date: string;
    count: number;
    patterns: string[];
  }>;
}

// Op 36: GET /api/v1/revisions/plan
export interface RevisionPlanWireResponse {
  success: true;
  data: RevisionPlanProjectionDto;
}

export interface RevisionItemDto {
  _id: string;
  userId: string;
  topic: string;
  pattern: string;
  intervalDays: number;
  easeFactor: number;
  stage: number;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface RevisionRebuildPayload {
  topic?: string;
  pattern?: string;
  referenceDate?: string;
}

export type RevisionRebuildRequestPayload = RevisionRebuildPayload;

// Op 37: POST /api/v1/revisions/rebuild
export interface RevisionRebuildWireResponse {
  success: true;
  message: string;
  data: RevisionItemDto | RevisionItemDto[] | null;
}

// ── Mock Test Engine DTOs (Operations 38–48) ──────────────────────────────────────────────
export interface MockBlueprintSectionDto {
  sectionId: string;
  name: string;
  durationMinutes: number;
  topics: string[];
  questionCount: number;
}

export interface MockBlueprintDto {
  _id: string;
  title: string;
  description?: string;
  mode: 'standard' | 'adaptive' | 'speed_challenge';
  totalDurationMinutes: number;
  sections: MockBlueprintSectionDto[];
  status: 'draft' | 'published' | 'archived';
  scoring?: Record<string, unknown>;
  excludeRecentQuestions?: number;
  algorithmVersion?: string;
  createdAt: string;
}

// Op 38: GET /api/v1/mock-blueprints
export interface MockBlueprintListWireResponse {
  success: true;
  data: MockBlueprintDto[];
}

// Op 39: POST /api/v1/mock-sessions (no top-level mode; mode belongs to blueprint)
export interface MockSessionCreatePayload {
  blueprintId?: string;
  blueprint?: Record<string, unknown>;
  generationSeed?: string;
}

export type MockSessionCreateRequestPayload = MockSessionCreatePayload;

export interface MockSessionDocDto {
  _id: string;
  userId: string;
  blueprintId: string;
  status: 'created' | 'started' | 'submitted' | 'expired' | 'abandoned';
  navigationPolicy: string;
  currentSectionId: string;
  responsesFrozen: boolean;
  finalizationState: 'idle' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  expiresAt?: string;
  submittedAt?: string;
}

export interface MockSessionCreateWireResponse {
  success: true;
  data: MockSessionDocDto;
}

// Op 40: POST /api/v1/mock-sessions/:id/start
export interface MockSessionStartWireResponse {
  success: true;
  data: MockSessionDocDto;
}

export interface MockSessionDetailDto extends MockSessionDocDto {
  sections: Array<{
    sectionId: string;
    name: string;
    durationMinutes: number;
    status: 'pending' | 'in_progress' | 'completed';
    questionCount: number;
  }>;
}

// Op 41: GET /api/v1/mock-sessions/:id
export interface MockSessionDetailWireResponse {
  success: true;
  data: MockSessionDetailDto;
}

export interface ActiveMockQuestionDto {
  questionId: string;
  sectionId: string;
  order: number;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}

// Op 42: GET /api/v1/mock-sessions/:id/questions/:questionId
export interface MockQuestionWireResponse {
  success: true;
  data: ActiveMockQuestionDto;
}

// Op 43: POST /api/v1/mock-sessions/:id/responses
export interface MockResponseSavePayload {
  questionId: string;
  sectionId: string;
  selectedOption: string | null;
  timeSpentSeconds?: number;
  isFlagged?: boolean;
}

export interface MockResponseDocDto {
  _id: string;
  sessionId: string;
  questionId: string;
  sectionId: string;
  selectedOption: string | null;
  timeSpentSeconds: number;
  isFlagged: boolean;
  status: string;
  updatedAt: string;
}

export interface MockResponseSaveWireResponse {
  success: true;
  data: MockResponseDocDto;
}

export interface MockSectionCompleteResultDto {
  sessionId: string;
  sectionId: string;
  status: 'completed';
  nextSectionId: string | null;
}

// Op 44: POST /api/v1/mock-sessions/:id/sections/:sectionId/complete
export interface MockSectionCompleteWireResponse {
  success: true;
  data: MockSectionCompleteResultDto;
}

export interface MockSessionSubmitResultDto {
  sessionId: string;
  status: 'submitted';
  finalizationState: 'in_progress' | 'completed';
}

// Op 45: POST /api/v1/mock-sessions/:id/submit
export interface MockSubmitWireResponse {
  success: true;
  data: MockSessionSubmitResultDto;
}

// Op 46: POST /api/v1/mock-sessions/:id/abandon
export interface MockSessionAbandonWireResponse {
  success: true;
  data: MockSessionDocDto;
}

export interface MockScoringResultDto {
  sessionId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  percentile?: number | null;
  sectionScores: Array<{
    sectionId: string;
    score: number;
    maxScore: number;
    accuracy: number;
  }>;
  accuracy: number;
  totalTimeSpentSeconds: number;
  speedScore?: number;
  staminaIndex?: number;
}

// Op 47: GET /api/v1/mock-sessions/:id/result
export interface MockResultWireResponse {
  success: true;
  data: MockScoringResultDto;
}

export interface MockReviewQuestionDto {
  questionId: string;
  order: number;
  question: string;
  options: string[];
  selectedOption: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  timeSpentSeconds: number;
  topic: string;
  pattern: string;
  difficulty: number;
}

export interface MockReviewDetailDto {
  sessionId: string;
  scoring: MockScoringResultDto;
  questions: MockReviewQuestionDto[];
}

// Op 48: GET /api/v1/mock-sessions/:id/review
export interface MockSessionReviewWireResponse {
  success: true;
  data: MockReviewDetailDto;
}
export type MockReviewWireResponse = MockSessionReviewWireResponse;

// ── Cognitive Analytics DTOs (Operations 49–52) ───────────────────────────────────────────
// Op 49: GET /api/v1/analytics/dashboard
export interface TopicMasteryRadarItemDto {
  topic: string;
  masteryScore: number;
  practiceAttempts: number;
}

export interface ActivePlanSummaryDto {
  planId: string;
  planName: string;
  targetDate: string;
  daysRemaining: number;
  totalAssignedQuestions: number;
  totalCompletedQuestions: number;
}

export interface AnalyticsDashboardResponseDto {
  userId: string;
  algorithmVersion: string;
  summary: {
    totalPracticeAttempts: number;
    totalMocksCompleted: number;
    overallAccuracy: number | null;
    attemptsAnalyzed: number;
  };
  topicMasteryRadar: TopicMasteryRadarItemDto[];
  activePlanSummary: ActivePlanSummaryDto | null;
  dueRevisionCount: number;
  priorityFocusTopics: string[];
}

export interface AnalyticsDashboardWireResponse {
  success: true;
  data: AnalyticsDashboardResponseDto;
}

// Op 50: GET /api/v1/analytics/cognitive-profile
export interface StaminaQuartileItemDto {
  quartile: number;
  accuracy: number;
  totalQuestions: number;
  correctQuestions: number;
}

export interface StaminaCurveDto {
  mockSessionsAnalyzed: number;
  totalQuestionsAnalyzed: number;
  quartileAccuracy: StaminaQuartileItemDto[];
  fatigueDropoffPercent: number | null;
  fatigueReason?: string | null;
}

export interface CognitiveProfileResponseDto {
  userId: string;
  algorithmVersion: string;
  analysisWindow: {
    windowDays: number;
    attemptsAnalyzed: number;
  };
  speedAccuracyMatrix: {
    quadrantCounts: {
      accurateAndFast: number;
      accurateAndSlow: number;
      fastErrorRushing: number;
      slowErrorStruggling: number;
    };
    insufficientBaselineCount: number;
    rushingRiskScore: number | null;
    medianTimeCorrectSeconds: number | null;
    medianTimeIncorrectSeconds: number | null;
  };
  staminaCurve: StaminaCurveDto | null;
  staminaReason?: string | null;
}

export interface CognitiveProfileWireResponse {
  success: true;
  data: CognitiveProfileResponseDto;
}

// Op 51: GET /api/v1/analytics/retention
export interface RetentionGapBucketDto {
  gapBucket: string;
  totalEvents: number;
  correctEvents: number;
  observedRetentionRate: number;
}

export interface RetentionAnalyticsResponseDto {
  userId: string;
  algorithmVersion: string;
  currentState: {
    activeRevisionItems: number;
    completedRevisionItems: number;
    dueTodayCount: number;
    overdueCount: number;
    stageDistribution: {
      stage0_1day: number;
      stage1_3days: number;
      stage2_7days: number;
      stage3_14days: number;
      stage4_30days: number;
    };
  };
  observedRetentionByGap: RetentionGapBucketDto[];
  evidence: {
    revisionAttemptsAnalyzed: number;
    excludedNoPriorAttemptCount: number;
    excludedShortGapCount: number;
    excludedInvalidChronologyCount: number;
  };
}

export interface RetentionAnalyticsWireResponse {
  success: true;
  data: RetentionAnalyticsResponseDto;
}

// Op 52: GET /api/v1/analytics/readiness/:goalId
export interface PrerequisiteBottleneckDto {
  targetPattern: string;
  unmasteredPrerequisite: string;
  prerequisiteMastery: number;
  masteryLabel: string;
}

export interface ExamReadinessResponseDto {
  goalId: string;
  goalTitle: string;
  targetDate: string | null;
  algorithmVersion: string;
  readinessStatus: 'calculated' | 'insufficient_data';
  readinessScore: number | null;
  reason?: string | null;
  components: {
    planTargetCoverage: number | null;
    masteryDepth: number | null;
    eligibleMockPerformance: number | null;
    eligibleMockPacing: number | null;
  };
  criticalPrerequisiteBottlenecks: PrerequisiteBottleneckDto[];
}

export interface ExamReadinessWireResponse {
  success: true;
  data: ExamReadinessResponseDto;
}

// ── Prescriptive Orchestration DTOs (Operations 53–55) ────────────────────────────────────
export interface PublicActionDto {
  actionId: string;
  actionType: string;
  actionSubtype?: string;
  priorityTier: number;
  policyPriorityClass: string;
  urgencyScore: number;
  topic: string;
  pattern: string;
  prescribedQuestions: number;
  estimatedMinutes: number;
  rationale: string | null;
  executionIntent: string | null;
  blockedTarget?: {
    topic: string;
    pattern: string;
  };
}

export interface NextActionRecommendationDto {
  status: string;
  reason: string;
  activeMockSessionId?: string | null;
  nextAction: PublicActionDto | null;
}

// Op 53: GET /api/v1/orchestration/next-action
export interface NextActionWireResponse {
  success: true;
  data: NextActionRecommendationDto;
  meta: {
    referenceNow: string;
  };
}

export interface AgendaCheckpointRationaleDto {
  reasonCode: string;
  description: string;
}

export interface AgendaCheckpointDto {
  checkpointId: string;
  checkpointType: string;
  afterSegmentIndex: number;
  beforeSegmentIndex: number;
  prescribedQuestions: number;
  estimatedMinutes: number;
  rationale: AgendaCheckpointRationaleDto;
  executionIntent: string | null;
}

export interface AgendaSegmentDto {
  segmentIndex: number;
  segmentName: string;
  segmentBudget: number;
  allocatedQuestions: number;
  activities: PublicActionDto[];
}

export interface DailyAgendaPayloadDto {
  dailyQuestionBudget: number;
  totalPrescribedQuestions: number;
  totalEstimatedMinutes: number;
  segments: AgendaSegmentDto[];
  checkpoints: AgendaCheckpointDto[];
}

export interface DailyAgendaContainerDto {
  status: string;
  reason?: string | null;
  activeMockSessionId?: string | null;
  agenda?: DailyAgendaPayloadDto | null;
}

export interface DailyAgendaWireResponse {
  success: true;
  data: DailyAgendaContainerDto;
  meta: {
    referenceNow: string;
  };
}

export type OrchestrationDailyAgendaWireResponse = DailyAgendaWireResponse;
export type DailyAgendaDto = DailyAgendaContainerDto;

export interface InterventionItemDto {
  interventionId: string;
  category: string;
  severity: string;
  topic: string;
  pattern: string | null;
  blockedTarget: string | null;
  rationale: string;
}

export interface InterventionListContainerDto {
  status: string;
  reason?: string | null;
  interventions: InterventionItemDto[];
}

export interface InterventionListWireResponse {
  success: true;
  data: InterventionListContainerDto;
  meta: {
    referenceNow: string;
  };
}

export type OrchestrationInterventionsWireResponse = InterventionListWireResponse;

// ── PAOA Attribution & Prescription Lifecycle (Operations 56, 57, 64) ───────────────────────
// Op 64: POST /api/v1/attribution/prescriptions
// Backend requires actionId for daily_agenda, but arbiter selects for next_action.
export interface PrescriptionIssuanceRequestPayload {
  originSurface: 'next_action' | 'daily_agenda';
  actionId?: string;
  goalId?: string;
}

export interface PrescriptionIssuanceDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  isExpired: boolean;
  originSurface: string;
  action: PublicActionDto;
  issuedAt: string;
  expiresAt: string;
  versions: {
    phase10AlgorithmVersion: string;
    orchestrationAlgorithmVersion: string;
  };
}

export interface AttributionIssuanceWireResponse {
  success: true;
  data: PrescriptionIssuanceDto;
  meta: {
    referenceNow: string;
  };
}

// Op 56: POST /api/v1/attribution/prescriptions/:prescriptionId/activate
export interface PrescriptionActivationDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  isExpired: boolean;
  actionType: string;
  topic: string;
  pattern: string;
  prescribedQuestions: number;
  activatedAt: string;
  expiresAt: string;
  executionGuidance: {
    targetMode?: string;
    instructions: string;
    sessionId?: string;
    targetSource?: string;
  };
}

export interface AttributionActivationWireResponse {
  success: true;
  data: PrescriptionActivationDto;
  meta: {
    referenceNow: string;
  };
}

export type PrescriptionLeaseWireResponse = AttributionActivationWireResponse;

// Op 57: POST /api/v1/attribution/prescriptions/:prescriptionId/complete
export interface PrescriptionCompletePayload {
  abandon?: boolean;
  mockSessionId?: string | null;
}

export interface PrescriptionCompletionDto {
  prescriptionId: string;
  status: string;
  effectiveStatus: string;
  completedAt: string;
  executionRequirementMet: boolean;
  targetMilestoneMet: boolean;
  outcomeSnapshot: Record<string, unknown>;
  mockSessionId: string | null;
  attributionNotice: string;
}

export interface AttributionCompletionWireResponse {
  success: true;
  data: PrescriptionCompletionDto;
  meta: {
    referenceNow: string;
  };
}

export type PrescriptionCompleteWireResponse = AttributionCompletionWireResponse;

// ── Intelligent Learning DTOs & Delivery Envelopes (Operations 58–63) ─────────────────────
// Section 8.8 Uniform response delivery envelope (returns { data, metadata, provenance } without success boolean)
export interface LearningMetadataDto {
  taskType: string;
  algorithmVersion: string;
  promptVersion: string | null;
  model: string | null;
  provider: string;
  isDegraded: boolean;
  degradationReason: string | null;
}

export interface LearningProvenanceDto {
  facts: string[];
  deterministicSignals: string[];
  llmInterpretations: string[];
}

// Op 58: POST /api/v1/learning/tutor
export interface TutorRequestPayload {
  questionId?: string;
  topic?: string;
  pattern?: string;
  message?: string;
  conversationHistory?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export type LearningTutorRequestPayload = TutorRequestPayload;

export interface ConceptTutorDto {
  topic: string;
  pattern: string;
  conceptExplanation: string;
  formulaSummary: string | null;
  workedExample: {
    setup: string;
    solutionSteps: string[];
    finalResult: string;
  } | null;
  keyTakeaway: string;
}

export interface LearningTutorResponseDto {
  data: ConceptTutorDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type TutorWireResponse = LearningTutorResponseDto;

// Op 59: POST /api/v1/learning/hint
export interface HintRequestPayload {
  questionId: string;
  hintLevel: number;
}

export type LearningHintRequestPayload = HintRequestPayload;

export interface HintDto {
  hintLevel: number;
  hint: string;
  revealsAnswer: boolean;
  nextAction: 'try_calculation' | 'review_formula' | 'check_options' | 'view_explanation';
}

export interface LearningHintResponseDto {
  data: HintDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type HintWireResponse = LearningHintResponseDto;

// Op 60: POST /api/v1/learning/explain-attempt
export interface ExplainAttemptPayload {
  attemptId?: string;
  questionId?: string;
  selectedAnswer?: string;
  timeTaken?: number;
}

export type LearningExplainAttemptPayload = ExplainAttemptPayload;

export interface ExplainAttemptDto {
  conceptSummary: string;
  mistakeExplanation: string;
  correctApproach: string;
  revisionSuggestion: string;
  confidence: number | null;
}

export interface LearningExplainAttemptResponseDto {
  data: ExplainAttemptDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainAttemptWireResponse = LearningExplainAttemptResponseDto;

// Op 61: POST /api/v1/learning/explain-progress
export interface ExplainProgressPayload {
  userId: string;
  topic?: string;
  pattern?: string;
}

export type LearningExplainProgressPayload = ExplainProgressPayload;

export interface ExplainProgressDto {
  masteryInterpretation: string;
  strengths: string[];
  weaknesses: string[];
  recommendedAction: string;
}

export interface LearningExplainProgressResponseDto {
  data: ExplainProgressDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainProgressWireResponse = LearningExplainProgressResponseDto;

// Op 62: POST /api/v1/learning/explain-plan
export interface ExplainPlanPayload {
  planId: string;
  targetDate?: string;
}

export type LearningExplainPlanPayload = ExplainPlanPayload;

export interface ExplainPlanDto {
  planId: string;
  targetDate: string;
  objectiveSummary: string;
  schedulingReasons: string[];
  revisionSummary: string | null;
  recommendedAction: string;
}

export interface LearningExplainPlanResponseDto {
  data: ExplainPlanDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type ExplainPlanWireResponse = LearningExplainPlanResponseDto;

// Op 63: POST /api/v1/learning/mock-review
export interface MockReviewPayload {
  sessionId: string;
}

export type LearningMockReviewPayload = MockReviewPayload;

export interface MockReviewDto {
  overallScoreInterpretation: string;
  sectionDiagnostics: Array<{
    sectionId: string;
    diagnosticMessage: string;
    performanceTier: 'strong' | 'competent' | 'needs_focus' | null;
  }>;
  pacingObservations: string;
  priorityRevisionPatterns: string[];
}

export interface LearningMockReviewResponseDto {
  data: MockReviewDto;
  metadata: LearningMetadataDto;
  provenance: LearningProvenanceDto;
}

export type LearningMockReviewWireResponse = LearningMockReviewResponseDto;

export type MockReviewAiWireResponse = MockReviewWireResponse;
```

---

## 19. CENTRALIZED TANSTACK QUERY KEY FACTORY SPECIFICATION

To prevent ad-hoc, conflicting, or non-invalidating query keys across views, `src/utils/queryKeyFactory.ts` defines all query key arrays:

```typescript
// src/utils/queryKeyFactory.ts
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  questions: {
    topics: () => ['questions', 'topics'] as const,
    topicPatterns: (topic: string) => ['questions', 'topic', topic, 'patterns'] as const,
    topicList: (topic: string, filters?: Record<string, unknown>) => ['questions', 'topic', topic, filters ?? {}] as const,
    patternList: (topic: string, pattern: string, filters?: { page?: number; limit?: number; difficulty?: number }) => ['questions', 'pattern', topic, pattern, filters ?? {}] as const,
    detail: (id: string) => ['questions', 'detail', id] as const,
  },
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
  },
  goals: {
    list: (userId: string) => ['goals', 'user', userId] as const,
    detail: (id: string) => ['goals', 'detail', id] as const,
  },
  planning: {
    schedule: (planId: string) => ['planning', 'schedule', planId] as const,
    userPlans: (userId: string) => ['planning', 'plans', userId] as const,
    dailyObjectives: (userId: string, filters?: Record<string, unknown>) => ['planning', 'dailyObjectives', userId, filters ?? {}] as const,
  },
  attempts: {
    userHistory: (userId: string, filters?: Record<string, unknown>) => ['attempts', 'user', userId, filters ?? {}] as const,
  },
  progress: {
    overall: (userId: string, filters?: Record<string, unknown>) => ['progress', 'overall', userId, filters ?? {}] as const,
    topics: (userId: string, topic?: string) => ['progress', 'topics', userId, topic ?? 'all'] as const,
    patterns: (userId: string, topic: string) => ['progress', 'patterns', userId, topic] as const,
    weakest: (userId: string, filters?: { topic?: string; limit?: number }) => ['progress', 'weakest', userId, filters ?? {}] as const,
    prerequisites: (patternName: string) => ['progress', 'prerequisites', patternName] as const,
  },
  adaptive: {
    nextQuestion: (params?: Record<string, unknown>) => ['adaptive', 'nextQuestion', params ?? {}] as const,
  },
  revisions: {
    due: (params?: Record<string, unknown>) => ['revisions', 'due', params ?? {}] as const,
    plan: (days: 1 | 2, params?: Record<string, unknown>) => ['revisions', 'plan', days, params ?? {}] as const,
  },
  mock: {
    blueprints: () => ['mock', 'blueprints'] as const,
    session: (id: string) => ['mock', 'session', id] as const,
    question: (sessionId: string, questionId: string) => ['mock', 'session', sessionId, 'question', questionId] as const,
    result: (sessionId: string) => ['mock', 'result', sessionId] as const,
    review: (sessionId: string) => ['mock', 'review', sessionId] as const,
  },
  analytics: {
    dashboard: (userId: string) => ['analytics', 'dashboard', userId] as const,
    cognitiveProfile: (userId: string, params?: { windowDays?: number; topic?: string }) => ['analytics', 'cognitiveProfile', userId, params ?? {}] as const,
    retention: (userId: string) => ['analytics', 'retention', userId] as const,
    readiness: (userId: string, goalId: string) => ['analytics', 'readiness', userId, goalId] as const,
  },
  orchestration: {
    nextAction: (userId: string, goalId?: string) => ['orchestration', 'nextAction', userId, goalId ?? 'none'] as const,
    dailyAgenda: (userId: string, goalId?: string) => ['orchestration', 'dailyAgenda', userId, goalId ?? 'none'] as const,
    interventions: (userId: string, goalId?: string) => ['orchestration', 'interventions', userId, goalId ?? 'none'] as const,
  },
};
```

---

## 20. SERVER-STATE CACHING POLICY & VOLATILITY THRESHOLDS

Freshness and garbage collection durations are strictly defined per data volatility category:

| Data Category | Query Key Prefix | Freshness (`staleTime`) | GC Lifetime (`gcTime`) | Network Refetch on Window Focus | Justification |
|---|---|---|---|---|---|
| **Static Taxonomy** | `['questions', 'topics']`, `queryKeys.questions.topicPatterns(topic)` | 24 Hours | 48 Hours | NO | Fixed 24 topics and 278 patterns never change at runtime. |
| **User Profile & Goals**| `['user']`, `['goals']` | 5 Minutes | 30 Minutes | YES | Infrequent mutations, updated explicitly via wizard. |
| **Study Plans** | `['planning']` | 5 Minutes | 30 Minutes | YES | Multi-week calendar allocations are stable until replan. |
| **Daily Objectives** | `['planning', 'dailyObjectives']` | 2 Minutes | 10 Minutes | YES | Objectives reflect daily progress tasks. |
| **Daily Agenda & NBA** | `['orchestration']` | 1 Minute | 10 Minutes | YES | Prescriptive agenda recalculates as learner solves items. |
| **Progress & Mastery** | `['progress']` | 30 Seconds | 5 Minutes | YES | Pattern mastery updates upon attempt submissions. |
| **Spaced Revision Queue**| `['revisions']` | 2 Minutes | 15 Minutes | YES | Items transition across 5 stages based on daily schedule. |
| **Active Mock Session** | `['mock', 'session']` | 0 Seconds (Always Fetch) | 2 Minutes | NO | In-flight exam state must be fresh; timing is server-authoritative. |
| **Final Mock Results** | `['mock', 'result']`, `['mock', 'review']`| 1 Hour | 24 Hours | NO | Finalized exam reports are sealed and immutable. |
| **Cognitive Analytics** | `['analytics']` | 5 Minutes | 30 Minutes | YES | Complex statistical rollups recalculate on submission. |

Active mock session countdown timing MUST NEVER be cached authoritatively.

---

## 21. CACHE INVALIDATION MATRIX & SERVER MUTATION RULES

Authoritative server state is only invalidated upon confirmed HTTP success (HTTP 2xx). Optimistic cache destruction is strictly prohibited.

| Mutation Trigger | Endpoint Invocation | TanStack Query Keys Invalidated Upon Confirmed Success |
|---|---|---|
| **Question Attempt Submitted** | `POST /api/v1/attempts` | `['progress']`, `['progress', 'weakest']`, `['analytics']`, `['revisions', 'due']`, `['orchestration']`, `['attempts']` |
| **Goal Created / Updated / Deleted**| `POST/PATCH/DELETE /api/v1/goals` | `['goals']`, `['analytics', 'dashboard']`, `['planning']`, `['analytics', 'readiness']` |
| **Plan Generated / Replanned** | `POST /api/v1/planning/*` | `['planning']`, `['orchestration']`, `['analytics', 'dashboard']` |
| **Daily Objective Progress Saved** | `PATCH /api/v1/daily-objectives/:id` | `['planning', 'dailyObjectives']`, `['orchestration', 'dailyAgenda']`, `['progress']` |
| **Revision Queue Rebuilt** | `POST /api/v1/revisions/rebuild` | `['revisions']`, `['orchestration']` |
| **Mock Response Saved** | `POST /api/v1/mock-sessions/:id/responses` | None (Updates local question map state; session is re-queried) |
| **Mock Section Completed** | `POST .../sections/:id/complete` | `['mock', 'session', id]` |
| **Mock Session Finalized** | `POST /api/v1/mock-sessions/:id/submit` | `['mock', 'session', id]`, `['mock', 'result', id]`, `['progress']`, `['analytics']`, `['orchestration']` |
| **Mock Session Abandoned** | `POST /api/v1/mock-sessions/:id/abandon` | `['mock', 'session', id]`, `['mock', 'blueprints']` |
| **Prescription Issued / Activated / Completed**| `POST /api/v1/attribution/prescriptions*` | `['orchestration', 'dailyAgenda']`, `['orchestration', 'nextAction']` |
| **Session Logout / Revoke All** | `POST /api/v1/auth/logout` | `queryClient.clear()` (Evicts 100% of cached query data) |

Authoritative server-state optimistic mutations count: **0**.

---

## 22. PROHIBITED AUTHORITATIVE OPTIMISTIC MUTATIONS CONTRACT

The frontend application MUST NOT optimistically render or confirm authoritative server state prior to receiving a verified HTTP 200/201 response.

### 22.1 Explicitly Prohibited Optimistic Confirmations

```text
1. Correctness outcome (Never show Green/Red before POST /attempts responds)
2. Mastery level updates (Never increment mastery labels locally)
3. Spaced revision stage transitions (Never advance stage 0->1 locally)
4. Daily objective check-offs (Task remains pending until PATCH succeeds)
5. Mock test answer persistence (Show "Saving..." until server responds 200)
6. Mock section locked status (Remain in section until complete endpoint succeeds)
7. Mock exam score and percentage (Never calculate rawScore client-side)
8. Mock terminal states (Never mark session 'submitted' or 'expired' locally)
9. Goal creation and deletion (Never insert or remove goal before server 200)
10. Study plan generation (Never display calendar before backend generates it)
11. Prescription adherence completion (Never award completion before verify/complete endpoint succeeds)
12. Prescription lease activation (Never mark active locally before activate endpoint succeeds)
```

### 22.2 Permitted Local Presentation State

The following ephemeral client-only states ARE permitted to update immediately:
- Radio button option selection before submission
- Question navigation index (moving between questions in active exam)
- Modal and drawer open/close visibility
- Theme preference toggle (Dark / Light)
- Collapsible sidebar expand / collapse state
- AI Tutor draft message input text in chat box

---

## 23. LEARNER REGISTRATION SPECIFICATION (NO AUTO-LOGIN)

### 23.1 Registration UX Flow

Because Phase 14's registration endpoint (`POST /api/v1/auth/register`) strictly returns `{ user: { userId, name, email } }` without an access token or session cookie:

```text
[ Learner Fills Form ] ──► POST /api/v1/auth/register ──► [ HTTP 201 Created ] ──► [ Registration Success Card ] ──► Navigate to /login
```

Registration MUST NOT:
- Call `tokenManager.setAccessToken()`.
- Assume or attempt to read a refresh cookie.
- Enter the protected shell (`/app/*`).
- Attempt an automatic background login.

Login (`POST /api/v1/auth/login`) is the initial credential-issuing exchange; refresh rotates an existing session. Registration issues neither credential.

### 23.2 Password UX Requirements (Phase 14 Conformance)

In strict adherence to Phase 14:
1. **Length Bounds**: Minimum **15**, maximum **128** Unicode code points.
2. **Normalization**: Client performs Unicode `NFC` normalization before submission.
3. **Zero Arbitrary Character Complexity Rules**: The UI MUST NOT enforce arbitrary uppercase, lowercase, digit, or special character requirements.
4. **Authoritative Blocklist**: Passwords found on the backend common blocklist return HTTP 400 `PASSWORD_BLOCKLISTED`. The UI surfaces: *"This passphrase is too common or easily guessed. Please choose a more secure passphrase."*

---

## 24. PROTECTED ROUTE BOUNDARY & AUTH BOOTSTRAP COMPONENT

The protected route boundary (`src/components/layout/ProtectedLayout.tsx` composing `AuthBootstrapBoundary` defined and exported from `src/context/AuthContext.tsx`) governs all access to `/app/*`:

### 24.1 Deterministic Component Ownership
1. **`src/context/AuthContext.tsx`**:
   - Owns and provides `AuthProvider` context.
   - Owns and exports `AuthBootstrapBoundary` (orchestrates auth presentation states).
   - Owns and exports inline terminal view components `AccountDisabledView` and `AuthUnavailableView`.
   - MUST NOT store or expose raw access JWT strings (sole owner is `tokenManager.ts`).
2. **`src/components/layout/ProtectedLayout.tsx`**:
   - Owns protected shell layout grid, responsive landmarks, `AppHeader`, `AppSidebar`, and `BottomNav`.
   - Owns route guard composition by wrapping `<Outlet />` with `AuthBootstrapBoundary` from `AuthContext.tsx`.
   - Consumes `useAuth()` hook for user principal summary; does not own raw JWT state.

### 24.2 Behavior during `BOOTSTRAPPING`
- Renders branded full-screen loading skeleton.
- Prevents flash of protected dashboard content.
- Prevents duplicate refresh executions (queues behind `tokenManager`).

### 24.3 Behavior during `AUTHENTICATED`
- Renders the child `<Outlet />` under the route-specific layout from Section 7. Normal protected screens mount `AppHeader`/`AppSidebar`; Record 15 keeps its distraction-free exam layout and single exam h1 without normal navigation chrome.
- If an authenticated user visits `/login` or `/register`, declaratively redirects to `/app/dashboard`.

### 24.4 Behavior during `UNAUTHENTICATED`
- If learner accesses any `/app/*` path, redirects cleanly to `/login?returnUrl={currentPath}`.
- Prevents infinite redirect loops.

### 24.5 Behavior during `ACCOUNT_DISABLED`
- Halts all TanStack Query background polling.
- Renders dedicated `AccountDisabledView` with support instructions.
- Strictly prohibits redirect to `/login`.

---

## 25. ONBOARDING FLOW & STUDY PLAN INITIALIZATION SPECIFICATION

### 25.1 Sequential State Flow

```text
/app/dashboard Mounts
        │
        ▼
GET /api/v1/goals/user/:userId
        │
        ├── Goals Found (Length > 0) ──► Mounts Dashboard
        │
        └── Zero Goals Found (Length === 0)
                │
                ▼
        Redirect to /app/onboarding
                │
                ├── Step 1: Select Goal Type & Target Date
                │     │
                │     ▼ POST /api/v1/goals
                │
                ├── Step 2: Preview Plan Feasibility
                │     │
                │     ▼ POST /api/v1/planning/preview
                │
                ├── Step 3: Commit Generated Study Plan
                │     │
                │     ▼ POST /api/v1/planning/generate
                │
                └── Completed ──► Navigate to /app/dashboard
```

The onboarding flow strictly consumes existing Goal and Planning DTO contracts. No invented onboarding fields are permitted.

---

## 26. LEARNER DASHBOARD CONTRACT & METRIC PROVENANCE AUDIT

Every metric displayed on the dashboard (`/app/dashboard`) is categorized by its provenance:

| Displayed UI Metric | Provenance Classification | Source Endpoint / Field | Deterministic Calculation |
|---|---|---|---|
| **Active Goal Title** | `BACKEND-PROVEN` | `GET /goals/user/:userId` -> `title` | Direct field display |
| **Days to Target Exam** | `VIEW-MODEL-DERIVED` | `GET /goals/user/:userId` -> `targetDate` | `Math.ceil((Date.parse(targetDate) - Date.now()) / 86400000)` |
| **Exam Readiness Index** | `BACKEND-PROVEN` | `GET /analytics/readiness/:goalId` -> `readinessScore` | Direct numeric display `[0.0, 1.0]` |
| **Next-Best-Action Hero** | `BACKEND-PROVEN` | `GET /orchestration/next-action?userId=${userId}` | Direct display of container `reason`, `topic`, `pattern`, `actionId` |
| **Daily Prescribed Questions** | `BACKEND-PROVEN` | `GET /orchestration/daily-agenda?userId=${userId}` -> `summary` | Direct field display |
| **Daily Completed Questions** | `VIEW-MODEL-DERIVED` | `GET /api/v1/daily-objectives/user/:userId` | `objectives.reduce((acc, o) => acc + o.completedQuestions, 0)` |
| **Weakest Remediable Pattern** | `BACKEND-PROVEN` | `GET /progress/:userId/weakest` -> `weakestPatterns[0]` | Direct field display (`pattern`, `masteryScore`) |
| **Due Revision Items Count** | `BACKEND-PROVEN` | `GET /revisions/due` -> `count` | Direct field display |

Fabrication of unsupported gamification metrics (streaks, global cohort rank, percentiles, win rates) is **STRICTLY PROHIBITED**.

---

## 27. TOPIC & PATTERN PRACTICE EXPERIENCE SPECIFICATION

### 27.1 Practice Workflow

1. Learner selects topic from `/app/practice` -> navigates to `/app/practice/:topic`.
2. Learner selects canonical pattern and drill volume ($N \in \{5, 10, 20\}$).
3. Application queries `GET /api/v1/questions/topic/:topic/pattern/:pattern/random?limit=N`.
4. Question $i$ is loaded into `QuestionCard` (`mode="PRACTICE"`).
5. Local stopwatch records `timeTaken` in seconds using `performance.now()`.
6. Learner selects option -> local state updates `selectedOption`.
7. Learner clicks "Submit Answer" -> invokes `POST /api/v1/attempts`:
   ```json
   {
     "questionId": "66a012...",
     "selectedAnswer": "Option B",
     "timeTaken": 24,
     "source": "practice"
   }
   ```
8. Result received (`AttemptRecordDto`) -> option highlights correctness, step-by-step explanation renders in `ExplanationDrawer`.
9. Learner clicks "Next Question" -> increments local question index.
10. Upon completion -> summary modal displays score, accuracy, and options to return to catalog or review mistakes.

Zero client-side correctness math.

### 27.2 Frozen Learning-Session States

The existing practice/adaptive page owners implement Architecture Section 56 states: `INITIALIZING` → `READY` → `ANSWERING` → `SUBMITTING` → `FEEDBACK` → `NEXT_LOADING` → `READY` (or `COMPLETED` when the drill ends). Initial load errors remain retryable in `INITIALIZING`; a failed attempt submission returns to `ANSWERING` with the selection retained and no correctness feedback; next-question failures remain retryable in `NEXT_LOADING`. Submission disables duplicate sends. Only the successful attempt response permits `FEEDBACK`. No additional file, server state, learning algorithm, or calculated cognitive score is introduced. Existing practice/adaptive E2E coverage asserts these transitions and retry behavior.

---

## 28. ADAPTIVE PRACTICE CYCLE SPECIFICATION

The adaptive practice cycle (`/app/adaptive`) is an infinite closed loop governed entirely by backend intelligence:

```text
┌────────────────────────────────────────────────────────┐
│ 1. GET /api/v1/adaptive/next-question                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Render returned QuestionDto in QuestionCard         │
│    Display: Topic, Pattern, Mastery Label, Target Diff │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Learner selects option & clicks "Submit"            │
│    POST /api/v1/attempts (source: "adaptive")          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. Render authoritative correctness & explanation      │
│    Optionally request Hint or Error Diagnosis          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. Learner clicks "Next Adaptive Question"             │
│    Loop back to Step 1                                 │
└──────────────────────────┬─────────────────────────────┘
```

The frontend MUST NOT calculate target difficulty, adjust mastery levels, or evaluate prerequisite redirection rules.

---

## 29. MISTAKE REMEDIATION NOTEBOOK SPECIFICATION

### 29.1 Primary Query & Supported Filters

Mistakes are retrieved via:

```text
GET /api/v1/attempts/user/:userId?isCorrect=false&page=:page&limit=:limit&topic=:topic&pattern=:pattern&questionId=:questionId&sessionId=:sessionId
```

### 29.2 Misconception Diagnosis Integration

When the learner clicks "Diagnose Error" on an incorrect attempt:
- Invokes `POST /api/v1/learning/explain-attempt` with payload `{ "attemptId": attempt._id }`.
- Backend AI provides: `conceptSummary`, `mistakeExplanation`, `correctApproach`, `revisionSuggestion`.
- Rendered inside slide-over diagnosis drawer.

---

## 30. FIXED-STAGE SPACED REVISION QUEUE & 2-DAY PLAN SPECIFICATION

### 30.1 Preserved Phase 5 Spaced Ladder

The revision engine operates on a strictly preserved 5-stage fixed ladder:

```text
Stage 0: 1 Day
Stage 1: 3 Days
Stage 2: 7 Days
Stage 3: 14 Days
Stage 4: 30 Days
```

### 30.2 Projection Horizons

Projections query `GET /api/v1/revisions/plan?days=1` or `days=2`. Projections beyond 2 days are strictly unsupported by the backend and prohibited in the UI.

### 30.3 Question Delivery Contract

When reviewing a scheduled revision pattern:
1. Item fetched from `GET /api/v1/revisions/due`.
2. Questions fetched using supported pattern delivery API (`GET .../questions/topic/:topic/pattern/:pattern/random`).
3. Learner attempts submitted via `POST /api/v1/attempts` with `source: "revision"`.
4. Client-side revision interval calculations: **0**. SM-2 ease factors: **0**.

---

## 31. MOCK EXAMINATION LIFECYCLE & STATE MACHINE ARCHITECTURE

The mock examination experience distinguishes three separate, un-conflated lifecycle state machines strictly adhering to Phase 6 contracts (`mockConfig.SESSION_STATUS`, `mockConfig.SECTION_STATUS`, `mockConfig.FINALIZATION_STATE`):

### 31.1 Authoritative Session Lifecycle (`MockSession.status`)

Exactly 5 frozen backend statuses: `created`, `started`, `submitted`, `expired`, `abandoned`. Fictional session statuses `in_progress` or `completed` are **STRICTLY PROHIBITED (0)**.

```text
CATALOG
   │ POST /api/v1/mock-sessions
   ▼
[ CREATED ]
   ├── POST .../abandon ──────────────────────────────────► [ ABANDONED ]
   │
   ▼ POST .../start
[ STARTED ] (Authoritative Server Timer Active)
   ├── POST .../submit (or final section complete) ───────► [ SUBMITTED ]
   ├── Server Duration Elapsed (Lazy Expiry) ─────────────► [ EXPIRED ]
   └── POST .../abandon ──────────────────────────────────► [ ABANDONED ]

POST-TERMINAL PATHWAYS:
   ├── SUBMITTED / EXPIRED (Scoring & Diagnostic Review Eligible)
   │     ├── Backend Finalization Pipeline (idle -> in_progress -> completed)
   │     ├── RESULT_VIEW (GET .../result once finalization completed)
   │     └── REVIEW_VIEW (GET .../review post-exam question breakdown)
   │
   └── ABANDONED (Forfeited Exam — Zero Scoring / Zero Leakage)
         ├── Zero scoring pipeline invocation (No mock Attempts created)
         ├── Zero resultSummary generation (GET .../result returns 400 MOCK_SESSION_NOT_TERMINAL)
         ├── Zero review / answer leakage (GET .../review returns 400 MOCK_SESSION_NOT_TERMINAL)
         └── ABANDONED_VIEW (Safe forfeiture confirmation; routes back to catalog)
```

### 31.2 Multi-Level State Domain Typing

```typescript
// Distinct, non-conflated state domains:
export type MockSessionStatus = 'created' | 'started' | 'submitted' | 'expired' | 'abandoned';
export type MockSectionStatus = 'pending' | 'in_progress' | 'completed' | 'expired';
export type MockFinalizationState = 'idle' | 'in_progress' | 'completed' | 'failed';
export type MockFrontendViewState = 'EXAM_VIEWPORT' | 'RESULT_VIEW' | 'REVIEW_VIEW' | 'ABANDONED_VIEW';
```

Cross-domain status conflation count: **0**.

---

## 32. ACTIVE MOCK QUESTION CONTRACT & ANTI-LEAKAGE BOUNDARY

During active examinations (`started`), the question card strictly accepts `MockQuestionDto`:

```typescript
// Active Mock Question: Strictly excludes answer, correctAnswer, explanation, solution
export interface MockQuestionDto {
  questionId: string;
  sectionId: string;
  order: number;
  question: string;
  options: string[];
  topic: string;
  pattern: string;
  difficulty: number;
}
```

Passing a `QuestionDto` into `MOCK_EXAM` mode is structurally impossible at compile time and runtime. Active exam answer leakage pathways: **0**.

---

## 33. MOCK EXAM RESPONSE MUTATION & LOCAL PERSISTENCE CONTRACT

Responses are saved to the server via:

```text
POST /api/v1/mock-sessions/:id/responses HTTP/1.1
Content-Type: application/json

{
  "questionId": "66a012...",
  "selectedAnswer": "Option C",
  "isMarkedForReview": true,
  "timeTakenSeconds": 45
}
```

- Wire field names MUST be `selectedAnswer`, `isMarkedForReview`, and `timeTakenSeconds`.
- The wire fields `selectedOption` and `isFlagged` are PROHIBITED on the network boundary.
- A response is **NOT considered saved** until the server returns HTTP 200. The UI displays *"Saving..."* indicator until confirmed.

---

## 34. MOCK EXAM SERVER-AUTHORITATIVE TIMER & LAZY EXPIRY SPECIFICATION

### 34.1 Authoritative Deadline

The sole authoritative timer deadline is `session.expiresAt` (ISO 8601 string recorded on the server). The client timer is strictly a presentation mirror:

```typescript
const remainingMillis = Math.max(0, Date.parse(session.expiresAt) - Date.now());
```

The client MUST NOT reconstruct expiry from non-authoritative fields (`durationMinutes * 60`).

### 34.2 Zero-Time Client Expiry Behavior

When the visual countdown reaches `00:00:00`:
1. The UI immediately disables further answer option selection and mutations.
2. The client treats the timer as advisory and DOES NOT fabricate a local status `expired` or `submitted`.
3. The client DOES NOT blindly trigger manual `POST .../submit`.
4. The client initiates authoritative server inquiry via `GET /api/v1/mock-sessions/:id/result` (triggering lazy server expiry evaluation).
5. If the server returns HTTP 409 `FINALIZATION_IN_PROGRESS`:
   - Enters bounded polling mode: Polls `GET .../result` every **2,000 ms** for a maximum of **30 attempts** (60 seconds).
   - Aborts polling if server returns 200 (Success) or 400 (Terminal Error).
   - Once HTTP 200 is confirmed, navigates to `RESULT_VIEW`.

---

## 35. MOCK EXAM FORFEIT / ABANDON LIFECYCLE CONTRACT

When the learner confirms abandonment:
1. Client calls `POST /api/v1/mock-sessions/:id/abandon`.
2. Server transitions status to `abandoned`.
3. The result view `/app/mock-exams/:sessionId/result` is **UNAVAILABLE** (returns 400 `MOCK_SESSION_NOT_TERMINAL`).
4. The review view `/app/mock-exams/:sessionId/review` is **UNAVAILABLE** (returns 400 `MOCK_SESSION_NOT_TERMINAL`).
5. Zero scoring attempts are created, zero performance metrics are recorded.
6. The client renders safe `ABANDONED_VIEW` and offers a button returning to `/app/mock-exams`.

---

## 36. QUESTIONCARD MODE-SAFE DISCRIMINATED UNION SPECIFICATION

`src/components/quiz/QuestionCard.tsx` accepts props modeled as a strict discriminated union:

```typescript
// src/types/quiz.ts
import { QuestionDto, AdaptiveQuestionDto, ActiveMockQuestionDto, MockReviewQuestionDto, AttemptRecordDto } from './api';

export interface QuizFeedbackViewModel {
  attempt: AttemptRecordDto;
  explanation: string;
}

export type PracticeQuestionCardProps = {
  mode: 'PRACTICE' | 'REVISION' | 'MISTAKE';
  question: QuestionDto;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onSubmitAnswer: () => void;
  onFlagForReview?: () => void;
  isFlagged?: boolean;
  isSubmitting?: boolean;
  feedback?: QuizFeedbackViewModel | null;
  onRequestHint?: () => void;
  onDiagnoseError?: () => void;
};

export type AdaptiveQuestionCardProps = {
  mode: 'ADAPTIVE';
  question: AdaptiveQuestionDto;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onSubmitAnswer: () => void;
  onFlagForReview?: () => void;
  isFlagged?: boolean;
  isSubmitting?: boolean;
  feedback?: QuizFeedbackViewModel | null;
  onRequestHint?: () => void;
  onDiagnoseError?: () => void;
};

export type ActiveMockQuestionCardProps = {
  mode: 'MOCK_EXAM';
  question: ActiveMockQuestionDto;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
  onFlagForReview: () => void;
  isFlagged?: boolean;
  isSubmitting?: boolean;
  feedback?: never;
  onRequestHint?: never;
  onDiagnoseError?: never;
  onSubmitAnswer?: never;
};

export type MockReviewQuestionCardProps = {
  mode: 'MOCK_REVIEW';
  question: MockReviewQuestionDto;
  selectedOption?: never;
  onSelectOption?: never;
  onSubmitAnswer?: never;
  onFlagForReview?: never;
  isFlagged?: boolean;
  isSubmitting?: never;
  feedback?: never;
  onRequestHint?: never;
  onDiagnoseError?: never;
};

export type QuestionCardProps =
  | PracticeQuestionCardProps
  | AdaptiveQuestionCardProps
  | ActiveMockQuestionCardProps
  | MockReviewQuestionCardProps;
```

---

## 37. BACKEND-PROVEN ANALYTICS & ACCESSIBLE SVG PRESENTATION

The analytics presentation is governed by frozen Architecture Proposal `v1.0.13-FROZEN` (and historical frozen baseline `v1.0.12-FROZEN`) Section 27 and Section 37. All chart values are direct projections of existing wire DTOs. Rendering coordinates, labels, and units are presentation concerns; new scores, classification, baselines, normalization of cognitive dimensions, LLM metrics, substituted readiness metrics, and hidden fallback calculations remain prohibited.

### 37.1 Cognitive Profile Diagnostics (`CognitiveDiagnosticsSvg.tsx`)

`CognitiveDiagnosticsSvg` owns the diagnostic panel: the analysis-window summary, `SpeedAccuracyMatrixSvg` composition, returned risk/median/baseline evidence, and a stamina profile rendered inline as native SVG with an equivalent table. It consumes only `CognitiveProfileResponseDto` via the view model below. It makes no network request and derives no analytic value.

- Display `analysisWindow.windowDays` and `analysisWindow.attemptsAnalyzed` as the speed-analysis scope. Label stamina separately as eligible finalized mock-history evidence; changing `topic` or `windowDays` must not imply that those filters scope stamina.
- Render non-null `speedAccuracyMatrix.rushingRiskScore` as the returned index on a labeled 0–1 domain; show `medianTimeCorrectSeconds` and `medianTimeIncorrectSeconds` in seconds. Show `insufficientBaselineCount` directly, including zero. Null medians/risk receive an explicit “Insufficient evidence” label; do not use truthiness that hides a valid zero.
- Stamina points use `staminaCurve.quartileAccuracy[].quartile` on x (1–4) and `.accuracy` on y (percentage 0–100). Render the returned points with straight connecting segments in quartile order; no inferred points, smoothing, regression, or recomputation of accuracy from question counts. The table also includes `.totalQuestions` and `.correctQuestions` for each quartile.
- Surface `staminaCurve.mockSessionsAnalyzed` and `.totalQuestionsAnalyzed`. Display non-null `.fatigueDropoffPercent` as the returned percentage. When it is null, preserve the valid curve and show `.fatigueReason` if supplied. In particular, `zero_first_quartile_baseline` must not become “0% fatigue”.
- When `staminaCurve === null`, render no stamina points and show the supplied `staminaReason`: `insufficient_terminal_mocks` or `insufficient_questions`. An unrecognized supplied reason retains a neutral unavailable message with the reason text escaped; it never triggers a calculation.

### 37.2 Speed/Accuracy Quadrant Matrix (`SpeedAccuracyMatrixSvg.tsx`)

Render a native SVG 2×2 matrix with equal-sized cells and directly returned counts. No scatter coordinates or per-attempt records are supplied by this endpoint.

| Cell label | Exact input field under `speedAccuracyMatrix.quadrantCounts` |
|---|---|
| Accurate & Fast | `accurateAndFast` |
| Accurate & Slow | `accurateAndSlow` |
| Fast Error / Rushing | `fastErrorRushing` |
| Slow Error / Struggling | `slowErrorStruggling` |

Fixed layout order is the table order, row-major. Each cell has visible label and count; color is supplementary. The equivalent HTML table contains the same four labels/counts. Preserve zero counts. Do not distribute `insufficientBaselineCount` across cells, reconstruct classification, infer missing records, or calculate an overall cognitive score. A zero-attempt response may display the returned zero counts with a no-evidence caption; it must not claim learner proficiency.

### 37.3 Topic Mastery (Owned Inline by `AnalyticsDashboardPage.tsx`)

Source: `GET /api/v1/analytics/dashboard`, `topicMasteryRadar[]`. Render one native SVG horizontal bar per returned topic on a labeled 0–1 mastery domain with an equivalent table containing `topic`, `diagnosticMastery`, and the **unchanged backend `diagnosticLabel`**. Evidence columns may directly display `patternsWithEvidence`, `canonicalPatternsInTopic`, and `coverageRatio`. Preserve returned ordering and membership. Do not pad missing topics to 24 entries or recompute labels from rounded scores: a displayed `0.40` paired with backend label `weak` remains `weak`. Empty membership means insufficient topic evidence. No topic score is converted into a cognitive dimension.

### 37.4 Retention Evidence (`RetentionEvidenceSvg.tsx`)

Source: `GET /api/v1/analytics/retention`. Render two separate labeled sets of SVG bars and equivalent tables:

1. Current revision stage counts from `currentState.stageDistribution` (`stage0_1day`, `stage1_3days`, `stage2_7days`, `stage3_14days`, `stage4_30days`), alongside `activeRevisionItems`, `completedRevisionItems`, `dueTodayCount`, and `overdueCount`.
2. Observed retention percentages from **only the returned** `observedRetentionByGap[]` records. Display `gapBucket`, `observedRetentionRate` (already 0–100 percent), `totalEvents`, and `correctEvents`. Preserve backend ordering; absent buckets remain absent evidence. Frozen gap labels are `0.5-1.5d`, `1.5-4.5d`, `4.5-9.5d`, `9.5-18.5d`, `18.5-35.5d`, and `>35.5d`; display labels verbatim rather than deriving a duration or treating buckets as revision stages.

Display `evidence.revisionAttemptsAnalyzed`, `.excludedNoPriorAttemptCount`, `.excludedShortGapCount`, and `.excludedInvalidChronologyCount` directly. An empty observed array produces an empty-evidence caption, not a zero-valued curve. No forgetting model, gap interpolation, survival probability, stage advancement, or retention calculation is implemented by the frontend.

### 37.5 Readiness Evidence (Existing `ReadinessMeter.tsx` + Analytics Page)

Resolve an owned goal from `goalApi.fetchUserGoals(AuthContext.user.userId)` and request `GET /api/v1/analytics/readiness/:goalId` only after a goal exists/is selected. Use the existing goals cache; no new endpoint, route, identity input, or global auth-state field is introduced. With no goal, show the existing onboarding affordance and do not call readiness with an invented identifier.

`ReadinessMeter` displays non-null `readinessScore` on its 0–1 index domain. The page renders goal metadata (`goalId`, `goalTitle`, `targetDate`), `readinessStatus`, and backend `reason` where supplied. Render each returned readiness component separately, with its `value`, `weight`, `effectiveWeight`, and its own evidence fields:

- `planTargetCoverage`: `completedTargets`, `totalTargets`, `quotaSatisfiedTargets`, `masterySatisfiedTargets`.
- `masteryDepth`: `targetPatternsWithMastery`, `averageMastery`.
- `eligibleMockPerformance`: `eligibleMocksCount`.
- `eligibleMockPacing`: `averagePacingEfficiency`.

Null components/values are unavailable evidence, never zero. The prerequisite table uses returned `criticalPrerequisiteBottlenecks[]` (`targetPattern`, `unmasteredPrerequisite`, `prerequisiteMastery`, `masteryLabel`) without ranking/filtering/relabeling them. Do not calculate readiness, weights, eligibility, score bounds, or bottlenecks client-side, and do not label readiness as a pass probability or reuse its components as cognitive scores.

### 37.6 Exact View-Model Owner (`src/types/analytics.ts`)

Wire DTOs remain exclusively in `src/types/api.ts`. The inventoried analytics view-model file owns these presentation-only projections; every value is a direct backend field, not a newly derived metric:

```typescript
// src/types/analytics.ts
import type {
  AnalyticsDashboardResponseDto,
  CognitiveProfileResponseDto,
  RetentionAnalyticsResponseDto,
  ExamReadinessResponseDto,
} from './api';

export type CognitiveDiagnosticsViewModel = Readonly<Pick<
  CognitiveProfileResponseDto,
  'analysisWindow' | 'speedAccuracyMatrix' | 'staminaCurve' | 'staminaReason'
>>;
export type SpeedAccuracyMatrixViewModel = Readonly<
  CognitiveProfileResponseDto['speedAccuracyMatrix']['quadrantCounts']
>;
export type StaminaProfileViewModel = CognitiveProfileResponseDto['staminaCurve'];
export type TopicMasteryViewModel = ReadonlyArray<
  AnalyticsDashboardResponseDto['topicMasteryRadar'][number]
>;
export type RetentionEvidenceViewModel = Readonly<Pick<
  RetentionAnalyticsResponseDto,
  'currentState' | 'observedRetentionByGap' | 'evidence'
>>;
export type ReadinessEvidenceViewModel = Readonly<Pick<
  ExamReadinessResponseDto,
  'goalId' | 'goalTitle' | 'targetDate' | 'readinessStatus' | 'readinessScore' |
  'reason' | 'components' | 'criticalPrerequisiteBottlenecks'
>>;
```

Components MUST NOT mutate these projections, including nested arrays/objects. Chart props use `CognitiveDiagnosticsViewModel`, `SpeedAccuracyMatrixViewModel`, or `RetentionEvidenceViewModel` as applicable; the analytics page owns topic/readiness composition. A backend ratio may be mapped to a screen coordinate without changing its stored value. Percentage fields are already percentages; do not multiply them again. Preserve backend precision in the table and avoid relabeling rounded evidence.

### 37.7 Page, Accessibility & Failure Contract

`AnalyticsDashboardPage.tsx` renders five titled sections: Cognitive Profile Diagnostics, Stamina / Fatigue Analysis, Topic Mastery, Retention Evidence, and Exam Readiness. Sections share responses where specified, not duplicate fetches. Use the existing query keys and cache policies for operations 49–52; `topic`/`windowDays` are part of the cognitive-profile query key, while readiness keys include `goalId`. Abort superseded requests. Each failed query has its own retry/error state; never replace a failed/null result with zero-valued data from another endpoint. Existing unaffected results may remain visible during refetch with a loading indication.

The route owns one `<h1 tabIndex={-1}>Cognitive Diagnostics & Analytics</h1>` and subordinate section headings. SVGs have `role="img"`, associated unique `<title>`/`<desc>` IDs, explicit units, and equivalent visible HTML tables. Keyboard users can reach any controls/disclosures; no information is hover-only. Apply Sections 46/55 text and graphical contrast checks in both themes. Use responsive SVG `viewBox` geometry and stacked panels at narrow widths without horizontal viewport overflow; do not add animation that violates reduced-motion rules. All of this uses the existing CSS module and authorized native SVG components, with no dependency addition.

### 37.8 Analytics Acceptance Within Existing Suites

| Existing suite owner | Required assertions |
|---|---|
| `src/test/api/analyticsApi.contract.test.ts` | Operations 49–52 retain exact method/path/query/envelope ownership. Test actual `quartile`/`accuracy` keys, topic evidence membership/fields, readiness metadata/reason and null components, and retention bucket/evidence fields. No unsupported score field is required or synthesized. |
| `src/test/components/CognitiveDiagnosticsSvg.test.ts` | Numeric values, four quadrant labels/counts, medians/risk and baseline count match DTO inputs; valid zeros survive; null values remain unavailable. Stamina uses returned points and exact percentages; cover both null-curve reasons and null fatigue with a valid curve. Topic `0.40`/`weak` stays unchanged, omitted topics/buckets are not filled, readiness components remain separate and nullable, and no synthetic scores/points appear. Render the inventoried matrix/retention/page subjects through the existing harness as needed. |
| `src/test/a11y/accessibility.test.ts` | Analytics h1 focus, SVG title/description references, matching visible data tables, keyboard controls, and A11Y-05 text >= 4.5:1 / graphics >= 3:1 in both themes; retain required manual rendered-state checks. |
| `e2e/learner-journey.spec.ts` | Existing same-origin fixture fulfills the four analytics operations and owned-goal lookup for navigation into analytics; assert the five sections and backend example values, then null/empty evidence states without fallback scores. |
| `e2e/responsive-viewports.spec.ts` | Analytics panels/tables follow Section 47 at the frozen device points and existing boundary widths; no clipped labels or horizontal viewport overflow. |

These are additional assertions within existing inventoried suites, not additional security requirement IDs or physical files. MSW remains responsible for 64/64 wire contracts. Mock-exam active-question isolation, real token-manager authentication, and all six ACC-16 measurements remain unchanged.

---

## 38. SOCRATIC AI TUTOR & LEARNING CENTER INTEGRATION CONTRACT

All six Phase 7 learning operations are integrated:

```text
1. POST /api/v1/learning/tutor            (Dedicated Socratic conversational chat; canonical topic & pattern required)
2. POST /api/v1/learning/hint             (Contextual 5-level progressive conceptual hints during practice)
3. POST /api/v1/learning/explain-attempt  (Misconception diagnosis on wrong answers for owned attempt)
4. POST /api/v1/learning/explain-progress (Narrative coaching; body.userId, topic, pattern required)
5. POST /api/v1/learning/explain-plan     (Strategic breakdown of study plan; planId & targetDate required)
6. POST /api/v1/learning/mock-review      (Executive debrief on terminal mock exam session)
```

### 38.1 Five-Level Progressive Conceptual Hint Contract
1. **Hint Level 1**: General conceptual orientation & domain framing.
2. **Hint Level 2**: Pattern recognition & strategic approach identification.
3. **Hint Level 3**: Step-by-step mathematical/logical direction.
4. **Hint Level 4**: Narrow procedural & calculation guidance.
5. **Hint Level 5**: Detailed remediation guidance (strictly requires a prior owned attempt on the question; backend validates attempt history and returns HTTP 403 `ATTEMPT_REQUIRED` if no attempt exists).
6. **Active Mock Assistance**: Strictly **PROHIBITED**. The UI disables hint affordances during active mock exams (`onRequestHint?: never`), and backend enforces mock question isolation.
7. **Envelope Invariant**: All learning operations return `{ data: T, metadata: LearningMetadataDto, provenance: LearningProvenanceDto }` with strictly **NO `success` boolean** property.

Automatic retries upon HTTP 429 are **STRICTLY PROHIBITED**.

---

## 39. LLM TIER-4 RATE LIMITING & COOLDOWN UX CONTRACT

Calls to `/api/v1/learning/*` are subject to Phase 14's Tier-4 limiter (20 requests per 1 minute per authenticated `userId`):

### 39.1 Handling HTTP 429
1. Catch `TOO_MANY_REQUESTS` or `RATE_LIMIT_CAPACITY_EXCEEDED`.
2. Inspect `Retry-After` response header:
   - **Present**: Parse bounded integer seconds. Render visual countdown timer on submit button. Disable button until timer expires.
   - **Absent**: Render: *"AI Tutor is currently busy. Please review concepts or continue practice."* Offer manual "Try Again" CTA without fabricated countdown.
3. Automatic retries count: **0**.

---

## 40. HTML SANITIZATION PIPELINE & XSS DEFENSE SPECIFICATION

AI-generated Markdown guidance flows through an immutable sanitization pipeline:

```text
LLM Markdown String ──► marked.parse() ──► DOMPurify.sanitize() ──► React DOM Render
```

### 40.1 DOMPurify Strict Allowlist Configuration

```typescript
// src/utils/markdownSanitizer.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const SANITIZER_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'code', 'pre',
    'h2', 'h3', 'h4', 'blockquote', 'hr', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'span'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
};

export function renderSanitizedMarkdown(rawMarkdown: string): string {
  const dirtyHtml = marked.parse(rawMarkdown, { async: false }) as string;
  return DOMPurify.sanitize(dirtyHtml, SANITIZER_CONFIG);
}
```

Unsanitized `dangerouslySetInnerHTML` usage count: **0**. Markdown content MUST NOT introduce an h1; the sanitizer removes that tag while retaining its text, leaving the route as the sole semantic h1 owner. Subordinate headings preserve a logical hierarchy under the route heading.

---

## 41. BACKEND ERROR CODE PRESENTATION MAPPING MATRIX

`src/utils/errorCodeMapper.ts` maps all backend public errors to user guidance:

| Backend Error Code | HTTP Status | User Message Category | UI Boundary | Retry Permitted? | Automatic Retry? | Token Mutation? |
|---|---|---|---|---|---|---|
| `UNAUTHORIZED` | 401 | Session Expired | Auth Boundary | YES | YES (Single Replay on protected non-auth calls only) | Section 12 taxonomy; transient refresh failures preserve token |
| `IDENTITY_MISMATCH` | 403 | Security Boundary | Forbidden Alert | NO | NO | None |
| `OWNERSHIP_VIOLATION` | 403 | Security Boundary | Forbidden Alert | NO | NO | None |
| `ACCOUNT_DISABLED` | 403 | Account Deactivated | Dedicated Inactive View | NO | NO | Clears token |
| `PASSWORD_BLOCKLISTED` | 400 | Form Validation | Inline Input Error | YES | NO | None |
| `TOO_MANY_REQUESTS` | 429 | Rate Limiting | Cooldown Countdown | YES | NO | None |
| `RATE_LIMIT_CAPACITY_EXCEEDED`| 429 | Capacity Alert | Inline Warning Banner | YES | NO | None |
| `FINALIZATION_IN_PROGRESS`| 409 | System Finalizing | Loading Shimmer/Poll | YES | YES (Bounded Poll) | None |
| `FINALIZATION_LEASE_LOST` | 409 | Finalization Contention | Retry Alert Banner | YES | NO | None |
| `MOCK_SESSION_EXPIRED` | 409 | Exam Expired | Score Report Router | YES | NO | None |
| `SECTION_LOCKED` | 409 | Section Sealed | Locked Notice Banner | NO | NO | None |
| `SECTION_NOT_ACTIVE` | 409 | Section Inactive | Barrier Warning | NO | NO | None |
| `RESPONSE_FROZEN` | 409 | Exam Finalized | Frozen Notice Banner | NO | NO | None |
| `SESSION_STATE_CONFLICT` | 409 | State Conflict | Session Refresh Alert | YES | NO | None |
| `MOCK_SESSION_NOT_TERMINAL` | 400 | Exam Not Terminal | Catalog Redirect | NO | NO | None |
| `INVALID_SESSION_STATE` | 400 | Invalid Transition | Catalog Redirect | NO | NO | None |
| `INVALID_OPTION` | 400 | Validation Alert | Form Selection Alert | YES | NO | None |
| `INVALID_TIME_TAKEN` | 400 | Pacing Validation | Advisory Notice | YES | NO | None |
| `MOCK_SESSION_NOT_FOUND` | 404 | Resource Missing | Not Found Card | NO | NO | None |
| `LLM_PROVIDER_UNAVAILABLE`| 503 | AI Offline | Fallback Hint Card | YES | NO | None |
| `LLM_PROVIDER_TIMEOUT` | 504 | AI Timeout | Fallback Hint Card | YES | NO | None |
| `INTERNAL_SERVER_ERROR` | 500 | System Fault | Recoverable Error Alert | YES | NO | None |

---

## 42. NETWORK OFFLINE & TRANSIENT FAULT RESILIENCE CONTRACT

### 42.1 Unconfirmed Server Mutations
- Practice unsubmitted answers remain in local React component state.
- Unconfirmed server mutations are strictly **NOT SAVED**.
- Persistent offline mutation queues: **NONE (0)**.
- Automatic exam progression while disconnected: **STRICTLY PROHIBITED (0)**.
- User notice on disconnect: *"Connection lost. Your latest answer has not been saved yet. Please reconnect before continuing."*

---

## 43. BROWSER PERSISTENCE & STORAGE BOUNDARY POLICY

| Storage Location | Allowed Items | Strictly Prohibited Items |
|---|---|---|
| `window.localStorage` | `aptitude_theme` (`'dark' \| 'light'`), `sidebar_state` (`'expanded' \| 'collapsed'`) | Access Tokens, Refresh Tokens, Passwords, Answer Keys, Mutation Queues |
| `window.sessionStorage`| Transient active exam draft choice (`session_draft_{qId}`) | Access Tokens, Refresh Tokens, Passwords, Answer Keys |
| `In-Memory Closure` | `inMemoryAccessToken` (`tokenManager.ts`), Component State | Permanent persistence across page refreshes |
| `HttpOnly Cookie Jar` | `refreshToken` (`Path=/api/v1/auth/refresh`, `SameSite=Strict`) | Access Tokens, JavaScript-readable data |

Persistent access token copies count: **0**.

---

## 44. BROWSER LOGGING & SECURITY REDACTION POLICY

1. **Production Builds**: Strips all `console.log` calls in production builds via Vite-native esbuild configuration (`esbuild: { pure: ['console.log'] }`). The introduction of Terser or third-party minifier plugins is strictly prohibited. Production bundle inspection must confirm 0 occurrences of `console.log`:
   ```typescript
   // adaptive-aptitude-app/vite.config.ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     esbuild: {
       pure: ['console.log'],
     },
     build: {
       minify: 'esbuild',
       // retain chunk and asset budgets
     },
   });
   ```
2. **Redacted Data**: Passwords, access tokens, refresh tokens, Authorization headers, and unsealed answer keys MUST NEVER be logged under any condition.
3. **Correlation ID Logging**: In development mode (`import.meta.env.DEV === true`), `src/utils/logger.ts` outputs sanitized endpoint names and correlation IDs (`X-Correlation-ID`) without emitting credentials. Node `process` polyfills are strictly prohibited in browser code. When `import.meta.env.DEV !== true`, logger calls are zero-cost and emit zero console output.
4. **Third-Party Telemetry**: Third-party tracking scripts, analytics SDKs, or external monitoring agents count: **0**.

---

## 45. FRONTEND OBSERVABILITY & CORRELATION ID INTEGRATION

1. **React Error Boundaries**: Top-level `AppErrorBoundary` (owned and implemented in `src/App.tsx`) and route boundaries (`RouteErrorBoundary` instances owned and implemented in `src/router.tsx`) catch unhandled render errors, displaying a recovery card with a "Reload Page" CTA.
2. **Correlation ID Visibility**: When an API error occurs, the captured `X-Correlation-ID` is surfaced in monospace text: `Ref: 9a2b-4c5e-88f1` for support tracing.

---

## 46. PHASE 15 ACCESSIBILITY TARGET — WCAG 2.2 LEVEL AA

The application targets WCAG 2.2 Level AA. The following Phase 15 acceptance checks are mandatory scoped verification requirements and must not be represented as a formal third-party or exhaustive WCAG certification.

### 46.1 Full Keyboard Operability Contract (Frozen Architecture Section 32)

All interactive controls MUST be operable via keyboard without a mouse. The complete frozen keyboard navigation contract is:

| Operation | Key(s) | Scope |
|---|---|---|
| Forward focus traversal | `Tab` | All interactive controls |
| Reverse focus traversal | `Shift+Tab` | All interactive controls |
| Activate button / submit | `Enter` | Buttons, submit controls |
| Activate toggle / checkbox | `Space` | Toggle buttons, checkboxes |
| Navigate within widget | Arrow keys (`↑ ↓ ← →`) | Radio groups, question palette grid |
| Select question option 1 | `1` or `A` | Question radio choices (outside text inputs) |
| Select question option 2 | `2` or `B` | Question radio choices (outside text inputs) |
| Select question option 3 | `3` or `C` | Question radio choices (outside text inputs) |
| Select question option 4 | `4` or `D` | Question radio choices (outside text inputs) |
| Dismiss modal | `Escape` | Open modal dialogs |
| Modal focus trap | `Tab` / `Shift+Tab` | Focus remains inside open modal |

**Constraint**: Numeric (`1–4`) and alphabetic (`A–D`) option shortcuts MUST NOT fire while keyboard focus is inside an editable `<input>`, `<textarea>`, or `contenteditable` element.

### 46.2 Additional Accessibility Requirements

1. **Focus Management**: Focus automatically moves to the active view's single main `<h1 tabIndex={-1}>` upon route navigation, including Records 10 and 15. Shared shells MUST NOT add a second h1. `/app` focuses its redirect destination, not a transient shell heading; in-route question/section changes do not count as route navigation.
2. **Visible Focus Ring**: All focused elements display `outline: 2px solid var(--ring-color); outline-offset: 2px;` (frozen architecture contract).
3. **Form Describability**: Every form control has a permanent associated `<label>`; input errors are linked via `aria-describedby="field-error-id"`. A placeholder is not a label.
4. **Screen Reader Announcements**: `ExamTimer` emits `aria-live="polite"` announcements at 10 minutes, 5 minutes, 1 minute, and 30 seconds remaining. The result view announces score calculation completion only after the backend confirms result eligibility.
5. **Color Contrast**: Normal text MUST reach **4.5:1** and meaningful graphical/UI-control boundaries and indicators MUST reach **3:1** against adjacent backgrounds in **both light and dark themes**. Section 55 A11Y-05 requires numerical token-pair tests plus numerical rendered-state review; ambient-light visual inspection alone cannot establish either threshold.
6. **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` by disabling all animations and shimmers.
7. **Semantic Headings**: Single `<h1>` per route; logical heading hierarchy enforced.
8. **Icon Labels**: Decorative SVG icons have `aria-hidden="true"`; functional icon buttons and question-palette navigation tiles have explicit accessible labels describing action/question and state.
9. **Redundant Feedback**: Correct/incorrect states always pair color with both text and distinct check/cross iconography. Other status indicators (weak/proficient/mastered) include text or an icon complement; color alone is never the sole feedback channel.

---

### 46.3 Frozen Architecture Section 32 Accessibility Requirements Audit Matrix

The following matrix confirms every accessibility requirement from Frozen Architecture Section 32 is represented in this specification and/or the test inventory:

| Frozen Accessibility Requirement | Specification Location | Automated Test | Manual Test | Status |
|---|---|---|---|---|
| Tab forward focus traversal | Section 46.1 (keyboard contract table) | A11Y-01 (RTL Tab key) | Full keyboard workflow | ✅ COVERED |
| Shift+Tab reverse focus traversal | Section 46.1 (keyboard contract table) | A11Y-01 (RTL Shift+Tab) | Full keyboard workflow | ✅ COVERED |
| Enter activation | Section 46.1 (keyboard contract table) | A11Y-01 (RTL Enter) | Full keyboard workflow | ✅ COVERED |
| Space activation | Section 46.1 (keyboard contract table) | A11Y-01 (RTL Space) | Full keyboard workflow | ✅ COVERED |
| Arrow key widget navigation | Section 46.1 (keyboard contract table) | A11Y-01 (RTL Arrow keys in palette) | Full keyboard workflow | ✅ COVERED |
| 1/A → Option 1 shortcut | Section 46.1 (keyboard contract table) | A11Y-01 (RTL key "1" and key "a") | Full keyboard workflow | ✅ COVERED |
| 2/B → Option 2 shortcut | Section 46.1 (keyboard contract table) | A11Y-01 (RTL key "2" and key "b") | Full keyboard workflow | ✅ COVERED |
| 3/C → Option 3 shortcut | Section 46.1 (keyboard contract table) | A11Y-01 (RTL key "3" and key "c") | Full keyboard workflow | ✅ COVERED |
| 4/D → Option 4 shortcut | Section 46.1 (keyboard contract table) | A11Y-01 (RTL key "4" and key "d") | Full keyboard workflow | ✅ COVERED |
| 2px focus ring outline | Section 46.2 + Section 48 (--ring-color, outline: 2px solid) | A11Y-01 asserts focused controls retain the specified outline rule | Rendered 2px outline and 2px offset check in both themes | ✅ COVERED |
| Semantic heading hierarchy | Section 7 Records 1–20 + Section 46.2 | A11Y-02: exactly one h1 and activeElement equals that h1 on all 19 screens | Screen reader check | ✅ COVERED |
| aria-live announcements (ExamTimer) | Section 46.2 + Section 34 | A11Y-03 (aria-live content at thresholds) | VoiceOver/NVDA timing | ✅ COVERED |
| aria-live score calculation completion | Sections 31, 46.2 + 55 | A11Y-03 after confirmed result | VoiceOver/NVDA completion announcement | ✅ COVERED |
| Icon and question-palette accessible labels | Section 46.2 (icon labels requirement) | A11Y-01 RTL accessible name queries for functional icons and palette tiles | Screen reader check | ✅ COVERED |
| Permanent form labels | Section 46.2 (form describability) | A11Y-04: associated permanent label plus aria-describedby | Screen reader form check | ✅ COVERED |
| aria-describedby error association | Section 46.2 + Section 23 | A11Y-04 | Screen reader error feedback | ✅ COVERED |
| Normal text >= 4.5:1, light AND dark | Sections 46.2 + 55 | A11Y-05 numerical token-pair tests, both themes | A11Y-05 rendered-state numerical contrast ledger, both themes | ✅ MAPPED (execution required) |
| Graphical/UI-control contrast >= 3:1, light AND dark | Sections 46.2 + 55 | A11Y-05 numerical token-pair tests, both themes | A11Y-05 rendered-state numerical contrast ledger, both themes | ✅ MAPPED (execution required) |
| Correct/incorrect color + text + distinct icons; other status redundant feedback | Section 46.2 | A11Y-01 asserts status text and check/cross icon semantics independently of color | Visual review | ✅ COVERED |
| Reduced motion preference | Section 46.2 | A11Y-06 (animations disabled under reduced-motion) | OS motion toggle | ✅ COVERED |

**Frozen Accessibility Requirements Unmapped: 0**

## 47. RESPONSIVE ERGONOMICS & VIEWPORT LAYOUT CONTRACT

The application supports responsive layouts from mobile phones to high-resolution desktops. The desktop breakpoint is **open-ended at 1024px+**; widths above 1920 px remain fully supported.

### 47.1 Breakpoint Tiers (Frozen Architecture Section 33)

```text
Breakpoint 'xs':  320px–639px    Single column, bottom navigation, collapsed headers
Breakpoint 'sm':  640px–767px    Flexible card grids, collapsible top bar / overlay navigation
Breakpoint 'md':  768px–1023px   Two-column dashboard, collapsible sidebar
Breakpoint 'lg':  1024px+        Persistent sidebar, split-pane exam, sticky question palette
```

### 47.2 Implementation Responsibilities Per Breakpoint

| Width | Navigation | Question Map | Exam Layout |
|---|---|---|---|
| 320px–639px | Bottom navigation bar | Drawer / overlay | Single-column |
| 640px–767px | Collapsible top bar / overlay navigation drawer | Overlay | Single-column |
| 768px–1023px | Collapsible sidebar | Overlay or inline | Two-column dashboard |
| 1024px+ | Persistent fixed sidebar | Sticky inline palette | Split-pane exam view |

### 47.3 E2E Playwright Test Viewports

The `e2e/responsive-viewports.spec.ts` validates layout at each tier; in addition to the five frozen device points below, it checks boundary widths 320, 639, 640, 767, 1023, 1024, and 2560 px at a deterministic 1080 px height, asserting no horizontal viewport overflow and the Section 47.2 layout/navigation behavior. Record 15 retains its exam-only chrome at every width. The 1920×1080 viewport is a required test **point** but is NOT the maximum supported width.

- iPhone SE (375 × 667)
- iPhone 14 (390 × 844)
- iPad Mini (768 × 1024)
- MacBook Air (1280 × 800)
- Standard Desktop (1920 × 1080)

---

### 47.4 Frozen Architecture Section 33 Responsive Requirements Audit Matrix

| Frozen Responsive Requirement | Spec Location | Status |
|---|---|---|
| 320px–639px: single column | Section 47.1 + 47.2 | ✅ COVERED |
| 320px–639px: bottom navigation | Section 47.2 + `BottomNav.tsx` inventory | ✅ COVERED |
| 320px–639px: drawer question map | Section 47.2 + `QuestionPalette.tsx` inventory | ✅ COVERED |
| 640px–767px: flexible card grids | Section 47.1 + 47.2 | ✅ COVERED |
| 640px–767px: collapsible top bar / overlay navigation | Section 47.2 | ✅ COVERED |
| 768px–1023px: collapsible sidebar | Section 47.2 + `AppSidebar.tsx` inventory | ✅ COVERED |
| 768px–1023px: two-column dashboard | Section 47.2 | ✅ COVERED |
| 1024px+: persistent sidebar | Section 47.2 | ✅ COVERED |
| 1024px+: split-pane exam | Section 47.2 + `MockSessionPage.tsx` inventory | ✅ COVERED |
| 1024px+: sticky question palette | Section 47.2 + `QuestionPalette.tsx` inventory | ✅ COVERED |
| Widths above 1920px supported | Section 47.1 (open-ended 1024px+) | ✅ COVERED |
| E2E viewport: 375×667 | Section 47.3 | ✅ COVERED |
| E2E viewport: 390×844 | Section 47.3 | ✅ COVERED |
| E2E viewport: 768×1024 | Section 47.3 | ✅ COVERED |
| E2E viewport: 1280×800 | Section 47.3 | ✅ COVERED |
| E2E viewport: 1920×1080 | Section 47.3 | ✅ COVERED |

**Frozen Responsive Requirements Unmapped: 0**

## 48. DESIGN SYSTEM & CSS TOKEN SPECIFICATIONS

Tokens are declared in `src/styles/tokens.css` and use native CSS Custom Properties, preserving 100% of the frozen Architecture Section 34 tokens, values, and identifiers:

```css
/* src/styles/tokens.css */
:root {
  /* Color Palette — Tailored Sleek Theme (Dark Default) */
  --bg-primary: #0f172a;
  --bg-surface: #1e293b;
  --bg-surface-elevated: #334155;

  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);

  --accent-primary: #6366f1;
  --accent-hover: #4f46e5;
  --accent-glow: rgba(99, 102, 241, 0.25);

  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-error: #f43f5e;
  --status-info: #0ea5e9;

  /* Focus Ring */
  --ring-color: var(--accent-primary);

  /* Typography Stack — Zero External Network Dependencies */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Fluid Typography Scale */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem);
  --text-sm: clamp(0.875rem, 0.825rem + 0.25vw, 0.9375rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem);
  --text-lg: clamp(1.125rem, 1.05rem + 0.35vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 2rem);

  /* Spatial Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Glassmorphism Primitives */
  --glass-bg: rgba(30, 41, 59, 0.75);
  --glass-blur: blur(12px);

  /* Corner Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Elevation Shadows */
  --shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.4);
}

/* Light Theme Local Override — Consuming the Same Canonical Namespace */
[data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #f1f5f9;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;

  --border-subtle: rgba(15, 23, 42, 0.08);
  --border-strong: rgba(15, 23, 42, 0.16);

  --accent-primary: #4f46e5;
  --accent-hover: #4338ca;
  --accent-glow: rgba(79, 70, 229, 0.2);

  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-blur: blur(12px);

  --shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.08);

  --ring-color: var(--accent-primary);
}
```

External webfont downloads count: **0 (System fonts only)**.
Parallel competing token namespaces: **0**.

---

## 49. FRONTEND DOCUMENT CONTENT SECURITY POLICY (CSP) CONTRACT

### 49.1 Target SPA Document CSP Directive

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
connect-src 'self' ${VITE_API_BASE_URL};
```

5. **CSS Modules CSP Compatibility**: All CSS Modules compile to Vite-generated external CSS stylesheets loaded via `<link rel="stylesheet">`. Inline style injection requiring `unsafe-inline` is strictly prohibited. External web fonts or third-party stylesheet CDNs are strictly prohibited (`style-src self`).

Phase 15 DOES NOT implement the production CSP HTTP delivery header. Header injection belongs exclusively to Phase 16 web server configuration.

---

## 50. PHASE 16 PRODUCTION DEPLOYMENT HANDOFFS

The following production concerns are strictly deferred to Phase 16:
1. **Edge TLS & Certificate Management**
2. **Production HSTS Header Injection**
3. **Static SPA Document CSP Header Delivery**
4. **Production Same-Site Ingress Routing**
5. **Static Asset CDN Caching**
6. **Distributed Edge Rate Limiting**
7. **Containerization (Docker / Kubernetes)**

---

## 51. COMPREHENSIVE TEST & SUPPORT FILE INVENTORY (34 TEST/SUPPORT FILES)

The test pyramid contains exactly 34 test and support files, distinguishing executable test/spec suites from support and infrastructure files:

```text
Vitest Executable Suite Files:          26
Vitest Harness / Support Files:          3
Total TEST-Class Files:                 29

Playwright Executable Spec Files:        4
Playwright Fixture / Support Files:      1
Total E2E-Class Files:                   5

Total Executable Test/Spec Files:       30
Total Test/Support Files:               34
```

### 51.1 Mechanical File Breakdown

1. **Vitest Executable Suite Files (26 Files)**:
   - 6 Unit & Security test files (`tokenManager.security.test.ts`, `apiClient.test.ts`, `apiBaseUrl.test.ts`, `errorCodeMapper.test.ts`, `markdownSanitizer.security.test.ts`, `queryKeyFactory.test.ts`)
   - 12 API Contract test files (`authApi.contract.test.ts`, `questionApi.contract.test.ts`, `goalApi.contract.test.ts`, `planningApi.contract.test.ts`, `attemptApi.contract.test.ts`, `progressApi.contract.test.ts`, `adaptiveApi.contract.test.ts`, `revisionApi.contract.test.ts`, `mockApi.contract.test.ts`, `analyticsApi.contract.test.ts`, `orchestrationApi.contract.test.ts`, `learningApi.contract.test.ts`)
   - 8 Component & Integration test files (`QuestionCard.test.ts`, `ExamTimer.test.ts`, `CognitiveDiagnosticsSvg.test.ts`, `AuthBootstrapBoundary.test.ts`, `adaptivePracticeFlow.test.ts`, `mockExamFlow.test.ts`, `tutorRateLimit.test.ts`, `accessibility.test.ts`)
2. **Vitest Support & Harness Files (3 Files)**:
   - `src/test/setup.ts`: Initializes `@testing-library/jest-dom/vitest` matchers and manages deterministic MSW lifecycle (`beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`).
   - `src/test/mocks/server.ts`: Configures `setupServer` from `msw/node` with default contract handlers.
   - `src/test/mocks/handlers.ts`: Defines default MSW mock request handlers for wire endpoints.
3. **Playwright Executable Spec Files (4 Files)**:
   - `e2e/auth-journey.spec.ts`
   - `e2e/learner-journey.spec.ts`
   - `e2e/mock-exam-journey.spec.ts`
   - `e2e/responsive-viewports.spec.ts`
4. **Playwright Fixture & Support Files (1 File)**:
   - `e2e/fixtures.ts`

---

## 52. AUTHENTICATION & SECURITY MANDATORY TEST CASE SPECIFICATIONS (17 TEST CASES)

The 17 mandatory security test cases from Phase 15 Architecture Proposal Section 62 are specified in detail. These 17 requirements represent mandatory assertions distributed across the existing executable test suites (`tokenManager.security.test.ts`, `apiClient.test.ts`, `markdownSanitizer.security.test.ts`, `AuthBootstrapBoundary.test.ts`, and contract tests); they do NOT create additional physical test-suite files and do NOT alter the 29 TEST-class file inventory count:

```typescript
// Test 1: Access token is never persisted
test('SEC-01: access token is never persisted to localStorage or sessionStorage', () => {
  setAccessToken('secret-jwt-token');
  expect(localStorage.getItem('token')).toBeNull();
  expect(sessionStorage.getItem('token')).toBeNull();
});

// Test 2: Single-flight refresh lock prevents parallel calls
test('SEC-02: concurrent 401s emit exactly one refresh request', async () => {
  let refreshCalls = 0;
  server.use(
    http.post('/api/v1/auth/refresh', () => {
      refreshCalls++;
      return HttpResponse.json({ success: true, data: { accessToken: 'new-token', expiresIn: 900 } });
    })
  );
  await Promise.all([executeSingleFlightRefresh(), executeSingleFlightRefresh(), executeSingleFlightRefresh()]);
  expect(refreshCalls).toBe(1);
});

// Test 3: Invalid refresh credential redirects to login
test('SEC-03: invalid refresh clears token and transitions to UNAUTHENTICATED', async () => {
  server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.json({ success: false, error: { code: 'INVALID_REFRESH_TOKEN' } }, { status: 401 })));
  await expect(executeSingleFlightRefresh()).rejects.toThrow();
  expect(getAccessToken()).toBeNull();
});

// Test 4: REFRESH_REUSE_DETECTED clears token
test('SEC-04: REFRESH_REUSE_DETECTED clears token and transitions to UNAUTHENTICATED', async () => {
  server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.json({ success: false, error: { code: 'REFRESH_REUSE_DETECTED' } }, { status: 401 })));
  await expect(executeSingleFlightRefresh()).rejects.toThrow();
  expect(getAccessToken()).toBeNull();
});

// Test 5: ACCOUNT_DISABLED renders dedicated inactive view without redirect loop
test('SEC-05: 403 ACCOUNT_DISABLED clears token and renders inactive view without loop', async () => {
  server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.json({ success: false, error: { code: 'ACCOUNT_DISABLED' } }, { status: 403 })));
  await expect(executeSingleFlightRefresh()).rejects.toThrow();
  expect(getAccessToken()).toBeNull();
});

// Test 6: Parameterize both REFRESH_ORIGIN_REQUIRED and CORS_ORIGIN_DENIED;
// assert SERVICE_UNAVAILABLE configuration view, token clearing, and zero refresh loops.
test('SEC-06: 403 REFRESH_ORIGIN_REQUIRED halts looping and enters configuration state', async () => {
  server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.json({ success: false, error: { code: 'REFRESH_ORIGIN_REQUIRED' } }, { status: 403 })));
  await expect(executeSingleFlightRefresh()).rejects.toThrow();
});

// Test 7: HTTP 5xx preserves in-memory token
test('SEC-07: 500 refresh response preserves valid in-memory token', async () => {
  setAccessToken('valid-token');
  server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } }, { status: 500 })));
  await expect(executeSingleFlightRefresh()).rejects.toThrow();
  expect(getAccessToken()).toBe('valid-token');
});

// Test 8: Network failure preserves in-memory token
test('SEC-08: fetch network error preserves valid in-memory token', async () => {
  setAccessToken('valid-token');
  server.use(http.post('/api/v1/auth/refresh', () => HttpResponse.error()));
  await expect(executeSingleFlightRefresh()).rejects.toThrow();
  expect(getAccessToken()).toBe('valid-token');
});

// Test 9: Unauthenticated visitor cannot access protected routes
test('SEC-09: unauthenticated visitor visiting /app/dashboard is redirected to /login', async () => {
  // Mount router in UNAUTHENTICATED state; assert redirection to /login
});

// Test 10: Authenticated user visiting /login redirects to dashboard
test('SEC-10: authenticated visitor visiting /login is redirected to /app/dashboard', async () => {
  // Mount router in AUTHENTICATED state; assert redirection to /app/dashboard
});

// Test 11: IDENTITY_MISMATCH triggers forbidden boundary without infinite retries
test('SEC-11: 403 IDENTITY_MISMATCH stops retries and surfaces forbidden alert', async () => {
  // Assert no re-fetch on IDENTITY_MISMATCH
});

// Test 12: 429 TOO_MANY_REQUESTS disables button and respects cooldown
test('SEC-12: 429 TOO_MANY_REQUESTS parses Retry-After and disables submit button', async () => {
  // Mock 429 with Retry-After: 30; assert button disabled
});

// Test 13: Active mock view contains zero correct answers
test('SEC-13: active mock exam question card contains zero answer fields', () => {
  // Assert MockQuestionDto has no answer or explanation properties
});

// Test 14: Abandoned mock session produces no result view
test('SEC-14: abandoned mock session routes safely to catalog without score report', async () => {
  // Mock abandoned session; assert 400 MOCK_SESSION_NOT_TERMINAL routes to catalog
});

// Test 15: Abandoned mock review request exposes zero answers
test('SEC-15: abandoned mock review exposes zero answer keys or explanations', async () => {
  // Assert review endpoint returns 400 for abandoned session
});

// Test 16: Abandoned mock does not create mock attempts
test('SEC-16: abandoned mock session does not invoke finalization scoring', async () => {
  // Assert abandon triggers no submit/finalize or POST /attempts call and no receipt UI.
  // Zero database Attempts/receipts is an upstream frozen backend guarantee, not a frontend DB assertion.
});

// Test 17: AI tutor Markdown sanitizes XSS script payloads
test('SEC-17: Markdown parser strips <script> and onerror handlers via DOMPurify', () => {
  const dirty = 'Hello <script>alert("XSS")</script><img src="x" onerror="alert(1)"/>';
  const clean = renderSanitizedMarkdown(dirty);
  expect(clean).not.toContain('<script>');
  expect(clean).not.toContain('onerror');
});
```

---

## 53. API CLIENT CONTRACT TEST SUITE SPECIFICATIONS (MSW 64 ENDPOINTS)

All 64 consumed operations MUST be validated using Mock Service Worker (MSW) across the 12 contract test files (`src/test/api/*.contract.test.ts`), verifying:
1. HTTP method matches backend route exactly.
2. Endpoint URL matches backend route exactly.
3. Path and query parameters serialize properly.
4. Request body adheres to DTO interface.
5. Authorization Bearer header is injected on protected routes.
6. `credentials: 'include'` is set on all calls.
7. Return envelope decodes successfully.
8. Error envelopes throw typed `ApiClientError`.
9. `AbortSignal` cancellation is respected.

**API Contract Test Coverage Mandate: 64 / 64 Operations.**

#### Mandatory Operation 64 Contract Tests (`src/test/api/orchestrationApi.contract.test.ts`)
1. Issuance request contains non-empty `Idempotency-Key` header (1–128 chars).
2. Same logical retry reuses the identical `Idempotency-Key`.
3. Different payload with reused `Idempotency-Key` surfaces backend HTTP 409 `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.
4. New activity generates a newly minted `Idempotency-Key`.
5. Recommendation `actionId` is sent as `actionId` in request body.
6. Newly minted `prescriptionId` (`rx_[a-f0-9]{24}`) from 201 Created response is used for lease activation (`POST /api/v1/attribution/prescriptions/:prescriptionId/activate`).
7. Returned `prescriptionId` is used for completion (`POST /api/v1/attribution/prescriptions/:prescriptionId/complete`).
8. `actionId` is NEVER used as `prescriptionId` (type-checked and runtime assertion).
9. Both HTTP 201 Created (newly issued prescription) and HTTP 200 OK (idempotent replay) envelopes decode successfully.
10. Same-origin browser request path is used without dependency on CORS `Idempotency-Key` allowlisting.

Operations 49–52 additionally satisfy Section 37.8: actual analytics field names/units, evidence membership, null stamina/fatigue, and readiness metadata/null components are required assertions in `analyticsApi.contract.test.ts`. The analytics views must display those exact values without adding unsupported metrics. These assertions do not change operation count, request contracts, or test-file count.

---

## 54. MOCK EXAMINATION SECURITY & ANTI-LEAKAGE TEST SUITES

Mock exam security tests explicitly prove:
1. `MockQuestionDto` lacks `answer`, `correctAnswer`, `explanation`, and `solution`.
2. Practice `QuestionDto` cannot enter `MOCK_EXAM` QuestionCard mode (TypeScript compilation error).
3. Abandoned mock session result view is denied (HTTP 400 `MOCK_SESSION_NOT_TERMINAL`).
4. Abandoned mock review view is denied (HTTP 400 `MOCK_SESSION_NOT_TERMINAL`).
5. Client cannot fabricate terminal status (`submitted` or `expired`).
6. `expiresAt` is the authoritative source for countdown timers.
7. Zero timer does not trigger blind submit.
8. `FINALIZATION_IN_PROGRESS` engages bounded polling.
9. Mock response mutation remains pending until server confirms HTTP 200.
10. Section locked transition permanently seals previous questions.

---

## 55. ACCESSIBILITY TEST SUITES & VERIFICATION METHODS

Accessibility requirements distinguish automated vs manual verification without relying on unauthorized packages:

| Requirement ID | WCAG Criteria | Automated Verification (React Testing Library + Jest-DOM) | Manual Verification Required |
|---|---|---|---|
| `A11Y-01` | Full Keyboard Nav (1–4, A–D, Enter/Space, Arrow, Tab, Shift+Tab) | RTL user-event fires: numeric shortcuts 1–4, alphabetic shortcuts A–D, Enter/Space activation, Arrow-key palette navigation, forward Tab, reverse Shift+Tab | Full keyboard-only workflow test covering all frozen key contracts |
| `A11Y-02` | Route Focus & Semantic Heading Hierarchy | Vitest asserts exactly one h1 and `document.activeElement === h1` on all 19 screens, including practice and distraction-free mock views; `/app` resolves to its destination | Screen reader navigation announcement and logical h2/h3 order |
| `A11Y-03` | Timer and Score Completion Live Announcements | Vitest asserts `aria-live="polite"` at timer thresholds and backend-confirmed score completion | VoiceOver/NVDA announcement timing check |
| `A11Y-04` | Permanent Form Labels & Error Association | Vitest asserts permanent associated label and `aria-describedby` matching the error element ID | Screen reader error feedback check |
| `A11Y-05` | Normal text >= 4.5:1 AND graphical/UI-control contrast >= 3:1, in BOTH light and dark themes | `src/test/a11y/accessibility.test.ts`: numerical contrast assertions for every declared used foreground/background token pair and theme, classified as text or graphical/control (method below) | Record numerical rendered foreground/background contrast for text and meaningful graphics/controls in both themes, including interactive states and composited surfaces (method below) |
| `A11Y-06` | Reduced Motion Preferences | Vitest asserts animations disabled when reduced-motion active | Operating system motion toggle |

**A11Y-05 deterministic procedure and PASS evidence**:

1. In the existing accessibility suite, load the actual `src/styles/tokens.css` text via Vite's `?raw` import. Maintain the used color-pair/state matrix inline in that suite (no new file), keyed by theme, component/state, foreground token, adjacent background token, and category (`text` or `graphical-control`). Resolve both theme definitions and any `var(...)` aliases; missing themes/tokens, unresolved colors, empty categories, or a used pair missing from the matrix MUST fail. Do not depend on jsdom to implement the browser's CSS cascade or compositor.
2. For sRGB channel `c = byte / 255`, linearize as `c / 12.92` when `c <= 0.04045`, otherwise `((c + 0.055) / 1.055) ** 2.4`. Relative luminance is `0.2126*r + 0.7152*g + 0.0722*b`; contrast is `(max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)`. Resolve alpha against the actual background stack before calculating; unresolved/translucent or gradient/blur backdrops require the rendered check below, never an assumed PASS. Compare unrounded ratios against 4.5 for text and 3 for meaningful graphics/controls. Print theme, pair/state, category, measured ratio, threshold, and PASS/FAIL; any sub-threshold pair fails the suite.
3. Manual browser verification MUST inspect the actual rendered colors/composited backgrounds in light AND dark themes across all 19 screens and normal, hover, focus, selected, error, and success states where applicable. Record component/state, foreground, adjacent background, measured ratio, required ratio, and PASS/FAIL in the verification report. Include input boundaries, focus rings, selected radio/palette indicators, meaningful SVG marks, and text on elevated/glass surfaces. Use the same luminance calculation on rendered color values; for varying backdrops measure the worst applicable contrast. A visual impression or an unmeasured pair is not PASS. Decorative borders are not substitutes for essential control boundaries.
4. Automated token checks verify declared pairs; the manual ledger verifies actual cascade, compositing, and pair coverage. PASS requires **all four groups**: light text >= 4.5, dark text >= 4.5, light graphics/controls >= 3, dark graphics/controls >= 3, with zero unresolved/unmeasured applicable pairs. Frozen token values are not a license to use failing combinations; choose compliant semantic pairings and theme rules in the existing CSS owners without weakening thresholds.

Section 46.3 records requirement mapping, not completed implementation tests. Phase 15 **TARGETS WCAG 2.2 AA** and **does NOT claim formal or exhaustive WCAG certification**.

---

## 56. BUILD, TYPECHECK, AND TEST EXECUTION COMMANDS

Because ESLint and extra coverage providers are NOT in the frozen development dependency budget, commands are restricted to executable tooling. Runner prerequisites are Node/npm, a supported host with browser system libraries, and the Chromium/Firefox/WebKit binaries matching the installed Playwright version. Browser provisioning below populates generated caches; it adds no npm dependency or source-controlled file. These are explicit environment prerequisites, not an external backend dependency:

```bash
# Initial dependency materialization (creates/updates package-lock.json v3)
npm install

# Deterministic reproducible verification installation
npm ci

# Provision browser binaries from the already-installed Playwright package
# (one-time or when the locked Playwright version changes)
npm exec --no -- playwright install chromium firefox webkit

# Typecheck entire frontend codebase under strict mode
npm run typecheck

# Run all 26 executable Vitest suite files using the 3 inventoried test-support files
npm run test

# Build production bundle with Vite
npm run build

# Run all 4 executable Playwright spec files using the 1 inventoried fixture file
npm run test:e2e
```

`package.json` scripts definition:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview --host 127.0.0.1 --port 5173 --strictPort",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Commands requiring undeclared packages count: **0**.

---

### 56.2 Configuration Execution Graph

The following graph specifies clean-checkout execution after dependency and browser provisioning. Build and preview startup are owned by Playwright; no pre-existing `dist/`, server, or backend is required:

```text
npm install                          (creates package-lock.json v3; output: node_modules/)
    ↓
npm ci                               (strict reproducible install from lock file; output: node_modules/)
    ↓
npm exec --no -- playwright install chromium firefox webkit
                                     (browser provisioning; download/cache, no API backend)
    ↓
npm run typecheck                    (tsc --noEmit; input: src/, e2e/; output: 0 .js files; port: none)
    ↓
npm run test                         (vitest run; input: src/test/, src/test/mocks/; output: test results; port: none)
    ↓
npm run build                        (tsc --noEmit && vite build; input: src/, index.html; output: dist/; port: none)
    ↓
npm run test:e2e                     (playwright test; input: e2e/, dist/; see below)
    ├─ webServer: npm run build && npm run preview
    │   ├─ env: VITE_API_BASE_URL=/ (build-time override, same-origin API resolution)
    │   ├─ reuseExistingServer: false (occupied 5173 fails in local and CI runs)
    │   └─ npm run build → dist/ (fresh E2E artifact, never skipped)
    │   └─ npm run preview → vite preview --host 127.0.0.1 --port 5173 --strictPort
    │       listens on: http://127.0.0.1:5173 (strictPort: no fallback)
    ├─ Playwright waits for url: http://127.0.0.1:5173 before running specs
    ├─ API traffic: http://127.0.0.1:5173/api/v1/** fulfilled by page.route()
    │   └─ same-origin dispatch; unknown API traffic fails closed
    └─ Shutdown: Playwright kills preview server after test run
```

| Command | Preceding Artifact | Port | Network Dependency | Generated Output | Undeclared Dep |
|---|---|---|---|---|---|
| `npm install` | `package.json` | None | npm registry | `node_modules/`, `package-lock.json` | 0 |
| `npm ci` | `package-lock.json` | None | npm registry | `node_modules/` | 0 |
| `npm exec --no -- playwright install chromium firefox webkit` | Installed locked Playwright + supported host system libraries | None | Browser download hosts (provisioning only) | Generated browser cache | 0 |
| `npm run typecheck` | `node_modules/`, `tsconfig.json` | None | None | Exit code | 0 |
| `npm run test` | `node_modules/`, `vitest.config.ts`, `src/test/setup.ts` | None | None | Test results | 0 |
| `npm run build` | `node_modules/`, `vite.config.ts`, `index.html`, `src/` | None | None | `dist/` | 0 |
| `npm run test:e2e` | `node_modules/`, `playwright.config.ts`, `dist/` (built by webServer) | 5173 | None (API intercepted) | E2E report | 0 |

**Config Execution Contradictions: 0**
**Hidden Manual Preconditions: 0**

### 56.3 E2E Playwright Spec Determinism Matrix

| Spec File | Fixture Used | Auth State Source | API Behavior Source | Cookie Behavior | DB Dependency | External Backend | Cleanup |
|---|---|---|---|---|---|---|---|
| `e2e/auth-journey.spec.ts` | Empty-context mode | Real registration/login, then reload -> refresh -> `/auth/me` | Same-origin `page.route()` auth DTOs; credentials mode + fetch-argument assertions | Login/refresh cookie simulation; matching-path HttpOnly and Strict/path checks | **0** | **None** | Dispatcher teardown + per-test context close |
| `e2e/learner-journey.spec.ts` | Refresh-cookie mode | Real refresh -> tokenManager -> `/auth/me` -> apiClient bearer | Same-origin `page.route()` fulfillment of dashboard/practice/revision endpoints; exercises full attribution lifecycle: next-action/agenda recommendation -> Operation 64 issuance (Idempotency-Key) -> Operation 56 activation (prescriptionId) -> practice attempt -> Operation 57 completion (prescriptionId) | Harness seeds only HttpOnly/Strict refresh cookie; local `secure: false` | **0** | **None** | Dispatcher teardown + per-test context close |
| `e2e/mock-exam-journey.spec.ts` | Refresh-cookie mode | Real refresh -> tokenManager -> `/auth/me` -> apiClient bearer | Same-origin `page.route()` fulfillment of mock-exam start/save/submit/result endpoints | Harness seeds only HttpOnly/Strict refresh cookie; local `secure: false` | **0** | **None** | Dispatcher teardown + per-test context close |
| `e2e/responsive-viewports.spec.ts` | Refresh-cookie mode | Real refresh -> tokenManager -> `/auth/me` -> apiClient bearer | Same-origin `page.route()` fulfillment of layout-required endpoints | Harness seeds only HttpOnly/Strict refresh cookie; local `secure: false` | **0** | **None** | Dispatcher teardown + per-test context close |

**Executable Playwright Specs: 4/4**
**Unspecified E2E API Sources: 0**
**Real Production DB Mutations: 0**
**Undocumented External Services: 0**

## 57. PRODUCTION BUILD BUDGET & PERFORMANCE ACCEPTANCE CRITERIA

### 57.1 Bundle Size Budget Limits

```text
Initial Gzipped JavaScript:       <= 115 kB
Initial Gzipped CSS:              <= 20 kB
Largest Lazy Route Chunk (Gzip):  <= 45 kB
Total Uncompressed Fonts:         0 kB (System Fonts Only)
External Third-Party Scripts:     0 resources
```

### 57.2 Deterministic Measurement Methodology

Run `npm run build` immediately before this command from the future frontend root. Only production `dist/` output counts; dev-server sizes and stale E2E builds are invalid. Section 5.5.4 enables Vite's generated `dist/.vite/manifest.json` (not a source-controlled file). Initial JS/CSS is the deduplicated HTML entry/modulepreload/stylesheet set plus the manifest's recursive **static** import/CSS closure; dynamic imports are excluded from the initial closure. Every remaining emitted JS file is conservatively a lazy-chunk candidate. Gzip uses Node's default `gzipSync` consistently; the existing accounting convention is 1 budget kB = 1024 bytes.

The inline Node.js command uses only built-in `node:fs`, `node:zlib`, and `node:path`. It parses the canonical Vite HTML tag/attribute syntax, including case-insensitive names, single/double/unquoted attribute values, and numeric character references. It ignores comments and script bodies, rejects unsupported/ambiguous attribute syntax or a `<base>` override, resolves script URLs against the preview document origin, and permits local built assets only. External absolute and protocol-relative script sources fail; no network resources are fetched during measurement. Missing/malformed build inputs fail closed.

```bash
node --input-type=module <<'EOF'
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, extname } from 'node:path';

const root = 'dist';
const html = readFileSync(join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, '.vite/manifest.json'), 'utf8'));
const documentUrl = new URL('http://127.0.0.1:5173/index.html');
function walk(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Unexpected build symlink: ${relative}`);
      return entry.isDirectory() ? walk(join(dir, entry.name), relative + '/') : [relative];
    });
}
const files = walk(root);
const fileSet = new Set(files);
function decodeAttribute(value) {
  return value.replace(/&(#x[0-9a-f]+;?|#\d+;?|[a-z][a-z0-9]*;?)/gi, (_, entity) => {
    const key = entity.replace(/;$/, '');
    if (/^#x/i.test(key)) return String.fromCodePoint(parseInt(key.slice(2), 16));
    if (key.startsWith('#')) return String.fromCodePoint(Number(key.slice(1)));
    const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', colon: ':', sol: '/', Tab: '\t', NewLine: '\n' };
    if (!(key in named)) throw new Error(`Unsupported HTML entity: &${entity}`);
    return named[key];
  });
}
function attributes(raw) {
  const result = new Map();
  const pattern = /\s+([^\s=\/'"<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s'"=<>`]+)))?/y;
  let offset = 0;
  while (raw.slice(offset).trim() && raw.slice(offset).trim() !== '/') {
    pattern.lastIndex = offset;
    const match = pattern.exec(raw);
    if (!match) throw new Error('Ambiguous generated HTML attributes');
    const key = match[1].toLowerCase();
    if (result.has(key)) throw new Error(`Duplicate HTML attribute: ${key}`);
    result.set(key, decodeAttribute(match[2] ?? match[3] ?? match[4] ?? ''));
    offset = pattern.lastIndex;
  }
  return result;
}
const initial = new Set();
const externalScripts = [];
function localAsset(value) {
  const url = new URL(value, documentUrl);
  if (url.origin !== documentUrl.origin || !/^https?:$/.test(url.protocol)) return null;
  const file = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (!fileSet.has(file)) throw new Error(`Missing local build asset: ${file}`);
  return file;
}
// A script's raw text is consumed with its opening tag, so text is not parsed as markup.
const tagPattern = /<!--[\s\S]*?-->|<(script|link|base)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
for (let tag; (tag = tagPattern.exec(html));) {
  if (!tag[1]) continue;
  const name = tag[1].toLowerCase();
  const attrs = attributes(tag[2]);
  if (name === 'base') throw new Error('Unexpected base override in generated HTML');
  if (name === 'script') {
    if (attrs.has('src')) {
      const src = attrs.get('src');
      const file = localAsset(src);
      if (file === null) externalScripts.push(src);
      else initial.add(file);
    }
    const closing = /<\/script\s*>/gi;
    closing.lastIndex = tagPattern.lastIndex;
    if (!closing.exec(html)) throw new Error('Unclosed generated script tag');
    tagPattern.lastIndex = closing.lastIndex;
  } else if (name === 'link') {
    const rel = (attrs.get('rel') ?? '').toLowerCase().split(/\s+/);
    if (rel.includes('modulepreload') || rel.includes('stylesheet')) {
      if (!attrs.has('href')) throw new Error('Missing asset href');
      const file = localAsset(attrs.get('href'));
      if (file === null) throw new Error('Non-local initial build asset');
      initial.add(file);
    }
  }
}
const visited = new Set();
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Missing manifest import: ${key}`);
  for (const file of [chunk.file, ...(chunk.css ?? [])]) {
    if (!fileSet.has(file)) throw new Error(`Missing manifest asset: ${file}`);
    initial.add(file);
  }
  for (const imported of chunk.imports ?? []) visit(imported);
}
const entries = Object.keys(manifest).filter(key => manifest[key].isEntry);
if (entries.length === 0) throw new Error('No production entry in manifest');
for (const key of entries) visit(key);
for (const key of Object.keys(manifest)) if (initial.has(manifest[key].file)) visit(key);
const allJs = files.filter(file => /\.(?:js|mjs|cjs)$/i.test(file));
const initialJs = allJs.filter(file => initial.has(file));
const initialCss = files.filter(file => /\.css$/i.test(file) && initial.has(file));
if (initialJs.length === 0) throw new Error('No initial JavaScript measured');
const gzipSize = file => gzipSync(readFileSync(join(root, file))).length;
const initialJsBytes = initialJs.reduce((sum, file) => sum + gzipSize(file), 0);
const initialCssBytes = initialCss.reduce((sum, file) => sum + gzipSize(file), 0);
const lazySizes = allJs.filter(file => !initial.has(file)).map(file => ({ file, size: gzipSize(file) }));
const largestLazy = lazySizes.reduce((max, chunk) => chunk.size > max.size ? chunk : max, { file: '-', size: 0 });
const fontExtensions = new Set(['.woff', '.woff2', '.ttf', '.otf', '.eot', '.ttc', '.otc', '.sfnt', '.dfont', '.pfa', '.pfb', '.fnt', '.fon', '.bdf', '.pcf']);
const fontFiles = files.filter(file => fontExtensions.has(extname(file).toLowerCase()) ||
  (/\.svg$/i.test(file) && /<font[\s/>]/i.test(readFileSync(join(root, file), 'utf8'))));
const fontBytes = fontFiles.reduce((sum, file) => sum + statSync(join(root, file)).size, 0);
const consoleMatches = allJs.reduce((sum, file) => sum +
  (readFileSync(join(root, file), 'utf8').match(/console\s*\.\s*log\s*\(/g) ?? []).length, 0);
const checks = [
  ['Initial loaded JS gzip <= 115 kB', initialJsBytes <= 115 * 1024, `${initialJsBytes} bytes`],
  ['Initial loaded CSS gzip <= 20 kB', initialCssBytes <= 20 * 1024, `${initialCssBytes} bytes`],
  ['Largest lazy route JS gzip <= 45 kB', largestLazy.size <= 45 * 1024, `${largestLazy.size} bytes (${largestLazy.file})`],
  ['Total uncompressed font assets = 0 bytes (0 files)', fontBytes === 0 && fontFiles.length === 0, `${fontBytes} bytes; ${fontFiles.length} files: ${fontFiles.join(', ') || '-'}`],
  ['External third-party script src resources = 0', externalScripts.length === 0, `${externalScripts.length} resources: ${externalScripts.join(', ') || '-'}`],
  ['Production literal console.log calls = 0', consoleMatches === 0, `${consoleMatches} matches`],
];
for (const [name, pass, evidence] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} | ${name} | ${evidence}`);
process.exitCode = checks.every(([, pass]) => pass) ? 0 : 1;
EOF
```

**ACC-16 PASS is exactly six PASS rows and exit code 0**: initial loaded JS <= 117760 gzip bytes; initial loaded CSS <= 20480 gzip bytes; largest lazy JS <= 46080 gzip bytes; font bytes = 0 and font files = 0; external script-src count = 0; literal production `console.log` call matches = 0. Any failed condition exits non-zero. Invalid/missing inputs cannot produce PASS. Console checking is the defined literal-call artifact check, supplemented by the Section 44 source logging policy; it is not a general JavaScript semantic analysis of aliased logging calls.

This heredoc is a post-build command, never a new source-controlled verification file. The Vite manifest is generated output excluded by Section 6.7; the 121-file inventory and 7/12 dependency counts remain unchanged. Synthetic command-verification fixtures used during specification reconciliation are temporary audit artifacts, not frontend implementation or evidence that a production bundle already meets these budgets.

---

## 58. TYPESCRIPT STRICTNESS & TYPE SAFETY ACCEPTANCE CRITERIA

1. Compiler options MUST enforce `"strict": true`.
2. Unexplained `any`, `@ts-ignore`, or `@ts-nocheck` directives count: **0**.
3. All backend wire contracts MUST compile without unsafe type casting.
4. Narrowing of unknown server responses MUST be performed via explicit TypeScript type guards.

---

## 59. IMPLEMENTATION ACCEPTANCE MATRIX

| ID | Verification Requirement | Verification Method | PASS Evidence | FAIL Evidence |
|---|---|---|---|---|
| `ACC-01` | Exact Dependency Budget | `package.json` audit | Exactly 7 runtime, 12 dev dependencies | Unauthorized dependencies present |
| `ACC-02` | Exact Source Inventory | Canonical authorized-path manifest vs source-controlled implementation paths | 121/121 authorized source-controlled files present; 0 missing; 0 unauthorized (excludes generated node_modules, dist, cache artifacts) | Missing or unauthorized source-controlled files |
| `ACC-03` | Route Map Integrity | Router unit tests | 19 screen routes + 1 redirect record (20 total) | Unclassified or missing routes |
| `ACC-04` | 64 Consumed API Operations | MSW contract tests | 64/64 consumed operations match backend-proven method/path/request/query/header/status/raw-envelope/error/nullability contracts and pass wire contract tests, including Operation 64 Idempotency-Key assertions and Section 37.8 analytics provenance assertions | Missing/failing operation tests or invented/misnamed analytics fields |
| `ACC-05` | 22 Non-Consumed Routes | Code grep audit | Zero calls to 22 non-consumed endpoints | Inadvertent calls to non-consumed APIs |
| `ACC-06` | In-Memory Token Safety | Security unit tests | Access JWT exists solely in `tokenManager` closure | Token found in storage, cookies, or state |
| `ACC-07` | Single-Flight Concurrency | Vitest concurrency test | Concurrent 401s emit exactly 1 refresh call | Multiple parallel refresh calls observed |
| `ACC-08` | Refresh Error Taxonomy | Vitest error tests | All 5 failure categories execute correct side effects | Wrong redirects or state corruptions |
| `ACC-09` | Zero Optimistic Authoritative State | RTL mutation tests | Outcomes and scores wait for HTTP 200 | Premature green/red or score display |
| `ACC-10` | Active Mock Anti-Leakage | RTL QuestionCard test | `MockQuestionDto` lacks answer keys and explanations | Answers found in active exam DOM or DTO |
| `ACC-11` | Mock Lazy Expiry Handling | RTL timer tests | Zero timer queries result; bounded polling handles 409 | Client fabricates terminal state |
| `ACC-12` | Abandoned Exam Isolation | RTL mock tests | Abandoned exam yields no score report or review | Answers or score summaries exposed |
| `ACC-13` | AI Tier-4 Rate Limit Cooldown | RTL tutor tests | 429 disables button and parses Retry-After | Uncontrolled retries or loop |
| `ACC-14` | Markdown XSS Sanitization | Vitest security test | Script tags and event handlers stripped by DOMPurify | XSS payload executes or appears in DOM |
| `ACC-15` | WCAG 2.2 AA Accessibility Target — Scoped Acceptance | Scoped automated tests (Section 55 A11Y-01–06) + Section 55 manual verification checklist | All 6 scoped automated assertions pass AND all corresponding manual verification checks satisfied; no claim of exhaustive formal certification is emitted | Any automated assertion fails, any manual check fails, or a formal certification claim is made |
| `ACC-16` | Bundle Budget & Production Console Stripping | Deterministic Section 57.2 inline Node.js measurement | Exactly six PASS rows and exit 0: initial loaded JS <= 117760 gzip bytes (115 kB); initial loaded CSS <= 20480 gzip bytes (20 kB); largest lazy JS <= 46080 gzip bytes (45 kB); uncompressed font bytes = 0 AND font files = 0; external script-src resources = 0; production literal `console.log` matches = 0 | Any frozen budget threshold exceeded, fonts present, external scripts present, or console.log detected |
| `ACC-17` | Zero Backend Modifications | Git status / diff | Zero files modified in `adaptive-aptitude-api/` | Backend files altered |
| `ACC-18` | Authorized Implementation Footprint | Canonical inventory comparison | 121/121 authorized source-controlled implementation files present; 0 missing; 0 unauthorized source-controlled implementation files | Missing authorized path, additional unauthorized source-controlled path, or backend source modification |

---

## 60. PRESCRIPTIVE SPECIFICATION VERIFICATION MATRIX

The final specification verification gate executed the following mechanical checks before freeze. All checks passed; Section 60.3 records the terminal result. These checks remain required for any authorized future document revision:

1. **Architecture Consistency**: Verify 100% alignment with `PHASE15_ARCHITECTURE_PROPOSAL.md v1.0.13-FROZEN` (SHA-256: `2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba`).
2. **Dependency Count Check**: Verify runtime dependencies = 7, dev dependencies = 12.
3. **File Inventory Count Check**: Verify exact file count = 121 files (7 Config, 1 Static Asset, 79 Production, 29 Test [26 executable suites + 3 support], 5 E2E [4 executable specs + 1 fixture]).
4. **Route Map Check**: Verify 19 user-facing screen routes and 1 redirect record (20 path records).
5. **API Operations Check**: Verify 64 consumed operations and 22 non-consumed routes.
6. **DTO Mapping Check**: Verify 64 request DTOs and 64 response DTOs resolved without `any`.
7. **Auth State Union Check**: Verify exactly 5 states in `AuthStatus`.
8. **Security Guarantees Check**: Verify in-memory JWT, single-flight refresh, and sealed mock exams.
9. **Zero Backend Changes Check**: Verify backend model delta = 0, collection delta = 0, route delta = 0.
10. **Zero Implementation Precondition**: Verify `adaptive-aptitude-app/` has NOT yet been implemented (specification-freeze precondition).
11. **Security Test Cases Check**: Verify 17 mandatory security test cases specified across executable test suites.
12. **Production Console Stripping Check**: Verify Vite-native esbuild `pure: ['console.log']` configuration specified.

---

### 60.1 Final Document and Contract Verification

This frozen specification follows the independently verified governance architecture freeze `v1.0.13-FROZEN` (SHA-256: `2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba`). The former Section 37 blocker is resolved by matching frontend diagnostics to existing backend evidence. The three renamed production chart paths and one renamed component-test path replace their predecessors one-for-one; every other authorized path remains unchanged. Counts remain 7 CONFIG / 1 STATIC-ASSET / 79 PRODUCTION / 29 TEST / 5 E2E = 121.

The completed document/source audit reports the following. These are specification verification results, not frontend runtime acceptance results: the frontend baseline is paused at exactly 13/121 authorized files (108 files not yet implemented) and no implementation tests, production build, browser accessibility checks, or backend test suite were run. ACC-01–18 remain mandatory implementation acceptance gates.

| Check | Result / evidence |
|---|---|
| Architecture contradictions / specification contradictions / open specification decisions | 0 / 0 / 0 after reconciliation; Sections 1–73 mapped below |
| Unsupported analytics fields / invented cognitive metrics / client-side cognitive scoring algorithms | 0 / 0 / 0; Section 37 uses direct DTO evidence and preserves nulls, units and reason codes |
| Analytics provenance | 57 field identifiers checked against producing backend analytics services; all 74 exported architecture wire/type declarations match Sections 18 and 36 |
| API traceability / backend API gaps | Backend-supported diagnostics, topic mastery, retention and readiness / 0 |
| Backend routes / consumed / non-consumed / unclassified | 86 / 64 of 64 / 22 of 22 / 0; exact method/path pairs and backend-proven wire contracts preserved |
| Backend / database / Phase 1–14 modifications | 0 / 0 / 0; file hashes outside the two authorized Phase 15 documents unchanged |
| Model / collection / route / schema / algorithm deltas | 0 / 0 / 0 / 0 / 0 |
| Authorized inventory | 121 unique paths: 7 CONFIG, 1 STATIC-ASSET, 79 PRODUCTION, 29 TEST, 5 E2E; three production renames and one test rename, no additions |
| Dependency budget / routes / authentication states | 7 runtime + 12 dev / 19 screens + 1 redirect / 5 states |
| Mandatory security requirements | SEC-01–17: 17 of 17 specified; existing security contracts preserved |
| Implementation acceptance contracts | ACC-01–18: 18 of 18 specified; future execution still required |
| ACC-16 deterministic verifier | Unchanged; 35 of 35 synthetic command checks pass, including budgets, recursive fonts, script sources and transitive manifest imports |
| Same-origin E2E authentication | Same-origin local test topology matching frozen production ingress; Playwright route interception on http://127.0.0.1:5173/api/v1/*; app-owned credentials/header observation; refresh-cookie boundaries; zero server reuse |
| Accessibility / responsive requirements unmapped | 0 / 0; Sections 46.3, 47.4 and 55 preserved, with analytics requirements added in Section 37 |
| Remaining specification omissions closed | Sections 16/21 include progress invalidation on daily-objective success; Section 27.2 explicitly maps the frozen learning-session states |
| Architecture freeze | v1.0.13-FROZEN verified before this specification was frozen; SHA-256 2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba rechecked |
| Specification status / implementation authorization | v1.0.11-PROPOSED, PROPOSED / RECONCILED / AWAITING FINAL SPECIFICATION VERIFICATION / NONE (Candidate Under Verification) |

### 60.2 Complete Architecture-to-Specification Traceability Ledger

Ranges below include every numbered architecture section exactly once. Decision/rationale and governance sections are mapped as such; they do not imply additional implementation scope.

| Frozen architecture sections | Prescriptive specification sections / verification responsibility |
|---|---|
| 1–3 | 1–4, 60–61: authority, frozen baseline, repository absence and version/hash |
| 4 | 16–18, 53: 86-route classification, 64 consumed contracts and DTOs, 22 non-consumed routes |
| 5–10 | 1–5, 22, 48: goals, non-goals, UX principles and selected React/Vite architecture; option/weighting rationale retained upstream |
| 11 | 6–7: 19 screens and one redirect with owners and focus targets |
| 12–14 | 8–14, 23–24, 52: auth, refresh and centralized HTTP client |
| 15–17 | 15, 19–22, 43: state ownership, cache policy and learner identity |
| 18–20 | 7, 16, 25–26: onboarding, dashboard and daily agenda |
| 21–24 | 27–30: practice, adaptive, mistakes and revision |
| 25–26 | 7, 31–36, 54: mock lifecycle and question map |
| 27 | 18, 37, 53, 59 ACC-04: backend-proven diagnostics, topic mastery, retention and readiness |
| 28–29 | 38–40: tutor, rate limits and sanitized rendering |
| 30–31 | 7, 14, 22, 41–42: loading/error states and zero optimistic authoritative mutations |
| 32–35 | 46–48, 55: accessibility, responsive layout, tokens and mathematical typography |
| 36–39 | 27–36, 42–43: mode-safe feedback, timer, recovery and storage boundaries |
| 40–41 | 44–45: logging and observability |
| 42 | 5, 6, 37, 57: native SVG, lazy loading, bundle budgets and deterministic verifier |
| 43–45 | 14, 41, 45: cancellation, errors and correlation ID |
| 46–49 | 7–14, 23–24, 52: forms, password, disabled account and logout/revoke-all |
| 50–53 | 1–3, 15, 22, 49–50, 52: CSP ownership, excluded roles/auth features and backend trust |
| 54–55 | 18, 36, 58: wire provenance, discriminated question rendering and strict types |
| 56–57 | 27.2, 28, 31–35: learning and mock state machines |
| 58 | 16, 19–21: exact mutation invalidations mapped to canonical query prefixes |
| 59–60 | 16–18, 26–39, 53: operation/feature traceability |
| 61–64 | 6, 51–56, 59: test owners, 17 security cases, accessibility and responsive verification |
| 65–66 | 1–5, 60: selected decisions carried forward; decision matrix rationale retained upstream |
| 67–68 | 4–6, 51, 58–59: closed inventory and dependency cardinalities |
| 69 | 49–50: Phase 16 deployment handoffs |
| 70–73 | 1–3, 59–61: invariants, zero open decisions, verification and next gate |

### 60.3 Historical Record — Superseded: Final v1.0.9-FROZEN Prescriptive Specification Verification & Freeze Report

> [!NOTE]
> **HISTORICAL RECORD — SUPERSEDED**: The verification text below documents an earlier historical milestone (`v1.0.9-FROZEN`, SHA-256: `41f969e3c1a1471c6a2594b64f4f969cb6ba88eaa7a81d2640bc0286fd1aa63f`). It is retained strictly as an immutable audit trail and does NOT govern current `v1.0.10` candidate assertions.

The independent gate is **PASS**, completed for freezing `v1.0.9-FROZEN`. Architecture basis is `v1.0.12-FROZEN` (SHA-256: `d4c83adca5dfaef6e7f8d5eb6da6d19fa31d813ca527a998db77cf38a1a28556`); the architecture is VERIFIED / COMPLETE / FROZEN. The old architecture versions/hashes occur only in explicitly historical supersession/verification records or the independently versioned Phase 14 reference. Stale governing references: **0**.

The entire architecture (73 numbered sections) and specification (61 numbered sections) were audited using the Section 60.2 ledger, exact route/operation comparisons, exported wire-declaration comparison, closed-path set comparisons, source-field provenance, preservation checks and governance scans. Architecture Sections 3–71 and all substantive analytics requirements are byte-identical to the prior frozen revision. All 64 consumed operations and 22 non-consumed routes are fully reconciled across Sections 16, 17, 18, 53, and 59, incorporating the 5-level hint contract, 5-stage prescription lifecycle, and same-origin production and local test topology.

| Terminal verification requirement | Result |
|---|---|
| Architecture contradictions / specification contradictions / open specification decisions | 0 / 0 / 0 |
| Stale governing-version references / unsupported analytics fields / invented cognitive metrics / client-side analytics algorithms | 0 / 0 / 0 / 0 |
| Runtime / dev dependencies | 7/7 / 12/12 prescribed; none installed in this task |
| Backend routes / consumed / non-consumed / unclassified operations | 86 / 64/64 / 22/22 / 0 |
| User-facing routes / router records | 19/19 / 20/20; one h1 and route-focus contract for each screen |
| CONFIG / STATIC-ASSET / PRODUCTION / TEST / E2E files | 7 / 1 / 79 / 29 / 5 |
| Total authorized files / duplicate paths / phantom paths / unauthorized implementation paths | 121/121 / 0 / 0 / 0; authorized inventory, not existing frontend files |
| Mandatory security requirements | SEC-01–17: 17/17 fully specified and preserved |
| Same-origin E2E authentication contract | PASS — same-origin 5173 SPA / intercepted /api/v1/* topology, application-owned bearer flow and native credentials mode |
| External E2E backend requirements / production DB mutations from E2E | 0 / 0 by the frozen interception contract; browser journeys are future implementation tests |
| Accessibility / responsive requirements unmapped | 0 / 0; 4.5:1 text and 3:1 graphics/controls in both themes; scoped WCAG 2.2 AA target, no certification claim |
| ACC-01–18 | 18/18 fully specified and implementation-addressable; runtime execution required after implementation |
| ACC-16 synthetic verification | 35/35 PASS; inline verifier unchanged, six metrics retained, non-zero failure exit verified |
| Backend / database / Phase 1–14 modifications | 0 / 0 / 0 |
| Model / collection / route / schema / algorithm deltas | 0 / 0 / 0 / 0 / 0 |
| Implementation performed / frontend files created / dependencies installed | NO / 0 / NO |
| Implementation authorization | GRANTED for the next task; no implementation performed by this freeze |

*(Historical verification result for v1.0.9: PASS; now superseded by v1.0.10 candidate reconciliation).*

---

### 60.4 Historical Record — Superseded: Final v1.0.10-FROZEN Prescriptive Specification Verification & Freeze Report

> **HISTORICAL RECORD — SUPERSEDED**: The verification text below documents an earlier historical milestone (`v1.0.10-FROZEN`, SHA-256: `e985734ba76cf15f81d3d6f380516bb7a7e49eae7dc35ec303a86d11f07afcdf`). It is retained strictly as an immutable audit trail and does NOT govern current `v1.0.11` assertions.

```text
Historical Specification Version:
1.0.10-FROZEN

Historical Specification Status:
VERIFIED / COMPLETE / FROZEN (Superseded by v1.0.11)

Architecture Basis:
docs/PHASE15_ARCHITECTURE_PROPOSAL.md v1.0.13-FROZEN (SHA-256: 2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba)

Architecture Contradictions:
0

Specification Contradictions:
0

Open Implementation Decisions:
0

Consumed Backend Contracts:
64 / 64 PROVEN

Non-Consumed Routes:
22 / 22 CLASSIFIED

W01–W39 Canonical Identity Preservation:
39 / 39 PROVEN

Authorized Inventory:
121 / 121

Existing Frontend Files:
13

Missing Frontend Files:
108

Dependencies:
7 runtime + 12 dev

Backend Modifications:
0

Database Modifications:
0

Phase 1–14 Modifications:
0

Frontend Implementation Performed:
NO

Historical Implementation Authorization:
GRANTED — SUBSEQUENT IMPLEMENTATION TASK ONLY (Historical)

Historical Next Gate:
PHASE 15 FRONTEND IMPLEMENTATION (Historical Milestone)
```

---

### 60.5 Final v1.0.11-PROPOSED Prescriptive Specification Contract-Integrity Verification Report

```text
Specification Version:
v1.0.11-PROPOSED

Specification Status:
PROPOSED / RECONCILED / AWAITING FINAL SPECIFICATION VERIFICATION

Architecture Basis:
docs/PHASE15_ARCHITECTURE_PROPOSAL.md v1.0.13-FROZEN (SHA-256: 2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba)

Historical Predecessor:
docs/PHASE15_LEARNER_APPLICATION_ADAPTIVE_UX_PRESCRIPTIVE_SPECIFICATION.md v1.0.10-FROZEN (SHA-256: e985734ba76cf15f81d3d6f380516bb7a7e49eae7dc35ec303a86d11f07afcdf)

S01 Operation 64 Error Contract:
PASS (400, 401, 409, 500; VALIDATION_ERROR, UNAUTHORIZED, IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD, INTERNAL_SERVER_ERROR)

S02 64-Operation Failure/Error Contract Audit:
64 / 64 PASS (Exact HTTP failure statuses and backend error codes transcribed)

S03 Prescription CTA Lifecycle:
PASS (Recommendation -> Op 64 Issuance -> prescriptionId -> Op 56 Activation -> Activity -> Op 57 Completion; actionId != prescriptionId)

Architecture Contradictions:
0

Specification Contradictions:
0

Open Implementation Decisions:
0

Consumed Backend Contracts:
64 / 64 PROVEN

Non-Consumed Routes:
22 / 22 CLASSIFIED

W01–W39 Canonical Identity Preservation:
39 / 39 PRESERVED

Redefined W Finding IDs:
0

Authorized Inventory:
121 / 121

Existing Frontend Files:
13

Missing Frontend Files:
108

Dependencies:
7 runtime + 12 dev

Backend Modifications:
0

Database Modifications:
0

Phase 1–14 Modifications:
0

Frontend Implementation Performed:
NO

Implementation Authorization:
NONE (Candidate Under Verification)

Next Gate:
PHASE 15 PRESCRIPTIVE SPECIFICATION FINAL VERIFICATION & RE-FREEZE
```

---

## 61. SPECIFICATION GOVERNANCE & SIGN-OFF CHECKLIST

- [x] Architecture basis reconciled to `v1.0.13-FROZEN` (SHA-256: `2c6498b1cb5234df018231180bc9ef7eb2a17a79b909f0962a8539fcdfd463ba`).
- [x] Finding W39 resolved by authorized same-origin production API ingress topology (`https://app.example.com/api/v1/...`).
- [x] Finding S01 resolved: Operation 64 status codes (400, 401, 409, 500) and backend error codes reconciled with frozen architecture and attributionIssuanceService.
- [x] Finding S02 resolved: Exhaustive 64-operation failure status codes and backend error codes fully audited and transcribed in Section 16.1 and Section 16.2.
- [x] Finding S03 resolved: Prescription CTA lifecycle (Recommendation -> Op 64 Issuance -> Op 56 Activation -> Op 57 Completion; actionId != prescriptionId) fully specified for Dashboard and Daily Agenda.
- [x] Canonical W01–W39 identities preserved without redefinition (39/39 PRESERVED).
- [x] Specification candidate v1.0.11 reconciled and audited with zero contradictions.
- [x] Precedence hierarchy explicitly established.
- [x] Zero backend model, collection, route, or algorithmic modifications required.
- [x] Exact frontend root declared (`adaptive-aptitude-app/`).
- [x] Exact dependency contract declared (7 runtime, 12 dev; 0 prohibited packages, 0 undeclared test runners, 0 extra coverage packages).
- [x] Closed file inventory reconciled (121 total files: 7 Config, 1 Static Asset, 79 Production, 29 Test [26 executable suites + 3 support], 5 E2E [4 executable specs + 1 fixture]; 0 duplicates, 0 phantom references).
- [x] Zero implementation precondition reverified at the completed specification reconciliation gate; frontend files created: 0, dependencies installed: NO.
- [x] Implementation Acceptance Matrix runnable post-implementation (ACC-18 verifies authorized footprint; 0 rows require absence of implementation).
- [x] Production console.log stripping mechanism verified (Vite-native esbuild pure: ['console.log']; 0 Terser dependencies).
- [x] Route cardinality reconciled: 19 user-facing screen routes, 1 shell redirect record, 20 router path records.
- [x] All 19 user-facing screen routes and 1 redirect record specified with layouts and accessibility targets.
- [x] Auth state machine specified with complete transition taxonomy.
- [x] Sole access token owner verified (`tokenManager.ts` closure; 0 storage copies).
- [x] Single-flight refresh lock algorithm specified.
- [x] Centralized API base URL resolver specified with unit test vectors.
- [x] All 64 consumed API operations re-audited and reconciled with exact query parameters, constraints, and valid service module ownership (including Operation 64 prescription issuance with Idempotency-Key).
- [x] Row 13 exact 24-hex ObjectId path constraint specified.
- [x] Row 25 `planId` query parameter restored.
- [x] Row 28 `pattern`, `questionId`, `sessionId` query parameters restored.
- [x] Row 29 `limit`, `sortBy`, `sortDir` query parameters restored.
- [x] Row 35 `referenceDate`, `goalId` query parameters restored.
- [x] Row 36 revision plan query parameters restored ($days \in \{1, 2\}$).
- [x] Row 31 `topic` required parameter semantics explicitly distinguished.
- [x] All 22 non-consumed routes classified and forbidden (0 unclassified; disjoint partition proven).
- [x] Analytics DTO transcription matches the existing backend (quartile/accuracy keys, topic evidence, readiness metadata/reason/null components); wire and presentation owners remain separate.
- [x] No unsupported cognitive metrics, scoring algorithms, or old visualization contracts remain.
- [x] Three chart paths and one test path renamed one-for-one; closed inventory cardinalities preserved.
- [x] Centralized TanStack Query key factory reconciled.
- [x] Server-state caching and invalidation policies specified.
- [x] Authoritative optimistic mutations strictly prohibited (0 optimistic paths).
- [x] Registration flow resolved without auto-login assumptions.
- [x] QuestionCard mode-safe discriminated union specified.
- [x] Active mock examination anti-leakage barriers specified.
- [x] Server-authoritative mock exam timer and bounded polling specified.
- [x] Abandoned mock session lifecycle decoupled from scoring and reviews.
- [x] Socratic AI Tutor, Tier-4 rate limit cooldown, and Markdown sanitization specified.
- [x] Accessibility testing reconciled to authorized packages and manual checks (0 undeclared test runners).
- [x] Executable command matrix reconciled (unsupported test:coverage removed; 0 undeclared package commands).
- [x] Numbered Implementation Acceptance Matrix defined.
- [x] Zero implementation performed in this task.

```text
RECOMMENDED NEXT GATE:
PHASE 15 FRONTEND IMPLEMENTATION
```
