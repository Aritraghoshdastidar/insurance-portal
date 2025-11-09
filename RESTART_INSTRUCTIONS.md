# 🔄 RESTART REQUIRED - Policy Approval Workflow

## ⚠️ CRITICAL: Backend Server Must Be Restarted

The changes we made to `server.js` are **NOT active** until you restart the Node.js backend server!

### Why?
- We modified the payment endpoints to use the approval workflow
- Added `autoEvaluatePolicy()` function
- Changed status flow: Payment → UNDERWRITER_REVIEW → PENDING_INITIAL_APPROVAL
- Node.js caches the old code until restarted

---

## 🛠️ How to Restart the Backend

### Option 1: If running in a terminal
1. Find the terminal running `node server.js` or `npm start`
2. Press `Ctrl+C` to stop it
3. Run: `node server.js` (or `npm start`)

### Option 2: If running as a background process
```powershell
# Find the Node process
Get-Process -Name node

# Kill it (replace PID with actual process ID)
Stop-Process -Id <PID>

# Or kill all Node processes
Stop-Process -Name node -Force

# Then restart
cd C:\Users\aritr\all_features_combined
node server.js
```

### Option 3: Restart VS Code Terminal
1. Open VS Code terminal
2. Click the trash icon to kill terminal
3. Open new terminal
4. Run: `node server.js`

---

## ✅ After Restart - Testing Checklist

### 1. Test Policy Purchase Workflow
- Customer side: Buy a policy (choose any type)
- Click "Activate (Mock Pay)"
- **Expected**: Status changes to "PENDING INITIAL APPROVAL" (not ACTIVE)
- **Old behavior**: Would show "ACTIVE" immediately ❌

### 2. Test Admin Dashboard
- Admin side: Go to Admin Dashboard
- **Expected**: See policy in "Pending Policy Approvals" section
- Should show: Policy ID, Type, Premium, Status: PENDING_INITIAL_APPROVAL

### 3. Test Claim Approval Refresh
- Customer side: Click the refresh button (🔄) in top right
- **Expected**: Claims change from PENDING → APPROVED/DECLINED

---

## 🎯 What Changed

### Backend (`server.js`)
1. **Payment Endpoints Modified**:
   - `/api/policies/:policyId/mock-activate` (line ~770)
   - `/api/policies/:policyId/initial-payment` (line ~850)
   - Both now set status to `UNDERWRITER_REVIEW` → auto-evaluate → `PENDING_INITIAL_APPROVAL`

2. **New Function Added** (line ~1162):
   - `autoEvaluatePolicy()` - Automatically applies business rules
   - Premium ≤ $50k → Auto-approve to PENDING_INITIAL_APPROVAL
   - Premium > $1M → Auto-deny to DENIED_UNDERWRITER

3. **Database Schema Updated**:
   - Added statuses: `UNDERWRITER_REVIEW`, `DENIED_UNDERWRITER`
   - Status ENUM now has 8 values (was 6)

### Frontend (`Dashboard.js`)
1. **Added Refresh Button**: 🔄 icon in top right corner
2. **Updated Status Colors**: Now handles UNDERWRITER_REVIEW, DENIED_UNDERWRITER
3. **Better Messages**: Shows "Processing..." and appropriate success messages

### Frontend (`AdminDashboard.js`)
1. **Fixed Array Bug**: Now handles backend returning arrays directly
2. **Shows Both**: Pending claims AND pending policy approvals

---

## 🧪 Quick Test Commands

```powershell
# Check current policy statuses
node check_policy_statuses.js

# Check current claim statuses  
node check_claims.js

# Test the approval workflow
node test_approval_workflow.js
```

---

## 📊 Expected Workflow After Restart

```
Customer Actions:
1. Buy Policy → Status: INACTIVE_AWAITING_PAYMENT
2. Click "Activate (Mock Pay)" → Status: PENDING_INITIAL_APPROVAL
   (Premium ≤ $50k auto-approved by underwriter)

Admin Actions:
3. Admin Dashboard shows policy in "Pending Policy Approvals"
4. Admin clicks "Initial Approve" → Status: PENDING_FINAL_APPROVAL
5. Security Officer clicks "Final Approve" → Status: ACTIVE
```

---

## 🐛 Troubleshooting

### Problem: Still showing ACTIVE immediately
- **Cause**: Server not restarted
- **Solution**: Kill Node process and restart

### Problem: Error "status not in ENUM"
- **Cause**: Database migration didn't run
- **Solution**: Run `node add_policy_statuses.js` again

### Problem: Claims still showing PENDING
- **Cause**: Frontend not refreshed
- **Solution**: Click refresh button (🔄) or hard refresh page (Ctrl+F5)

### Problem: No policies in "Pending Policy Approvals"
- **Cause**: Old policies were already activated
- **Solution**: Buy a NEW policy after restart

---

## 🎉 Success Indicators

✅ New policies don't go ACTIVE immediately  
✅ Admin dashboard shows pending policy approvals  
✅ Claims refresh when clicking 🔄 button  
✅ Console shows: "Auto-evaluated policy POL_XXX: APPROVE (UNDERWRITER_REVIEW → PENDING_INITIAL_APPROVAL)"  

---

## 📞 Need Help?

If issues persist after restart:
1. Check server console for errors
2. Run: `node check_policy_statuses.js`
3. Verify no "ACTIVE" policies were created in last 5 minutes
4. Check browser console (F12) for frontend errors
