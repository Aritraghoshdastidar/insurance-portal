# Insurance Workflow Automation System - Setup Instructions

## Prerequisites
Before you begin, make sure you have the following installed:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MySQL Server 8.0** - [Download here](https://dev.mysql.com/downloads/mysql/)
3. **Git** (optional, for version control)

## Step 1: Extract the Project
Extract the ZIP file to your desired location (e.g., `C:\Projects\insurance-archita`)

## Step 2: Database Setup

### 2.1 Create MySQL User
Open MySQL command line or MySQL Workbench and run:

```sql
-- Create the database user
CREATE USER 'insurance_app'@'localhost' IDENTIFIED BY 'app_password_123';

-- Create the database
CREATE DATABASE IF NOT EXISTS insurance_db_dev;

-- Grant permissions
GRANT ALL PRIVILEGES ON insurance_db_dev.* TO 'insurance_app'@'localhost';
FLUSH PRIVILEGES;
```

### 2.2 Import Database Backup
Using PowerShell (Windows):
```powershell
cd path\to\insurance-archita
Get-Content database_scripts\insurance_db_dev_backup.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u insurance_app -papp_password_123 insurance_db_dev
```

Or using Command Prompt:
```cmd
cd path\to\insurance-archita
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u insurance_app -papp_password_123 insurance_db_dev < database_scripts\insurance_db_dev_backup.sql
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following content:

```env
JWT_SECRET=your_super_secret_key_12345
DB_USER=insurance_app
DB_PASSWORD=app_password_123
```

## Step 4: Install Dependencies

### 4.1 Backend Dependencies
```powershell
# In the root directory
npm install
```

### 4.2 Frontend Dependencies
```powershell
# Navigate to frontend directory
cd insurance-frontend
npm install
cd ..
```

## Step 5: Start the Application

### 5.1 Start Backend Server
Open a terminal in the root directory:
```powershell
node server.js
```
You should see: `Server running on port 3001`

### 5.2 Start Frontend Development Server
Open a **NEW** terminal in the frontend directory:
```powershell
cd insurance-frontend
npm start
```
The app will open automatically at `http://localhost:3000`

## Step 6: Login to the Application

### Test Accounts

#### Admin Account
- Navigate to: `http://localhost:3000/login`
- Check "Login as Admin" checkbox
- Email: *(Check your database for admin credentials)*
- Dashboard: `/admin-dashboard`

#### Customer Account
- Navigate to: `http://localhost:3000/login`
- Email: `customer@test.com`
- Password: `password123`
- Dashboard: `/dashboard`

## Testing

Run backend tests:
```powershell
npm test
```

Run frontend tests:
```powershell
cd insurance-frontend
npm test
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `services.msc` (Windows) and check MySQL80 service
- Test connection: `mysql -u insurance_app -papp_password_123 insurance_db_dev`
- Check that database user has correct permissions

### Port Already in Use
- Backend (3001): Change port in `server.js` (line 18)
- Frontend (3000): React will prompt to use a different port

### Missing Dependencies
```powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install

# Same for frontend
cd insurance-frontend
rm -r node_modules
npm install
```

## Project Structure

```
insurance-archita/
├── server.js                 # Backend server (Express)
├── package.json             # Backend dependencies
├── .env                     # Environment variables (CREATE THIS)
├── database_scripts/        # SQL backup files
├── __tests__/              # Backend tests
├── insurance-frontend/     # React frontend
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   └── ...
│   ├── package.json        # Frontend dependencies
│   └── public/
└── uploads/                # File upload directory
```

## Important Notes

1. **DO NOT commit `.env` file** - It contains sensitive credentials
2. **node_modules/** folders are excluded from the ZIP (they're large)
3. **MySQL must be running** before starting the backend server
4. The database backup includes sample data for testing
5. Backend runs on port 3001, frontend on port 3000

## Features

- User Authentication (JWT)
- Customer Dashboard (Policies, Claims, Notifications)
- Admin Dashboard (Pending Approvals, Workflow Management)
- Visual Workflow Designer
- Document Processing
- High Risk Alerts
- Workflow Metrics & Reports

## Support

For issues or questions, refer to:
- Backend logs in the terminal running `node server.js`
- Frontend console in browser DevTools (F12)
- Check database connection with test script: `node test_mysql_connection.js`
