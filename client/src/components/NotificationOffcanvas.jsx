import React from 'react';

/**
 * Notification Offcanvas Component
 * 
 * Displays the admin notification panel as an offcanvas sidebar:
 * - Shows list of notifications with read/unread status
 * - Allows marking notifications as read
 * - Mark all read functionality
 * - Real-time notification display
 * 
 * @param {Object} props
 * @param {boolean} props.is_notifications_offcanvas_visible - Whether offcanvas is visible
 * @param {Function} props.toggle_notifications_offcanvas - Function to toggle visibility
 * @param {Array} props.notifications - Array of notification objects
 * @param {number} props.unread_count - Number of unread notifications
 * @param {Function} props.handle_mark_all_read - Function to mark all notifications as read
 * @param {Function} props.handle_notification_read - Function to mark single notification as read
 */
function NotificationOffcanvas({
    is_notifications_offcanvas_visible,
    toggle_notifications_offcanvas,
    notifications,
    unread_count,
    handle_mark_all_read,
    handle_notification_read
}) {
    return (
        <>
            {/* Notifications Offcanvas */}
            <div
                className={`offcanvas offcanvas-end ${is_notifications_offcanvas_visible ? 'show' : ''}`}
                tabIndex="-1"
                id="notificationsOffcanvas"
                aria-labelledby="notificationsOffcanvasLabel"
                style={{ visibility: is_notifications_offcanvas_visible ? 'visible' : 'hidden' }}
            >
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title" id="notificationsOffcanvasLabel">
                        <i className="bi bi-bell me-2"></i>
                        Thông báo
                    </h5>
                    <button
                        type="button"
                        className="btn-close"
                        onClick={toggle_notifications_offcanvas}
                        aria-label="Close"
                    ></button>
                </div>
                <div className="offcanvas-body p-0">
                    {/* Notification Actions */}
                    <div className="p-3 border-bottom bg-light">
                        <div className="d-flex justify-content-center">
                            <button 
                                type="button" 
                                className="btn btn-sm btn-outline-primary"
                                onClick={handle_mark_all_read}
                                disabled={unread_count === 0}
                            >
                                <i className="fas fa-check-double me-1"></i>
                                Đánh dấu tất cả đã đọc
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="notification-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        {!notifications || notifications.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                                <h6 className="text-muted">Không có thông báo</h6>
                                <p className="text-muted small">
                                    Bạn sẽ nhận được thông báo khi có hoạt động mới trong hệ thống.
                                </p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div 
                                    key={notification.notification_id}
                                    className={`p-3 border-bottom ${
                                        !notification.is_read ? 'bg-light border-primary border-2' : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            handle_notification_read(notification.notification_id);
                                        }
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = !notification.is_read ? '#f8f9fa' : 'transparent'}
                                >
                                    <div className="d-flex align-items-start">
                                        <div className="flex-shrink-0 me-3">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                                                notification.type === 'subject' ? 'bg-primary' :
                                                notification.type === 'system' ? 'bg-info' :
                                                notification.type === 'success' ? 'bg-success' :
                                                notification.type === 'warning' ? 'bg-warning' :
                                                notification.type === 'error' ? 'bg-danger' : 'bg-secondary'
                                            }`} style={{ width: '40px', height: '40px' }}>
                                                <i className={`fas ${
                                                    notification.type === 'subject' ? 'fa-book' :
                                                    notification.type === 'system' ? 'fa-cog' :
                                                    notification.type === 'success' ? 'fa-check' :
                                                    notification.type === 'warning' ? 'fa-exclamation-triangle' :
                                                    notification.type === 'error' ? 'fa-times' : 'fa-bell'
                                                } text-white fa-sm`}></i>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <h6 className="mb-0 fw-bold text-dark">
                                                    {notification.title}
                                                </h6>
                                                {!notification.is_read && (
                                                    <div className="bg-primary rounded-circle" 
                                                         style={{ width: '8px', height: '8px' }}></div>
                                                )}
                                            </div>
                                            <p className="mb-1 text-muted small">
                                                {notification.message}
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-muted">
                                                    <i className="fas fa-clock me-1"></i>
                                                    {new Date(notification.created_at).toLocaleString('vi-VN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </small>
                                                <span className={`badge text-capitalize ${
                                                    notification.type === 'subject' ? 'bg-primary' :
                                                    notification.type === 'system' ? 'bg-info' :
                                                    notification.type === 'success' ? 'bg-success' :
                                                    notification.type === 'warning' ? 'bg-warning text-dark' :
                                                    notification.type === 'error' ? 'bg-danger' : 'bg-secondary'
                                                }`}>
                                                    {notification.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Offcanvas Backdrop */}
            {is_notifications_offcanvas_visible && (
                <div
                    className="offcanvas-backdrop fade show"
                    onClick={toggle_notifications_offcanvas}
                ></div>
            )}
        </>
    );
}

export default NotificationOffcanvas;
