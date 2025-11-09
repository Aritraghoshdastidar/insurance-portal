# Quick Start Guide - Insurance Automation System

## 🚀 Fastest Way to Get Started (Docker - Recommended)

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Steps

1. **Clone and navigate to project**
```bash
cd all_features_combined
```

2. **Copy environment file**
```bash
copy .env.example .env
```

3. **Start all services with one command**
```bash
docker-compose up -d
```

4. **Check if services are running**
```bash
docker-compose ps
```

5. **View logs (optional)**
```bash
docker-compose logs -f
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs
- Health Check: http://localhost:3001/health

### Stop Services
```bash
docker-compose down
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up --build -d
```

---

## 💻 Manual Installation (Windows)

### Prerequisites
- Node.js 18+ (Download from https://nodejs.org/)
- MySQL 8.0+ (Download from https://dev.mysql.com/downloads/mysql/)

### Step 1: Database Setup

1. **Start MySQL**
```powershell
net start MySQL80
```

2. **Login to MySQL**
```powershell
mysql -u root -p
```

3. **Create database and user**
```sql
CREATE DATABASE insurance_db_dev;
CREATE USER 'insurance_app'@'localhost' IDENTIFIED BY 'app_password_123';
GRANT ALL PRIVILEGES ON insurance_db_dev.* TO 'insurance_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

4. **Import database schema**
```powershell
mysql -u insurance_app -p insurance_db_dev < database_scripts\insurance_db_dev_backup.sql
```

### Step 2: Backend Setup

1. **Install dependencies**
```powershell
npm install
```

2. **Copy environment file**
```powershell
copy .env.example .env
```

3. **Edit .env file** (use Notepad or VS Code)
- Update database credentials if different
- Keep JWT_SECRET as is for development

4. **Start backend server**
```powershell
npm start
```

Backend should now be running on http://localhost:3001

### Step 3: Frontend Setup

Open a **NEW PowerShell window**:

1. **Navigate to frontend directory**
```powershell
cd insurance-frontend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Start frontend**
```powershell
npm start
```

Frontend will open automatically at http://localhost:3000

---

## 🧪 Testing the Installation

### 1. Health Check
Open browser: http://localhost:3001/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### 2. API Documentation
Open browser: http://localhost:3001/api-docs

You should see the Swagger UI with all API endpoints.

### 3. Login Test

**Admin Login:**
- Email: `admin@insurance.com`
- Password: Check database or create new admin

**Customer Registration:**
- Go to http://localhost:3000/register
- Fill in the form
- Login with created credentials

---

## 🔧 Common Issues & Solutions

### Issue: Port 3000 or 3001 already in use

**Solution (Windows):**
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Issue: Cannot connect to database

**Solution:**
1. Check if MySQL is running:
```powershell
net start MySQL80
```

2. Verify credentials in `.env` file

3. Test connection manually:
```powershell
mysql -u insurance_app -p insurance_db_dev
```

### Issue: npm install fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue: Docker containers won't start

**Solution:**
```powershell
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up --build -d
```

---

## 📚 Next Steps

1. **Explore the API Documentation**
   - Visit: http://localhost:3001/api-docs
   - Try out different endpoints
   - Use the "Try it out" feature

2. **Test the Frontend**
   - Register a new customer
   - Browse policies
   - File a claim
   - Check dashboard

3. **Admin Panel**
   - Login as admin
   - View pending claims
   - Manage workflows
   - View analytics

4. **Read Documentation**
   - `README_INDUSTRY_STANDARD.md` - Complete guide
   - `docs/API.md` - API reference
   - `TRANSFORMATION_SUMMARY.md` - What's new

---

## 🆘 Getting Help

If you encounter any issues:

1. Check the logs:
```powershell
# Backend logs
type logs\combined.log

# Docker logs
docker-compose logs backend
```

2. Verify environment variables:
```powershell
type .env
```

3. Check system requirements:
- Node.js: `node --version` (should be 18+)
- npm: `npm --version`
- MySQL: `mysql --version`

4. Restart everything:
```powershell
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)
# Restart both from Step 2 & 3
```

---

## 🎉 Success!

If everything is working, you should see:
- ✅ Frontend at http://localhost:3000
- ✅ Backend at http://localhost:3001
- ✅ API Docs at http://localhost:3001/api-docs
- ✅ Database connected
- ✅ No errors in console

**Welcome to the Industry-Standard Insurance Automation System!**

---

For detailed documentation, see `README_INDUSTRY_STANDARD.md`
