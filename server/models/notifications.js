/**
 * Notification Model - Real-time user notifications system
 * 
 * This model stores notifications for users about system events like:
 * - Subject management updates (CRUD operations)
 * - Exam scheduling changes
 * - System announcements
 * - User account updates
 * 
 * Notifications are linked to users and support categorization for UI styling.
 * They integrate with WebSocket for real-time delivery to connected clients.
 * 
 * @property {number} notification_id - Unique identifier for each notification
 * @property {number} user_id - Reference to user who receives the notification
 * @property {string} title - Brief notification title/header
 * @property {string} message - Detailed notification message content
 * @property {string} type - Category for styling (info, success, warning, error, etc.)
 * @property {boolean} is_read - Whether user has acknowledged the notification
 * @property {number} related_id - Optional reference to related resource (subject_id, exam_id)
 * @property {string} related_type - Type of related resource (subject, exam, user)
 * 
 * @example
 * // Create subject management notification:
 * const notification = await Notification.create({
 *   user_id: 1,
 *   title: 'Môn học mới đã được thêm',
 *   message: 'Môn học "Toán học nâng cao" đã được thêm vào hệ thống',
 *   type: 'subject',
 *   related_id: 15,
 *   related_type: 'subject'
 * });
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
    notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each notification'
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Reference to user who receives the notification'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Notification title/header'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Notification message content'
    },
    type: {
        type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'exam', 'system', 'subject', 'user', 'room', 'class', 'enrollment', 'registration'),
        defaultValue: 'info',
        comment: 'Type of notification for styling/categorization'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether user has read the notification'
    },
    related_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of related resource (subject_id, exam_id, etc.)'
    },
    related_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of related resource (subject, exam, user, etc.)'
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});

/**
 * Reusable helper method to create notifications for any resource operations
 * @param {string} resource_type - Type of resource (subject, exam, user, room, etc.)
 * @param {string} action - The action performed (created, updated, deleted)
 * @param {object} resource_data - Resource data for notification content
 * @param {number} user_id - User to notify
 * @param {object} options - Additional options for customization
 * @returns {Promise<Notification>}
 */
Notification.create_resource_notification = async function(resource_type, action, resource_data, user_id, options = {}) {
    // Define Vietnamese names for different resource types
    const resource_names = {
        subject: 'Môn học',
        exam: 'Kỳ thi',
        user: 'Người dùng',
        room: 'Phòng thi',
        class: 'Lớp học',
        enrollment: 'Đăng ký học',
        registration: 'Đăng ký thi'
    };

    // Define primary name fields for different resource types
    const name_fields = {
        subject: 'subject_name',
        exam: 'exam_name',
        user: 'full_name',
        room: 'room_name',
        class: 'class_name',
        enrollment: 'subject_name', // From related subject
        registration: 'exam_name'   // From related exam
    };

    // Define primary ID fields for different resource types
    const id_fields = {
        subject: 'subject_id',
        exam: 'exam_id',
        user: 'user_id',
        room: 'room_id',
        class: 'class_id',
        enrollment: 'enrollment_id',
        registration: 'registration_id'
    };

    const resource_name = resource_names[resource_type] || resource_type;
    const name_field = name_fields[resource_type] || 'name';
    const id_field = id_fields[resource_type] || 'id';
    const item_name = resource_data[name_field] || 'Không rõ tên';
    const item_id = resource_data[id_field];

    // Generate action messages
    const action_messages = {
        created: `${resource_name} "${item_name}" đã được thêm vào hệ thống`,
        updated: `${resource_name} "${item_name}" đã được cập nhật`,
        deleted: `${resource_name} "${item_name}" đã được xóa khỏi hệ thống`,
        approved: `${resource_name} "${item_name}" đã được phê duyệt`,
        rejected: `${resource_name} "${item_name}" đã bị từ chối`,
        activated: `${resource_name} "${item_name}" đã được kích hoạt`,
        deactivated: `${resource_name} "${item_name}" đã bị vô hiệu hóa`
    };

    const action_titles = {
        created: `${resource_name} mới được tạo`,
        updated: `${resource_name} được cập nhật`,
        deleted: `${resource_name} bị xóa`,
        approved: `${resource_name} được phê duyệt`,
        rejected: `${resource_name} bị từ chối`,
        activated: `${resource_name} được kích hoạt`,
        deactivated: `${resource_name} bị vô hiệu hóa`
    };

    // Use custom message and title if provided
    const final_message = options.custom_message || action_messages[action] || `${resource_name} đã được ${action}`;
    const final_title = options.custom_title || action_titles[action] || `Thông báo ${resource_name}`;

    return await this.create({
        user_id: user_id,
        title: final_title,
        message: final_message,
        type: options.notification_type || resource_type,
        related_id: item_id,
        related_type: resource_type
    });
};

module.exports = Notification;