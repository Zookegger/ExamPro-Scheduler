/**
 * Notification Routes - API endpoints for user notifications
 * 
 * Provides REST API endpoints for notification management:
 * - GET /api/notifications - Get user notifications
 * - PUT /api/notifications/read - Mark notifications as read (bulk)
 * - PUT /api/notifications/:id/read - Mark single notification as read
 * - PUT /api/notifications/read-all - Mark all notifications as read
 * - POST /api/notifications - Create notification (admin only)
 * - DELETE /api/notifications/:id - Delete notification
 * 
 * All routes require authentication via JWT middleware.
 * Admin-only routes require additional role verification.
 */

const express = require('express');
const router = express.Router();
const {
    get_user_notifications,
    mark_notifications_as_read,
    mark_notification_read,
    mark_all_notifications_as_read,
    create_notification,
    delete_notification
} = require('../controllers/notificationController');

// Authentication middleware
const { authenticate_jwt } = require('../middleware/auth');
const { require_admin_role } = require('../middleware/admin');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for authenticated user
 * @access  Private (requires JWT token)
 * @query   {boolean} is_read - Filter by read status (optional)
 * @query   {string} type - Filter by notification type (optional)
 * @query   {number} limit - Number of notifications to return (default: 20)
 * @query   {number} offset - Offset for pagination (default: 0)
 */
router.get('/', authenticate_jwt, get_user_notifications);

/**
 * @route   PUT /api/notifications/read
 * @desc    Mark multiple notifications as read (bulk operation)
 * @access  Private (requires JWT token)
 * @body    {array} notification_ids - Array of notification IDs to mark as read
 */
router.put('/read', authenticate_jwt, mark_notifications_as_read);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for the authenticated user
 * @access  Private (requires JWT token)
 */
router.put('/read-all', authenticate_jwt, mark_all_notifications_as_read);

/**
 * @route   PUT /api/notifications/:notification_id/read
 * @desc    Mark a single notification as read
 * @access  Private (requires JWT token)
 * @param   {number} notification_id - ID of notification to mark as read
 */
router.put('/:notification_id/read', authenticate_jwt, mark_notification_read);

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification (admin only)
 * @access  Private + Admin
 * @body    {number} user_id - Target user ID
 * @body    {string} title - Notification title
 * @body    {string} message - Notification message
 * @body    {string} type - Notification type (optional, default: 'info')
 * @body    {number} related_id - Related resource ID (optional)
 * @body    {string} related_type - Related resource type (optional)
 */
router.post('/', authenticate_jwt, require_admin_role, create_notification);

/**
 * @route   DELETE /api/notifications/:notification_id
 * @desc    Delete a notification
 * @access  Private (requires JWT token, can only delete own notifications)
 * @param   {number} notification_id - ID of notification to delete
 */
router.delete('/:notification_id', authenticate_jwt, delete_notification);

module.exports = router;