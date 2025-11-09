# 🧪 Quick Testing Guide - Notification System

## Prerequisites
- Server running on port 3001 ✅
- Frontend running on port 3000
- Browser with notification permission granted

## Step-by-Step Testing

### 1. Test Welcome Notification (Registration)

**Steps:**
1. Open http://localhost:3000
2. Click "New User? Register Here"
3. Fill registration form:
   - Name: "Test Customer"
   - Email: "test" + timestamp + "@example.com"
   - Password: "test123"
   - Phone: "1234567890"
4. Click "Register"

**Expected Results:**
- ✅ Registration successful
- ✅ Redirected to dashboard
- ✅ Browser push notification: "Welcome to InsuranceFlow..."
- ✅ NotificationBell shows badge with "1"
- ✅ Click bell to see welcome message in dropdown

---

### 2. Test Policy Purchase Notification

**Steps:**
1. From dashboard, scroll to "Available Policies"
2. Click "Buy New Policy" button (large purple gradient button)
3. Select any policy template
4. Click "Confirm Purchase"

**Expected Results:**
- ✅ Policy created
- ✅ Browser push notification: "Policy POL_BUY_... has been successfully purchased"
- ✅ NotificationBell badge increments
- ✅ Notification appears in dropdown with policy icon

---

### 3. Test Payment Notification

**Steps:**
1. After buying policy, you'll see "INACTIVE_AWAITING_PAYMENT"
2. Click "Make Initial Payment" button
3. Confirm mock payment

**Expected Results:**
- ✅ Payment successful
- ✅ Browser push notification: "Payment of ₹... received for policy..."
- ✅ NotificationBell badge increments
- ✅ Notification shows payment icon and amount

---

### 4. Test Policy Approval Notification

**Steps:**
1. Logout from customer account
2. Navigate to http://localhost:3000/admin/login
3. Login as admin:
   - Email: admin@insurance.com
   - Password: admin123
4. Find the policy in "Pending Initial Approval"
5. Click "Approve" button
6. If required, login as Security Officer and approve again:
   - Email: security.officer@insurance.com
   - Password: security
7. Logout and login back as customer

**Expected Results:**
- ✅ Customer receives browser push: "Great news! Your policy has been approved..."
- ✅ NotificationBell badge shows new notification
- ✅ Notification with green checkmark icon

---

### 5. Test Claim Submission Notification

**Steps:**
1. From customer dashboard, click "File Claim"
2. Select an ACTIVE policy
3. Fill claim details:
   - Description: "Medical treatment"
   - Amount: 5000
4. Click "Submit Claim"

**Expected Results:**
- ✅ Claim submitted successfully
- ✅ Browser push notification: "Your claim CLM_... has been successfully submitted..."
- ✅ NotificationBell badge increments
- ✅ Notification shows claim icon

---

### 6. Test Claim Approval/Decline Notification

**Steps:**
1. Logout and login as admin
2. Navigate to Admin Dashboard
3. Find the claim in "Pending Claims"
4. Click either "Approve" or "Decline"
5. Logout and login back as customer

**Expected Results (if Approved):**
- ✅ Browser push: "Congratulations! Your claim has been APPROVED for ₹5000"
- ✅ NotificationBell updates
- ✅ Notification shows amount and green icon

**Expected Results (if Declined):**
- ✅ Browser push: "Your claim has been declined"
- ✅ NotificationBell updates
- ✅ Notification shows reason and red icon

---

## Visual Verification Checklist

### Buy Policy Button
- [x] Button is larger than before
- [x] Purple gradient background (#667eea to #764ba2)
- [x] Text says "Buy New Policy"
- [x] Font size 1.1rem
- [x] Purple glow shadow
- [x] Hover effect: button lifts up slightly

### Notification Bell
- [x] Bell icon visible in header (next to user email)
- [x] Red badge shows unread count
- [x] Click opens dropdown menu
- [x] Scrollable list of notifications
- [x] Each notification shows icon based on type
- [x] Time ago displayed (Just now, 5m ago, etc.)
- [x] "Mark as Read" button per notification
- [x] "Mark All Read" button at bottom
- [x] "Clear All" button at bottom

### Browser Push Notifications
- [x] Permission requested on first visit
- [x] Push notification appears in system tray/notification center
- [x] Shows InsuranceFlow logo
- [x] Message matches database entry
- [x] Clicking notification focuses browser window

---

## Real-time Testing

### Socket.io Connection Test

**Open Browser Console (F12):**
```
Expected logs:
✅ Connected to notification server
```

**Trigger any notification action:**
- Watch console for real-time event
- Notification should appear INSTANTLY (< 1 second)

### Backend Console Test

**Watch Server Terminal:**
```
Expected logs:
✅ Notification sent to customer CUST_...: [message]
Client connected: [socket_id]
```

---

## Database Verification

**Query to check notifications:**
```sql
SELECT * FROM notification 
WHERE customer_id = 'YOUR_CUSTOMER_ID' 
ORDER BY sent_timestamp DESC 
LIMIT 10;
```

**Expected columns:**
- notification_id
- customer_id
- message (full text)
- type (WELCOME, POLICY_CREATED, CLAIM_APPROVED, etc.)
- sent_timestamp
- read_status (0 = unread, 1 = read)

---

## Troubleshooting

### No Notifications Appearing

1. **Check Browser Console:**
   - Look for "Connected to notification server" message
   - If missing, check if server is running on port 3001

2. **Check Server Console:**
   - Look for "✅ Notification sent to customer..." logs
   - If missing, notification helper not being called

3. **Check Browser Permission:**
   - Look for blocked notification icon in address bar
   - Go to browser settings → Notifications → Allow localhost

### Notifications Delayed

1. **Socket Not Connected:**
   - Refresh page to reconnect
   - Check CORS errors in browser console

2. **Database Query Slow:**
   - Add index on customer_id column
   - Check MySQL query logs

### Badge Not Updating

1. **Frontend State Issue:**
   - Open React DevTools
   - Check NotificationBell component state
   - Verify unreadCount updates

2. **LocalStorage Full:**
   - Open Application tab in DevTools
   - Clear old notifications
   - Run `notificationService.clearAll()`

---

## Performance Testing

### Load Test
1. Create 10 notifications rapidly
2. Check if all appear in bell dropdown
3. Verify no lag in UI
4. Check server memory usage

### Stress Test
1. Connect 5 browser tabs simultaneously
2. Trigger notification from one tab
3. Verify all tabs receive notification
4. Check for socket connection leaks in server console

---

## Success Criteria

✅ All 6 notification types working
✅ Real-time delivery < 1 second
✅ Browser push notifications appear
✅ NotificationBell badge accurate
✅ Mark as read functionality works
✅ Clear all removes notifications
✅ Buy Policy button prominently displayed
✅ No console errors
✅ No server errors
✅ Database entries correct

---

## Quick Demo Script

**For Presentations:**

1. Start at landing page (http://localhost:3000)
2. Register new user → Watch welcome notification
3. Login → See notification bell
4. Click bell → Show welcome message
5. Buy policy → Watch policy purchase notification
6. Pay for policy → Watch payment notification
7. File claim → Watch claim submission notification
8. Switch to admin → Approve claim
9. Switch back to customer → Watch claim approval notification
10. Show all notifications in bell dropdown
11. Demonstrate "Mark All Read"
12. Highlight large "Buy New Policy" button

**Talking Points:**
- "Real-time push notifications for every important event"
- "Customers always know the status of their policies and claims"
- "Beautiful UI with type-specific icons"
- "Browser push notifications work even when app is in background"
- "Socket.io ensures instant delivery"

---

## Next Steps

After testing, consider:
- [ ] Add more notification types (document upload, payment reminders)
- [ ] Implement email notifications
- [ ] Add SMS notifications
- [ ] Create admin notification dashboard
- [ ] Add notification preferences (allow users to choose which notifications to receive)
- [ ] Implement notification sound effects
- [ ] Add rich notifications with action buttons

---

**Testing Status**: READY TO TEST ✅
**Server Status**: RUNNING ✅
**Socket.io Status**: CONNECTED ✅
**Frontend Status**: READY ✅

Happy Testing! 🎉
