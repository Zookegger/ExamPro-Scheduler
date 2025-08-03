# ExamPro Notification System - Developer Guide

## Overview

The ExamPro notification system provides a **reusable, centralized** way to handle user notifications across all resources (subjects, exams, users, rooms, etc.). It supports both database storage and real-time WebSocket delivery.

## 🚀 Quick Start

### 1. Basic Usage in Any Controller

```javascript
// Import the notification service
const { notify_admins, notify_user, notify_by_role } = require('../services/notificationService');

// Example: Notify admins when a subject is created
async function create_subject(req, res) {
    try {
        // Create the subject
        const new_subject = await Subject.create(subject_data);
        
        // Notify all admins (except the creator) in real-time
        await notify_admins('subject', 'created', new_subject, req.user);
        
        res.json({ success: true, data: new_subject });
    } catch (error) {
        // Handle error
    }
}
```

### 2. Notify Different User Types

```javascript
// Notify all admins about resource changes
await notify_admins('exam', 'updated', exam_data, current_user);

// Notify specific user
await notify_user(user_id, 'exam', 'reminder', exam_data);

// Notify all teachers
await notify_by_role('teacher', 'system', 'maintenance', maintenance_info);

// Notify multiple specific users
await bulk_notify([user1_id, user2_id], 'grade', 'published', grade_data);
```

## 📋 Supported Resource Types

The system automatically handles Vietnamese naming for these resource types:

| Resource Type | Vietnamese Name | Primary Field | ID Field |
|---------------|-----------------|---------------|----------|
| `subject`     | Môn học         | subject_name  | subject_id |
| `exam`        | Kỳ thi          | exam_name     | exam_id |
| `user`        | Người dùng      | full_name     | user_id |
| `room`        | Phòng thi       | room_name     | room_id |
| `class`       | Lớp học         | class_name    | class_id |
| `enrollment`  | Đăng ký học     | subject_name  | enrollment_id |
| `registration`| Đăng ký thi     | exam_name     | registration_id |

## 🔄 Supported Actions

| Action       | Vietnamese Message |
|--------------|-------------------|
| `created`    | đã được thêm vào hệ thống |
| `updated`    | đã được cập nhật |
| `deleted`    | đã được xóa khỏi hệ thống |
| `approved`   | đã được phê duyệt |
| `rejected`   | đã bị từ chối |
| `activated`  | đã được kích hoạt |
| `deactivated`| đã bị vô hiệu hóa |

## 🎨 Customization Options

```javascript
// Custom notification with options
await notify_admins('subject', 'created', subject_data, current_user, {
    custom_title: 'Môn học đặc biệt được tạo',
    custom_message: 'Môn học VIP đã được thêm với quyền đặc biệt',
    notification_type: 'success'  // Override default type
});
```

## 📡 Real-Time WebSocket Integration

### Server Setup (Done automatically)
```javascript
// In your main app.js (already configured)
const { set_socket_io } = require('./services/notificationService');
const { setup_notification_handlers } = require('./websocket/notificationHandlers');

// Set up WebSocket for notifications
setup_notification_handlers(io);
set_socket_io(io);
```

### Client-Side Integration (Frontend)
```javascript
// Connect to notifications
const socket = io();

// Join user's notification room
socket.emit('join_notification_room', user_id);

// Listen for new notifications
socket.on('new_notification', (data) => {
    console.log('📨 New notification:', data.notification);
    // Update UI - show notification badge, popup, etc.
    showNotificationPopup(data.notification);
});

// Listen for unread count updates
socket.on('unread_count_update', (data) => {
    updateNotificationBadge(data.unread_count);
});

// Acknowledge a notification as read
socket.emit('acknowledge_notification', notification_id);
```

## 🔧 Advanced Features

### System Announcements
```javascript
const { create_system_announcement } = require('../services/notificationService');

// Send announcement to all users
await create_system_announcement(
    'Bảo trì hệ thống',
    'Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày mai',
    'warning',
    ['admin', 'teacher', 'student'] // Target roles
);
```

### Cleanup Old Notifications
```javascript
const { cleanup_old_notifications } = require('../services/notificationService');

// Clean notifications older than 30 days
const deleted_count = await cleanup_old_notifications(30);
console.log(`🧹 Cleaned ${deleted_count} old notifications`);
```

## 📝 Adding New Resource Types

To add support for a new resource type (e.g., 'grade'):

1. **Update the notification model** (`server/models/notifications.js`):
```javascript
// Add to resource_names object
const resource_names = {
    // ... existing types
    grade: 'Điểm số'
};

// Add to name_fields object  
const name_fields = {
    // ... existing fields
    grade: 'student_name' // or whatever field contains the display name
};

// Add to id_fields object
const id_fields = {
    // ... existing fields
    grade: 'grade_id'
};
```

2. **Use in your controller**:
```javascript
const { notify_admins } = require('../services/notificationService');

// In your grade controller
await notify_admins('grade', 'published', grade_data, req.user);
```

## 🐛 Error Handling

The notification system is designed to be **non-blocking**:

```javascript
try {
    // Main business logic
    const subject = await Subject.create(data);
    
    // Notifications won't break main functionality if they fail
    await notify_admins('subject', 'created', subject, req.user);
    
    res.json({ success: true, data: subject });
} catch (error) {
    // Handle main business logic errors
    // Notification errors are logged but don't affect response
}
```

## 🔍 Testing Notifications

### Test Real-Time Delivery
```javascript
// In any controller or test file
const { notify_user } = require('../services/notificationService');

// Send test notification
await notify_user(1, 'system', 'test', { 
    name: 'Test Notification',
    id: 999 
});
```

### Check Database
```sql
-- View recent notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Count unread notifications per user
SELECT user_id, COUNT(*) as unread_count 
FROM notifications 
WHERE is_read = false 
GROUP BY user_id;
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get user notifications |
| `PUT` | `/api/notifications/read` | Mark multiple as read |
| `PUT` | `/api/notifications/read-all` | Mark all as read |
| `POST` | `/api/notifications` | Create notification (admin) |
| `DELETE` | `/api/notifications/:id` | Delete notification |

## 🎯 Best Practices

1. **Always use the service functions** instead of creating notifications directly
2. **Don't let notifications break main functionality** - they're wrapped in try-catch
3. **Use appropriate action names** for consistent messaging
4. **Provide context** in custom messages when needed
5. **Test real-time delivery** during development

## 📚 Example: Complete Integration

```javascript
// Example: Exam Controller with notifications
const { notify_admins, notify_by_role } = require('../services/notificationService');

async function create_exam(req, res) {
    try {
        // Create exam
        const new_exam = await Exam.create(exam_data);
        
        // Notify admins about new exam
        await notify_admins('exam', 'created', new_exam, req.user);
        
        // If exam is urgent, notify all teachers too
        if (new_exam.is_urgent) {
            await notify_by_role('teacher', 'exam', 'urgent_created', new_exam, {
                custom_message: `Kỳ thi khẩn cấp "${new_exam.exam_name}" cần được chuẩn bị ngay`
            });
        }
        
        res.status(201).json({ success: true, data: new_exam });
        
    } catch (error) {
        console.error('❌ Error creating exam:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo kỳ thi' });
    }
}
```

This notification system makes it easy to keep users informed about all system changes in real-time while maintaining clean, reusable code! 🚀
