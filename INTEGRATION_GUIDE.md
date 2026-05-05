# HR System Integration Guide - Developer Reference

## 🚀 Quick Start

### 1. Using the Unified API Services

Instead of creating individual API calls, use the unified services:

```javascript
// ❌ OLD - Direct axios calls (scattered, no caching)
import axios from 'axios';
const leaves = await axios.get('/api/leaves/');
const leaves2 = await axios.get('/api/leaves/'); // Duplicate call!

// ✅ NEW - Unified service (cached, consistent)
import { leaveService } from '@/services/api/modules/leaveService';
const leaves = await leaveService.getMyLeaves();
// Second call uses cache automatically!
```

### 2. Using Design Tokens

Instead of hardcoding colors, use design tokens:

```javascript
// ❌ OLD - Hardcoded values everywhere
<div style={{ backgroundColor: '#F97316', padding: '16px' }}>

// ✅ NEW - Design tokens
import { colors, spacing } from '@/theme/designTokens';
<div style={{ backgroundColor: colors.primary, padding: spacing.lg }}>
```

### 3. Using Centralized Notifications

Instead of multiple notification systems, use the notification manager:

```javascript
// ❌ OLD - Toast, alert, console.log scattered
toast.success('Leave approved');
console.log('Leave approved');
showNotification({ type: 'leave_approved' });

// ✅ NEW - Single notification engine
import { notificationManager, NOTIFICATION_TYPES } from '@/services/notificationManager';
notificationManager.notify({
  type: NOTIFICATION_TYPES.LEAVE_APPROVED,
  message: 'Leave approved successfully',
});
```

---

## 📦 Available Services

### Leave Service

```javascript
import { leaveService } from '@/services/api/modules/leaveService';

// Get current employee leaves
await leaveService.getMyLeaves();
await leaveService.getMyLeaves({ status: 'PENDING' });

// Get leave balance
await leaveService.getLeaveBalance();

// Apply new leave
await leaveService.applyLeave({
  leave_type: 'SICK',
  date_from: '2024-06-15',
  date_to: '2024-06-16',
  reason: 'Medical appointment'
});

// Manager operations (auto-checks role)
await leaveService.getTeamLeaves();
await leaveService.approveLeave(leaveId, 'Approved');
await leaveService.rejectLeave(leaveId, 'Already used leaves');

// Clear caches after bulk updates
leaveService.clearCache();
```

### Reports Service

```javascript
import { reportService } from '@/services/api/reportService';

// Get filtered reports
await reportService.getLeaveReport({
  departmentId: 1,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'APPROVED'
});

// Get dashboard stats
await reportService.getDashboardStats();

// Export reports
await reportService.exportReportCSV('leaves', { departmentId: 1 });
await reportService.exportReportPDF('attendance');

// Force refresh (bypass cache)
await reportService.refreshLeaveReport();

// Get cache statistics
console.log(reportService.getCacheStats());
```

### Additional Services (Template)

```javascript
// Employee Service
import { employeeService } from '@/services/api/modules/employeeService';
await employeeService.getCurrentEmployee();
await employeeService.updateProfile(data);

// Attendance Service
import { attendanceService } from '@/services/api/modules/attendanceService';
await attendanceService.getAttendance({ date: '2024-06-15' });

// Holiday Service  
import { holidayService } from '@/services/api/modules/holidayService';
await holidayService.getHolidaysByYear(2024);

// Department Service
import { departmentService } from '@/services/api/modules/departmentService';
await departmentService.getDepartments();

// Announcement Service
import { announcementService } from '@/services/api/modules/announcementService';
await announcementService.getAnnouncements();
```

---

## 🎨 Design Token Usage

### Colors

```javascript
import { colors } from '@/theme/designTokens';

// Primary colors
colors.primary           // #F97316
colors.primaryDark       // #EA580C
colors.primaryLight      // #FFF7ED

// Status colors
colors.success          // #16A34A
colors.error            // #DC2626
colors.warning          // #F59E0B
colors.info             // #2563EB

// Neutral palette
colors.neutral.bg       // #F8FAFC
colors.neutral.surface  // #FFFFFF
colors.neutral.border   // #E2E8F0
colors.neutral.textMain // #0F172A
colors.neutral.textMuted // #64748B

// Gradients
colors.gradients.primary    // 'linear-gradient(135deg, #F97316, #EA580C)'
colors.gradients.accent     // 'linear-gradient(135deg, #16A34A, #15803D)'
colors.gradients.error      // 'linear-gradient(135deg, #DC2626, #B91C1C)'
```

### Spacing

```javascript
import { spacing } from '@/theme/designTokens';

// Individual units
spacing.xs      // 4px
spacing.sm      // 8px
spacing.md      // 12px
spacing.lg      // 16px
spacing.xl      // 20px
spacing.xxl     // 24px
spacing.xxxl    // 28px

// Border radius
spacing.borderRadius.sm     // 6px
spacing.borderRadius.md     // 8px
spacing.borderRadius.lg     // 12px
spacing.borderRadius.xl     // 14px
spacing.borderRadius.circle // 50%

// Common patterns
spacing.padding.card        // '22px 24px'
spacing.padding.section     // '24px 28px'
spacing.padding.button      // '10px 16px'
spacing.padding.input       // '10px 14px'

// Gap between elements
spacing.gap.md              // 12px
spacing.gap.lg              // 16px
```

### Typography

```javascript
import { typography } from '@/theme/designTokens';

// Font sizes
typography.fontSize.xs      // 11px
typography.fontSize.sm      // 12px
typography.fontSize.md      // 14px
typography.fontSize.lg      // 16px
typography.fontSize.heading // 32px

// Font weights
typography.fontWeight.bold      // 700
typography.fontWeight.semibold  // 600

// Line height
typography.lineHeight.tight    // 1.2
typography.lineHeight.normal   // 1.5
```

### Shadows

```javascript
import { shadows } from '@/theme/designTokens';

shadows.xs      // 0 1px 2px rgba(0, 0, 0, 0.04)
shadows.md      // 0 2px 8px rgba(0, 0, 0, 0.1)
shadows.lg      // 0 4px 12px rgba(0, 0, 0, 0.15)

// Color-specific shadows for gradient cards
shadows.primary // 0 6px 20px rgba(249, 115, 22, 0.25)
shadows.accent  // 0 6px 20px rgba(22, 163, 74, 0.25)
shadows.error   // 0 6px 20px rgba(220, 38, 38, 0.25)
```

### Status Styles

```javascript
import { statusStyles, getStatusStyle } from '@/theme/designTokens';

// Direct access
statusStyles.PENDING    // { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }
statusStyles.APPROVED   // { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' }
statusStyles.REJECTED   // { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' }

// Or use helper function
const style = getStatusStyle('APPROVED');
<span style={{
  backgroundColor: style.bg,
  color: style.color,
  border: `1px solid ${style.border}`,
  padding: '6px 12px',
  borderRadius: '20px'
}}>Approved</span>
```

### Component Styles

```javascript
import { componentStyles } from '@/theme/designTokens';

// Pre-built component styles
<div style={componentStyles.card}>
  {/* Card with shadow, border, padding */}
</div>

<button style={componentStyles.buttonPrimary}>
  Click me
</button>

<button style={componentStyles.buttonSecondary}>
  Cancel
</button>

<input style={componentStyles.input} placeholder="..." />
```

---

## 🔔 Notification Manager Usage

### Notification Types

```javascript
import { NOTIFICATION_TYPES } from '@/services/notificationManager';

NOTIFICATION_TYPES.LEAVE_APPLIED      // User applied for leave
NOTIFICATION_TYPES.LEAVE_APPROVED     // Manager approved leave
NOTIFICATION_TYPES.LEAVE_REJECTED     // Manager rejected leave
NOTIFICATION_TYPES.ANNOUNCEMENT_POSTED // New announcement
NOTIFICATION_TYPES.EMPLOYEE_CREATED   // Admin created employee
NOTIFICATION_TYPES.SYNC_ERROR         // System sync failed
```

### Sending Notifications

```javascript
import { notificationManager } from '@/services/notificationManager';

// Simple success
notificationManager.success('Operation completed');

// Simple error
notificationManager.error('Something went wrong');

// Custom notification
notificationManager.notify({
  type: NOTIFICATION_TYPES.LEAVE_APPROVED,
  title: 'Leave Approved',
  message: '5 days approved',
  color: 'success',
  icon: '✅',
  duration: 5000,
  action: { label: 'View', path: '/leaves' }
});

// Listening to notifications
notificationManager.on('notify', (notification) => {
  console.log('New notification:', notification);
});
```

### Role-Based Notification Control

Notifications are automatically filtered by user role:

| Role | Receives | Muted |
|------|----------|-------|
| Admin | All notifications | None |
| Manager | Team events, announcements | Employee creation, promotions |
| Employee | Personal events, announcements | Leave applications, employee creation |

**Set role after login:**
```javascript
notificationManager.setUserRole(userRole);
```

---

## 🔄 Cache Management

### Automatic Cache Invalidation

When you modify data, related caches are automatically cleared:

```javascript
// This automatically invalidates:
// - /leaves* (all leave queries)
// - /reports/leaves* (leave reports)
// - /dashboard-stats* (dashboard statistics)
// - /employees* (employee balance data)
await leaveService.approveLeave(leaveId);
```

### Manual Cache Control

```javascript
import { leaveService } from '@/services/api/modules/leaveService';
import { cache } from '@/services/api/baseService';

// Clear specific service cache
leaveService.clearCache();

// Invalidate pattern
cache.invalidatePattern('/leaves*');

// Get cache stats (for debugging)
console.log(cache.getStats());
// Output: { size: 15, entries: [...] }
```

### Cache TTL Configuration

```javascript
import { CACHE_CONFIG } from '@/services/api/baseService';

CACHE_CONFIG.SHORT    // 1 minute (frequently changing data)
CACHE_CONFIG.MEDIUM   // 5 minutes (regular data)
CACHE_CONFIG.LONG     // 1 hour (static data)
CACHE_CONFIG.YEARLY   // 1 year (yearly data like holidays)
```

---

## 🔐 Role-Based Access Control

The system maintains RBAC for both frontend and backend:

### Backend Enforcement (Primary)
API endpoints check user role and filter data accordingly

### Frontend Enforcement (Secondary)
Components can optionally check role for UI display

```javascript
// Check user role
const userRole = localStorage.getItem('user_role');
const isAdmin = userRole === 'ADMIN';
const isManager = userRole === 'MANAGER';

// Show/hide components based on role
{isManager && <ApproveButton />}

// Pass flag to services
if (isManager) {
  const teamLeaves = await leaveService.getTeamLeaves();
}
```

---

## ⚡ Performance Best Practices

### 1. Use Services Instead of Direct API Calls

```javascript
// ❌ BAD - Multiple calls, no caching
const leaves1 = await axios.get('/api/leaves/');
const leaves2 = await axios.get('/api/leaves/');  // Duplicate!

// ✅ GOOD - Uses cache automatically
const leaves = await leaveService.getMyLeaves();
const leaves2 = await leaveService.getMyLeaves(); // Returns cached
```

### 2. Batch API Calls When Possible

```javascript
// ❌ BAD - 5 separate requests
for (let dept of departments) {
  await leaveService.getLeaveReport({ departmentId: dept.id });
}

// ✅ GOOD - Single request with aggregation
const params = { departmentIds: departments.map(d => d.id) };
await leaveService.getLeaveReport(params);
```

### 3. Use Appropriate Cache TTLs

```javascript
// ✅ Short TTL for frequently changing data
await leaveService.getMyLeaves();  // 1 min cache (changes often)

// ✅ Long TTL for static data
await holidayService.getHolidaysByYear(2024);  // 1 year cache (doesn't change)
```

### 4. Clear Caches After Bulk Operations

```javascript
// When bulk-importing employees or leaves
for (let item of bulkData) {
  await leaveService.applyLeave(item);  // Invalidates cache each time
}

// Better: Clear once at the end
for (let item of bulkData) {
  // Modify directly in database (outside service)
}
leaveService.clearCache();  // Single cache clear
```

### 5. Force Refresh Only When Needed

```javascript
// ❌ BAD - Always force refresh
await reportService.refreshLeaveReport();  // Slower

// ✅ GOOD - Use cache unless user clicks refresh
await reportService.getLeaveReport();  // Uses cache
// After button click:
if (userClickedRefresh) {
  await reportService.refreshLeaveReport();
}
```

---

## 🐛 Debugging

### View Cache Statistics

```javascript
import { reportService } from '@/services/api/reportService';

console.log(reportService.getCacheStats());
// Output: { size: 5, entries: ['/leaves/', '/holidays/', ...] }
```

### View Notification Queue

```javascript
import { notificationManager } from '@/services/notificationManager';

console.log(notificationManager.getStats());
// Output: { active: 1, queued: 2, userRole: 'ADMIN', deduplicated: 0 }
```

### Enable Request Logging

All API requests are logged automatically:
```
[API] GET /api/leaves/ {}
[Cache HIT] /api/leaves/
[API] POST /api/leaves/apply/ {...}
```

---

## 📋 Migration Checklist

When migrating existing components to use services:

- [ ] Replace direct `axios` calls with service methods
- [ ] Replace hardcoded colors with design tokens
- [ ] Replace inline notifications with `notificationManager`
- [ ] Update components to use cached data
- [ ] Add cache invalidation for mutations
- [ ] Test role-based access works
- [ ] Verify no duplicate API calls
- [ ] Update error handling
- [ ] Test on slow network (use Chrome DevTools throttling)

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Creating new axios instance

```javascript
// BAD - Creates new instance without interceptors
const api = axios.create({ baseURL: API_URL });
const data = await api.get('/leaves/');
```

**Solution:** Use the service layer
```javascript
// GOOD
const data = await leaveService.getMyLeaves();
```

### ❌ Mistake 2: Hardcoding colors

```javascript
// BAD - Inconsistent across app
<div style={{ backgroundColor: '#F97316' }}>
<div style={{ backgroundColor: '#f97316' }}>  // Case mismatch!
```

**Solution:** Use design tokens
```javascript
// GOOD
<div style={{ backgroundColor: colors.primary }}>
```

### ❌ Mistake 3: Multiple notifications per action

```javascript
// BAD - Shows 3 notifications
leaveService.approveLeave(id).then(() => {
  toast.success('Approved');
  notificationManager.success('Leave approved');
  alert('Leave approved');
});
```

**Solution:** Single notification in the service
```javascript
// GOOD - Service sends one notification
await leaveService.approveLeave(id);
```

### ❌ Mistake 4: Forgetting to invalidate cache

```javascript
// BAD - Cache not updated after modification
await leaveService.updateLeave(id, data);
// Reports still show old data
```

**Solution:** Caches are auto-invalidated by service
```javascript
// GOOD - Service handles invalidation
await leaveService.updateLeave(id, data);  // Clears /leaves*, /reports* caches
```

---

## 📞 Support & Questions

For integration issues:

1. Check this guide first
2. Review the service documentation in code comments
3. Check browser console for [API] and [Notification] logs
4. Use `reportService.getCacheStats()` to debug cache
5. Use `notificationManager.getStats()` to debug notifications

---

## 📚 File Structure Reference

```
frontend/src/
├── services/
│   ├── api/
│   │   ├── baseService.js         ← Core service with caching
│   │   ├── reportService.js       ← HR Reports API
│   │   └── modules/
│   │       ├── leaveService.js
│   │       ├── employeeService.js
│   │       ├── attendanceService.js
│   │       ├── departmentService.js
│   │       ├── announcementService.js
│   │       ├── visitorService.js
│   │       └── holidayService.js
│   ├── notificationManager.js     ← Centralized notifications
│   ├── announcementService.js     ← Legacy (use module version)
│   └── holidayService.js          ← Legacy (use module version)
└── theme/
    └── designTokens.js             ← Design system tokens
```

