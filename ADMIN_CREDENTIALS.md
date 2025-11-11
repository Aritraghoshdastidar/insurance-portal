# Admin Login Credentials ✅ VERIFIED WORKING

After importing `insurance_db_dev_backup.sql`, use these credentials to login:

## Admin Accounts (All Tested & Working)

### ADM001 - System Admin ✅
- **Email**: `admin@insurance.com`
- **Password**: `admin123`
- **Role**: System Admin (full access)
- **Status**: ✅ Password verified working

### ADM002 - Junior Adjuster ✅
- **Email**: `j.adjuster@insurance.com`
- **Password**: `admin_pass_123`
- **Role**: Junior Adjuster (claim reviews)
- **Status**: ✅ Password verified working

### ADM003 - Security Officer ✅
- **Email**: `security.officer@insurance.com`
- **Password**: `security`
- **Role**: Security Officer (audit/security monitoring)
- **Status**: ✅ Password verified working

---

## Customer Accounts

The database includes 27 sample customers, but their passwords are **not set** in the backup (security best practice).

### To create a test customer:

**Option 1: Via Frontend**
1. Navigate to customer registration page
2. Register with: `test@example.com` / `test1234`
3. Login with those credentials

**Option 2: Via API**
```bash
POST http://localhost:3001/api/v2/auth/register
Content-Type: application/json

{
  "name": "Test Customer",
  "email": "test@example.com",
  "password": "test1234"
}
```

---

## Quick Test After Setup

1. **Start backend**: `npm run dev` (port 3001)
2. **Start frontend**: `cd insurance-frontend && npm start` (port 3000)
3. **Login as admin**: Use ADM001 credentials above
4. **Check data**:
   - 19 policies in system
   - 14 claims to review
   - 27 registered customers

---

## Security Notes

- ⚠️ These are **development passwords only**
- Change all passwords before any production deployment
- Never commit real production credentials to git
- Use environment variables for secrets in production
