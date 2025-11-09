# Software Test Plan (STP) – Insurance Workflow Automation System

Project: Insurance Workflow Automation System (IWAS)
Version: 1.0
Authors: ARITRA - PES1UG23AM064, ARCHITA - PES1UG23AM063, BSHRIKRISHNA - PES1UG23AM075, BHARGAVI - PES1UG23AM077
Date: 09-11-2025
Status: Final (for branch feat/features_combined)

---

## 1. Introduction
- Purpose: This document defines the test plan for IWAS v1.0. It outlines objectives, scope, strategy, resources, environment, and responsibilities for testing.
- Objectives: Validate functional correctness of policy, claims, payments, notifications, and analytics workflows; ensure non-functional requirements are met where applicable; achieve and maintain ≥ 75% code coverage across statements, branches, functions, and lines.
- References:
  - TEST_COMPLIANCE_REPORT.md (coverage + test summary)
  - docs/API.md (API surface)

## 2. Scope
- In-Scope Functional Areas:
  - Authentication & Authorization (JWT)
  - Customer registration and login
  - Policy lifecycle (create/update/renew, buy/activate via mock payment)
  - Claims submission, triage, and approval workflow (Adjuster/Admin)
  - Notifications and alerts (risk alerts, SLA/overdue tasks)
  - Analytics/metrics dashboards
  - Payments (mock activation endpoint)
- Out of Scope (for this iteration):
  - Real third‑party payment gateway integration
  - External regulator data ingestion
  - Hardware peripherals (printers/scanners)

## 3. Test Items
- Backend (Node.js/Express): Routes and services
  - Routes: `authRoutes`, `customerRoutes`, `policyRoutes`, `claimRoutes`, `paymentRoutes`, `analyticsRoutes`
  - Services: `authService`, `paymentService`, `analyticsService`, `notificationService`, `premiumCalculatorService`
  - Utilities/Middleware: `auth`, `validation`, `rateLimiter`, `errorHandler`, `logger`, `errors`
- Frontend (React): Key components and flows
  - `Dashboard`, `AdminDashboard`, `AdjusterDashboard`, `HighRiskAlerts`, `OverdueTasksReport`, `LoginPage`, `WorkflowMetricsDashboard`, `BuyPolicy`, `LandingPage`, `Layout`

## 4. Features to be Tested
- INS-F-001: Customer registration and authentication (JWT, protected routes)
- INS-F-010: Policy creation, update, renewal, and activation (mock payment)
- INS-F-020: Premium payment and receipt confirmation (mock activation API)
- INS-F-030: Claim submission, assignment, and approval workflow (adjuster/admin)
- INS-F-040: Notifications, high‑risk alerts, and overdue/SLA tracking
- INS-F-050: Analytics dashboards and workflow metrics
- INS-NF-001: System response time target ≤ 5s (best‑effort checks)
- INS-NF-002: Data security and access control (JWT validation, role checks)

## 5. Features Not to be Tested
- Third‑party payment gateway APIs (real transactions)
- External regulator data integration
- Hardware‑related dependencies (printers, scanners)

## 6. Test Approach / Strategy
### Levels
- Unit Testing
  - Frontend: Jest + React Testing Library (RTL); state, rendering, conditional branches
  - Backend: Jest + Supertest (controllers/middleware/services with stubs/mocks)
- Integration Testing
  - Frontend: Router + page/component integration (navigation, auth redirects)
  - Backend: Express app with Supertest using random port; DB layer mocked via `mysql2/promise`
- System Testing (End‑to‑End Scenarios via composed tests)
  - Policy activation flow (user click → mock API → status update)
  - Claim workflow (submission → assignment → approval/decline)
  - Risk/overdue alerts surfacing to dashboards
- UAT (Planned)
  - Scripted scenarios for stakeholders on stable build; sign‑off criteria below

### Types
- Functional testing (happy paths + negative/error handling)
- Regression testing (CI/local pre‑commit runs)
- Security testing (JWT presence/validation, protected routes)
- Performance smoke (basic latency assertions; deeper load tests deferred)

### Tooling
- Test Runners/Libraries: Jest, React Testing Library, Supertest
- Mocking: jest.mock (fetch/axios, jwt, mysql2/promise, socket.io client as needed)
- Coverage: Istanbul (via Jest) with per‑file visibility
- Reports: Text summary + lcov (frontend `insurance-frontend/coverage/`)

### Entry Criteria
- Build compiles; test env/config available; mock/stub endpoints ready
- Backend exports `app` or provides start on random port for Supertest
- Seed/mocked data available; authentication tokens handled in tests

### Exit Criteria
- All tests pass (unit + integration + system where applicable)
- Coverage thresholds met: ≥ 75% for statements, branches, functions, lines
- No open Critical/High defects; Medium mitigated or accepted
- TEST_COMPLIANCE_REPORT.md updated for this iteration

## 7. Test Environment
- OS: Windows (developer machines); CI: GitHub hosted runners (if enabled)
- Backend: Node.js (LTS), Express, MySQL (mocked for tests)
- Frontend: React (create‑react‑app), jsdom via RTL
- Datastore: MySQL 8.x (mocked using `mysql2/promise` in tests)
- Browsers: jsdom for unit/integration; real browser E2E deferred
- Config: `.env` for tokens/URLs; tests set random ports

## 8. Test Data
- Dummy customers, policies, claims, payments
- Sample claim document (`uploads/sample_claim_document.txt`)
- Mock API responses for policies/claims/alerts/overdue tasks
- JWT tokens (fake) for protected route testing

## 9. Test Deliverables
- Test Cases & Suites: `__tests__/` (backend), `insurance-frontend/src/**/*.test.js` (frontend)
- Execution Logs: Jest output, console logs (captured), CI logs (if enabled)
- Coverage Reports: root and `insurance-frontend/coverage/`
- Reports: `TEST_COMPLIANCE_REPORT.md`, this STP (`docs/Software_Test_Plan_STP.md`)
- Defect Reports: GitHub Issues/PR comments (project repo)

## 10. Roles and Responsibilities
- QA Lead: Plan, monitor, report (coverage gates, release readiness)
- Test Engineers: Author tests, automate, execute, and triage failures
- Developers: Fix defects, support testability (export app, dependency injection)
- Project Owner: Approve test results, go/no‑go decisions

## 11. Risks and Mitigation
| Risk | Mitigation |
|------|------------|
| Delay in stable build delivery | Request early smoke builds; feature flags; modular merges |
| Dependency on external APIs/services | Use local mocks/stubs and contract tests |
| Test env downtime/instability | Use ephemeral ports/mocks; keep environment scripts/versioned |
| Flaky async/tests with timers | Use `waitFor`, increase timeouts, avoid brittle timing, fake timers where needed |
| Router/library deprecation warnings | Track upgrades; suppress noisy warnings in tests when safe |

## 12. Schedule & Milestones
- Unit/Integration coverage uplift: complete (this branch)
- System scenarios: covered via composed tests; dedicated E2E (Cypress) planned
- UAT window: to be scheduled post‑merge to `main`

## 13. Acceptance Criteria / Approvals
- Coverage (global): Statements 93.51%, Branches 83.62%, Functions 87.41%, Lines 94.49%
- Per‑file coverage: ≥ 75% branches for measured UI components (e.g., Dashboard 80.23%, LoginPage 91.66%, HighRiskAlerts 92.85%, OverdueTasksReport 85.71%, AdjusterDashboard 81.81%)
- Test suites: Frontend 20/20 passing; Backend 4/4 passing (29 tests)

Approvals:
- QA Lead – pending
- Dev Lead – pending
- Project Owner – pending
