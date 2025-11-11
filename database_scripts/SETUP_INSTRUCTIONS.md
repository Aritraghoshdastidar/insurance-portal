# Database Setup Instructions

## Overview
Your friend needs to set up the database with **one main file** + optional advanced features:
1. **Complete clone** (from `insurance_db_dev_backup.sql`) — REQUIRED
2. **Advanced features** (from `SETUP_COMPLETE_DB.sql`) — OPTIONAL

---

## Quick Setup (One Command!)

### Step 1: Create Database & User (one-time)
```sql
CREATE DATABASE insurance_db_dev;
CREATE USER 'insurance_app'@'localhost' IDENTIFIED BY 'app_password_123';
GRANT ALL PRIVILEGES ON insurance_db_dev.* TO 'insurance_app'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Import Complete Database Clone
```powershell
mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/insurance_db_dev_backup.sql
```

**This single file gives you everything for core functionality**:
- ✅ All 17 tables (customer, policy, claim, payment, administrator, workflows, audit_log, etc.)
- ✅ Two-stage approval workflow (PENDING_INITIAL_APPROVAL → PENDING_FINAL_APPROVAL → ACTIVE)
- ✅ Workflow designer integration (claim.workflow_id, workflow_steps)
- ✅ All triggers (claim status updates, payment reminders, agent auto-assignment)
- ✅ Sample data (2 admins, 20+ customers, 9 policies, 10 claims, 20 payments)
- ✅ Stored procedures and events
- ✅ **This is an exact clone of the working database** — ready to use!

### Step 3: (OPTIONAL) Import Advanced Features
**Only run this if your backend uses analytics/fraud/recurring billing**:
```powershell
mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/SETUP_COMPLETE_DB.sql
```

This adds extra tables for:
- ✅ In-app notifications system
- ✅ Recurring payment setup
- ✅ Refunds tracking
- ✅ Fraud detection scores
- ✅ Analytics views
- ✅ Additional admin (Security Officer)

### Step 4: Verify Setup
```powershell
mysql -u insurance_app -papp_password_123 insurance_db_dev -e "SHOW TABLES; SELECT COUNT(*) FROM customer; SELECT COUNT(*) FROM policy;"
```

Expected output: ~20 tables, 20+ customers, 9 policies.

---

## Docker Setup (Even Easier!)

If using Docker Compose, the complete database clone is **automatically imported** on first startup!

```powershell
npm run docker:up
```

Docker will:
1. Create MySQL container
2. Auto-import `insurance_db_dev_backup.sql` (complete clone)
3. Start backend + frontend
4. Everything ready at `http://localhost:3000`

**To add advanced features after Docker starts**:
```powershell
docker exec -i insurance_mysql mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/SETUP_COMPLETE_DB.sql
```

---

## What Each Script Provides

### `insurance_db_dev_backup.sql` (REQUIRED — Complete Clone)
**This is an exact copy of the working database** with all core features:
- ✅ Customer/Admin authentication (bcrypt hashed passwords)
- ✅ Policy management with two-stage approval workflow
- ✅ Claims processing with workflow designer integration
- ✅ Payments tracking and history
- ✅ Agents and beneficiaries
- ✅ Email/SMS reminder system with triggers
- ✅ Audit log for sensitive actions
- ✅ 17 tables, all triggers, stored procedures, sample test data

**Frontend/Backend features that work immediately**:
- Login/registration (customer & admin)
- Policy purchase, initial approval, final approval, activation
- Claim submission with workflow routing
- Payment processing
- Workflow designer (visual flow editor)
- Dashboard with policies/claims
- Admin approval workflows

---

### `SETUP_COMPLETE_DB.sql` (OPTIONAL but recommended)

**Advanced features** — only needed if backend uses these APIs:

| Feature | Tables Added | Backend Services Using It |
|---------|--------------|---------------------------|
| In-app notifications | `notifications` | `notificationService`, dashboard bell icon |
| Recurring billing | `recurring_payment_setup`, `recurring_payments` | `paymentController.setupRecurring()` |
| Refunds | `refunds` | `paymentController.processRefund()` |
| Fraud detection | `fraud_risk_scores` | `claimController.detectFraud()` |
| Premium quotes | `premium_calculations` | `premiumController.calculatePremium()` |
| Invoices | `invoices` | `paymentController.generateInvoice()` |
| Analytics views | `v_active_recurring_payments`, etc. | `analyticsController` |

**Impact if skipped**:
- Backend endpoints referencing these tables will return 500 errors
- Analytics dashboard will fail
- Recurring payment features won't work

**Check if you need it**:
```powershell
grep -r "recurring_payment" src/
grep -r "fraud_risk_score" src/
grep -r "notifications" src/controllers/
```

If matches found → run `SETUP_COMPLETE_DB.sql`.

---

## Feature-to-Migration Mapping

| Backend Feature | Required Migration | Can Skip? |
|-----------------|-------------------|-----------|
| Customer login/register | Core backup only | ❌ No |
| Policy approval workflow | Core backup only | ❌ No |
| Claims submission | Core backup only | ❌ No |
| Payments | Core backup only | ❌ No |
| In-app notifications | Advanced features | ✅ Yes, if not using notification bell |
| Recurring billing | Advanced features | ✅ Yes, if no autopay |
| Refund processing | Advanced features | ✅ Yes, if no refund API |
| Fraud detection | Advanced features | ✅ Yes, if claims don't check risk scores |
| Analytics dashboards | Advanced features | ✅ Yes, if not showing metrics |

---

## Quick Verification Commands

After setup, verify key features:

### 1. Check Admin Accounts
```sql
SELECT admin_id, name, email, role FROM administrator;
```
Expected: ADM001, ADM002 (and ADM003 if advanced features imported).

### 2. Check Policies with Workflow
```sql
SELECT policy_id, status, initial_approver_id, final_approver_id FROM policy LIMIT 5;
```
Should show two-stage approval columns.

### 3. Check Claims with Workflow
```sql
SELECT claim_id, workflow_id, current_step_order, risk_score FROM claim LIMIT 5;
```
Should show workflow linkage.

### 4. Check Advanced Features (if imported)
```sql
SHOW TABLES LIKE '%notification%';
SHOW TABLES LIKE '%recurring%';
SHOW TABLES LIKE '%fraud%';
```
Should return 3+ tables if advanced migration ran.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Table 'notifications' doesn't exist` | Advanced features not imported | Run `SETUP_COMPLETE_DB.sql` |
| `Unknown column 'fraud_risk_score' in 'field list'` | Column not added to `claim` table | Re-run `SETUP_COMPLETE_DB.sql` (uses `ADD COLUMN IF NOT EXISTS`) |
| `Duplicate entry 'ADM003'` | Security officer already exists | Safe to ignore or use `INSERT IGNORE` |
| Foreign key constraint fails | Core backup not imported first | Import `insurance_db_dev_backup.sql` before advanced features |

---

## Minimal Setup (Just to Get Login Working)

If your friend just wants to test **login/register** without all features:

```powershell
# 1. Create DB
mysql -u root -p -e "CREATE DATABASE insurance_db_dev; CREATE USER 'insurance_app'@'localhost' IDENTIFIED BY 'app_password_123'; GRANT ALL PRIVILEGES ON insurance_db_dev.* TO 'insurance_app'@'localhost'; FLUSH PRIVILEGES;"

# 2. Import core only
mysql -u insurance_app -papp_password_123 insurance_db_dev < database_scripts/insurance_db_dev_backup.sql

# 3. Set admin password
node set_adm001_password.js
```

Login credentials:
- Admin: `admin@insurance.com` / `admin123`
- Customer: Register new via signup page

---

## Summary

**Core backup** = **Must have** for any usage.  
**Advanced features** = **Nice to have** for analytics/recurring billing/fraud detection.

Tell your friend:
1. Always run `insurance_db_dev_backup.sql` first.
2. If backend errors mention missing tables (notifications, recurring_*, fraud_*, etc.), run `SETUP_COMPLETE_DB.sql`.
3. Set admin password via `node set_adm001_password.js` after DB import.
4. Register a fresh customer account (seeded customers have empty passwords).
