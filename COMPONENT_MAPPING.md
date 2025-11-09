# Component Mapping - Frontend Structure

## Overview
This document shows which components are available in Customer Dashboard vs Admin Dashboard, and how to access them.

---

## 🔵 Customer Dashboard Components

### Accessible via Navigation Menu:
1. **Dashboard** (`/dashboard`)
   - View: Notifications, My Policies, My Claims, File Claim form
   - Features: Policy activation, claim filing, status tracking

2. **Buy Policy** (`/buy-policy`)
   - View: 6 Interactive policy cards (Life, Health, Auto, Home)
   - Features: Coverage customization, premium calculator, 3-step purchase wizard
   - Policies Available:
     - Life Insurance - Basic ($50-$1M coverage)
     - Life Insurance - Premium ($100K-$5M coverage)
     - Health Insurance - Individual ($25K-$500K coverage)
     - Health Insurance - Family ($100K-$2M coverage)
     - Auto Insurance - Comprehensive ($10K-$200K coverage)
     - Home Insurance - Standard ($50K-$1M coverage)

3. **File Claim** (`/file-claim`)
   - View: Claim submission form
   - Features: Policy ID, description, amount input

4. **My Policies** (`/dashboard`)
   - View: Embedded in main Dashboard
   - Features: View all owned policies with status

5. **Overdue Tasks** (`/overdue-tasks`)
   - View: Report of overdue tasks (shared with admin)
   - Features: Task tracking, deadline monitoring

---

## 🔴 Admin Dashboard Components

### Accessible via Admin Navigation Menu:

1. **Admin Dashboard** (`/admin-dashboard`)
   - View: Pending Policies, Pending Claims tables
   - Features: 
     - Approve/Decline policies (Security Officer role required)
     - Approve/Decline claims
     - Status tracking with color-coded chips

2. **Workflows** (`/admin/workflows`)
   - View: List of all workflows
   - Features: Create, edit, delete workflows
   - Navigation: Links to Workflow Editor and Designer

3. **Workflow Editor** (`/admin/workflow-editor/:workflowId`)
   - View: Form-based workflow configuration
   - Features: Edit workflow steps, rules, assignments

4. **Workflow Designer** (`/admin/workflow-designer/:workflowId`)
   - View: Visual drag-and-drop workflow builder (ReactFlow)
   - Features: Node-based workflow design, custom nodes

5. **Metrics Dashboard** (`/workflow-metrics`)
   - View: Workflow performance metrics and analytics
   - Features: Charts, statistics, performance tracking
   - Purpose: Monitor workflow efficiency

6. **High Risk Alerts** (`/high-risk-alerts`)
   - View: List of high-risk policies/claims
   - Features: Risk assessment, fraud detection alerts
   - Purpose: Identify suspicious activities

7. **Adjuster Dashboard** (`/adjuster-dashboard`)
   - View: Claims assigned to adjusters
   - Features: Claim assignment tracking, adjuster workload
   - Purpose: Manage claim adjusters

8. **Document Processor** (`/document-processor`)
   - View: Intelligent document upload and processing
   - Features: OCR, document extraction, automated data entry
   - Purpose: Process insurance documents automatically

9. **Overdue Tasks** (`/overdue-tasks`)
   - View: Report of overdue tasks
   - Features: Task tracking (shared with customers)

---

## 📊 Component Classification

### Customer-Only Components:
- Dashboard (customer view)
- Buy Policy
- File Claim

### Admin-Only Components:
- AdminDashboard
- WorkflowList
- WorkflowEditor
- WorkflowDesigner
- WorkflowMetricsDashboard
- HighRiskAlerts
- AdjusterDashboard
- DocumentProcessor

### Shared Components:
- OverdueTasksReport (accessible by both)
- LoginPage
- RegistrationPage
- Layout (wrapper for all authenticated pages)

---

## 🎨 Material-UI Converted Components

### ✅ Fully Converted:
1. **Layout.js** - AppBar, Drawer, navigation with Material-UI
2. **Dashboard.js** - Cards, Tables, Chips, Buttons
3. **AdminDashboard.js** - Cards, Tables, Buttons, Chips
4. **BuyPolicy.js** - Cards, Dialog, Stepper, Slider, Select, Material-UI icons

### ⏳ Not Yet Converted (Still using basic HTML/CSS):
1. **FileClaim.js** - Basic HTML form
2. **WorkflowList.js** - Basic HTML table
3. **WorkflowEditor.js** - Basic form
4. **WorkflowDesigner.js** - ReactFlow (already has good UI)
5. **WorkflowMetricsDashboard.js** - Basic HTML
6. **HighRiskAlerts.js** - Basic HTML table
7. **AdjusterDashboard.js** - Basic HTML table
8. **DocumentProcessor.js** - Basic HTML form
9. **OverdueTasksReport.js** - Basic HTML table

---

## 🚀 How to Access Components

### As Customer:
1. Login with customer account
2. Navigation drawer shows:
   - Dashboard
   - Buy Policy
   - File Claim
   - My Policies
   - Overdue Tasks

### As Admin:
1. Login with admin account (isAdmin: true)
2. Navigation drawer shows:
   - Admin Dashboard
   - Pending Claims
   - Workflows
   - Metrics Dashboard
   - High Risk Alerts
   - Overdue Tasks
   - Adjuster Dashboard
   - Document Processor

---

## 🔧 Technical Notes

### Authentication & Authorization:
- **Customer Routes**: Require valid JWT token
- **Admin Routes**: Require `requireAdmin=true` + valid JWT with `isAdmin: true`
- **Protected Route Component**: Wraps all authenticated routes with Layout

### Route Structure:
```javascript
// Customer Routes
/dashboard          → Dashboard component
/buy-policy         → BuyPolicy component
/file-claim         → FileClaim component

// Admin Routes
/admin-dashboard    → AdminDashboard component
/admin/workflows    → WorkflowList component
/admin/workflow-editor/:id → WorkflowEditor component
/admin/workflow-designer/:id → WorkflowDesigner component
/workflow-metrics   → WorkflowMetricsDashboard component
/high-risk-alerts   → HighRiskAlerts component
/adjuster-dashboard → AdjusterDashboard component
/document-processor → DocumentProcessor component

// Shared Routes
/overdue-tasks      → OverdueTasksReport component
```

### Navigation Icons:
- Dashboard: DashboardIcon
- Buy Policy: ShoppingCart
- File Claim: Assignment
- Workflows: WorkOutline
- Metrics: Assessment
- Alerts: Warning
- Documents: Description
- Adjuster: Build
- Overdue: ReportProblem

---

## 📝 Summary

**Total Components**: 14 main components
- **Customer Access**: 5 components
- **Admin Access**: 9 components  
- **Shared**: 1 component (Overdue Tasks)

**Material-UI Coverage**: 4/14 components (28.5%)
- All navigation and layout fully Material-UI
- Customer-facing components prioritized for conversion
- Admin tools still using basic HTML (functional but not styled)

**Next Steps for Full Material-UI Conversion**:
1. Convert FileClaim to Material-UI form
2. Convert WorkflowList to Material-UI table
3. Convert admin tools (AdjusterDashboard, DocumentProcessor, etc.)
4. Add charts to WorkflowMetricsDashboard using Recharts/Chart.js
