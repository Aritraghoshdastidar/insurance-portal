# Insurance workflow automation software

**Project ID:** P04  
**Course:** UE23CS341A  
**Academic Year:** 2025  
**Semester:** 5th Sem  
**Campus:** RR  
**Branch:** AIML  
**Section:** B  
**Team:** Logicore

## 📋 Project Description

This app has insurance companies and users who want to get insurance as users. This should be able to 2/4 wheeler and personal healthcare ploicies.

This repository contains the source code and documentation for the Insurance workflow automation software project, developed as part of the UE23CS341A course at PES University.

## 🧑‍💻 Development Team (Logicore)

- [@Aritraghoshdastidar](https://github.com/Aritraghoshdastidar) - Scrum Master
- [@bshrikrishna](https://github.com/bshrikrishna) - Developer Team
- [@archi829](https://github.com/archi829) - Developer Team
- [@pes1ug23am077-aiml](https://github.com/pes1ug23am077-aiml) - Developer Team

## 👨‍🏫 Teaching Assistant

- [@Amrutha-PES](https://github.com/Amrutha-PES)
- [@VenomBlood1207](https://github.com/VenomBlood1207)

## 👨‍⚖️ Faculty Supervisor

- [@Arpitha035](https://github.com/Arpitha035)


## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- Docker & Docker Compose (optional but recommended)
- MySQL 8.x running locally (default dev DB name: `insurance_db_dev`)
- Redis (optional for caching/notifications)
- Git

### Environment Variables
Create a `.env` file in the project root (sample keys shown):
```
DB_HOST=localhost
DB_USER=insurance_app
DB_PASSWORD=app_password_123
DB_NAME=insurance_db_dev
JWT_SECRET=dev_jwt_secret
JWT_REFRESH_SECRET=dev_refresh_secret
PORT=3001
FRONTEND_URL=http://localhost:3000
``` 
Adjust values as needed. Do NOT commit real secrets.

### Installation (Backend + Frontend)
1. Clone the repository
   ```powershell
   git clone https://github.com/pestechnology/PESU_RR_AIML_B_P04_Insurance_workflow_automation_software_Logicore.git
   cd PESU_RR_AIML_B_P04_Insurance_workflow_automation_software_Logicore
   ```
2. Install backend (auto-installs frontend via `postinstall`):
   ```powershell
   npm install
   ```
3. (If needed) Install frontend directly:
   ```powershell
   cd insurance-frontend
   npm install
   cd ..
   ```

### Database Setup

**Complete setup in 3 steps**:

1. **Create DB & User**:
```sql
CREATE DATABASE insurance_db_dev;
CREATE USER 'insurance_app'@'localhost' IDENTIFIED BY 'app_password_123';
GRANT ALL PRIVILEGES ON insurance_db_dev.* TO 'insurance_app'@'localhost';
FLUSH PRIVILEGES;
```

2. **Import Core Schema** (REQUIRED — base tables, triggers, seed data):
```powershell
mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/insurance_db_dev_backup.sql
```

3. **Import Advanced Features** (OPTIONAL — analytics, recurring billing, fraud detection):
```powershell
mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/SETUP_COMPLETE_DB.sql
```

**What's included**:
- Core backup: Customer/admin tables, policies, claims, payments, two-stage approval workflow, 20+ sample records.
- Advanced features: In-app notifications, recurring payments, refunds, fraud detection, analytics views.

**Skip advanced features** if you only need login/policy/claim basics. See `database_scripts/SETUP_INSTRUCTIONS.md` for details.

**Verification**:
```powershell
mysql -u insurance_app -papp_password_123 insurance_db_dev -e "SHOW TABLES; SELECT COUNT(*) FROM customer;"
```
Expected: ~20 tables, 20+ customers.

### Running (Local Dev)
Backend (Express API):
```powershell
npm run dev   # nodemon app.js on port 3001 (default)
```
Frontend (React):
```powershell
cd insurance-frontend; npm start
```
The React dev server proxies API calls to `http://localhost:3001` (configured via `proxy` in frontend `package.json`).

### Running with Docker
Build & start containers:
```powershell
npm run docker:build
npm run docker:up
```
View logs:
```powershell
npm run docker:logs
```
Shutdown:
```powershell
npm run docker:down
```

### Useful Scripts
```powershell
npm test          # Backend + frontend tests with coverage
npm run test:ci   # Same as above (CI usage)
npm run lint      # Lint backend sources
npm run lint:fix  # Auto-fix
```

### Authentication Flow
- Customer registers via `POST /api/v2/auth/register` → returns token + refreshToken.
- Login endpoints:
  - Customer: `POST /api/v2/auth/login`
  - Admin: `POST /api/v2/auth/admin/login`
- Use `Authorization: Bearer <token>` on protected routes.
- Refresh: `POST /api/v2/auth/refresh` with `refreshToken`.

### Sample / Demo Credentials
You can either create fresh accounts or use seeded records from the SQL dump.

Admin (set password using script):
```powershell
node set_adm001_password.js
# Outputs admin email + password (default script sets admin123)
```
- Email: `admin@insurance.com`
- Password (after script): `admin123`

Customer (from seed data – set your own password by registering a new one, or update an existing row):
Register a new customer:
```bash
POST /api/v2/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test1234"
}
```
Then login:
```bash
POST /api/v2/auth/login
{
  "email": "test@example.com",
  "password": "test1234"
}
```

### Frontend Usage Tips
- Login pages: Customer and Admin have separate routes/components (`LoginPage`, `AdminLoginPage`).
- After login the JWT is stored (check your implementation – typically localStorage or in-memory).
- Some screens may need seeded policies/claims (already present in dev SQL dump).

### Testing & Coverage
Minimum coverage threshold is 75% (statements, branches, lines, functions). Current branch exceeds this.
To run only backend tests:
```powershell
npm run test:unit
```
Full stack tests + coverage (already configured):
```powershell
npm test
```
Coverage reports:
- Backend: `coverage/`
- Frontend: `insurance-frontend/coverage/`

### Troubleshooting
| Issue | Fix |
|-------|-----|
| Cannot connect to MySQL | Verify `.env` DB credentials and that MySQL is running. |
| JWT invalid / 401 | Ensure `Authorization: Bearer <token>` header and correct `JWT_SECRET`. |
| CORS errors | Set `FRONTEND_URL` to match React dev server origin. |
| Admin login fails | Run `node set_adm001_password.js` to (re)set ADM001 password. |
| Frontend API 404 | Start backend (`npm run dev`) before frontend; confirm proxy in frontend `package.json`. |

### Security Notes
- Do not push real secrets or production DB credentials.
- Rotate JWT secrets before production deployment.
- Enforce HTTPS and stronger password policies for production.

### Roadmap (Condensed)
- Add role-based UI restrictions.
- Implement password reset UI (backend email flow scaffolded in `notificationService`).
- Add Cypress E2E tests.
- Container healthchecks & production Dockerfile hardening.

---
If you encounter a setup issue not covered here, open an issue or create a short failing reproduction and tag the team.

## 📁 Project Structure

```
PESU_RR_AIML_B_P04_Insurance_workflow_automation_software_Logicore/
├── src/                 # Source code
├── docs/               # Documentation
├── tests/              # Test files
├── .github/            # GitHub workflows and templates
├── README.md          # This file
└── ...
```

## 🛠️ Development Guidelines

### Branching Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Commit Messages
Follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test-related changes

### Code Review Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Create Pull Request to `develop`
4. Request review from team members
5. Merge after approval

## 📚 Documentation

- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📄 License

This project is developed for educational purposes as part of the PES University UE23CS341A curriculum.

---

**Course:** UE23CS341A  
**Institution:** PES University  
**Academic Year:** 2025  
**Semester:** 5th Sem


## CI/CD Pipeline

This project uses a 6-stage CI/CD pipeline implemented with GitHub Actions to ensure code quality and create a deployment artifact. The pipeline runs on every push to the `main` or `fix/correct-ci-workflow` branches.

### 1. Build
* **Job:** `build`
* **Action:** Installs all `npm` dependencies for both the backend (root) and the `insurance-frontend` using `npm ci`.

### 2. Test
* **Job:** `test`
* **Needs:** `build`
* **Action:** Runs the full test suite (`npm test`) for both backend and frontend.

### 3. Coverage
* **Job:** `coverage`
* **Needs:** `build`
* **Action:** Runs `npm test -- --coverage` for both backend and frontend.
* **Quality Gate:** This job will fail if the total test coverage (lines, statements, branches, functions) is **less than 75%** (this is configured in `jest.config.js` and `insurance-frontend/package.json` in the `fix/correct-ci-workflow` branch).
* **Artifact:** Uploads the `backend-coverage-report` and `frontend-coverage-report` artifacts.

### 4. Lint
* **Job:** `lint`
* **Needs:** `build`
* **Action:** Runs `npm run lint` for both backend and frontend to check for code style and syntax errors.
* **Artifact:** Uploads the `backend-lint-report` and `frontend-lint-report` artifacts.

### 5. Security Audit
* **Job:** `security`
* **Needs:** `build`
* **Action:** Runs `npm audit --json` for both backend and frontend to check for known security vulnerabilities in dependencies.
* **Artifact:** Uploads the `backend-security-report` and `frontend-security-report` artifacts.

### 6. Create Deployment Artifact
* **Job:** `create-artifact`
* **Needs:** `test`, `coverage`, `lint`, `security` (Runs only if all previous CI stages pass)
* **Action:** Downloads all generated reports (coverage, lint, security), zips them together with the entire source code (excluding `node_modules`), and uploads the final `deployment-artifact.zip`.
