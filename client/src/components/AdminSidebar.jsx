import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// CSS styles for hover effects
const sidebarStyles = `
.sidebar-menu-item:hover:not(.active) {
    background-color: rgba(255,255,255,0.1) !important;
}

.sidebar-notification-btn:hover {
    background-color: rgba(255,255,255,0.3) !important;
    transform: scale(1.05) !important;
}

.sidebar-logout-btn:hover {
    background-color: rgba(255,255,255,1) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
}
`;

// Inject styles into document head
if (typeof document !== 'undefined' && !document.getElementById('sidebar-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'sidebar-styles';
    styleSheet.type = 'text/css';
    styleSheet.innerText = sidebarStyles;
    document.head.appendChild(styleSheet);
}

function get_role_text(user_role) {
    switch (user_role) {
        case "admin":
            return "Quản trị viên";
        case "teacher":
            return "Giáo viên";
        case "student":
            return "Học sinh";
        case "Guest":
        default:
            return "Khách";
    }
}

function get_role_icon(user_role) {
    switch (user_role) {
        case "admin":
            return "bi-shield-check";
        case "teacher":
            return "bi-person-workspace";
        case "student":
            return "bi-person-badge";
        default:
            return "bi-person";
    }
}

/**
 * Enhanced Admin Sidebar Component
 * 
 * Improved admin sidebar with:
 * - Active route highlighting
 * - Enhanced visual design with gradients
 * - Better organization with grouped menu items
 * - Improved accessibility and keyboard navigation
 * - Real-time status indicators
 * - Responsive design enhancements
 * 
 * @param {Object} props
 * @param {boolean} props.is_sidebar_visible - Whether sidebar is expanded
 * @param {Function} props.toggle_sidebar - Function to toggle sidebar visibility
 * @param {string} props.current_full_name - Admin user's full name
 * @param {string} props.current_user_role - Should be "admin"
 * @param {boolean} props.is_development - Whether development mode is enabled
 * @param {number} props.unread_count - Number of unread notifications
 * @param {Function} props.toggle_notifications_offcanvas - Function to show notifications
 * @param {Function} props.handle_logout - Logout handler function
 */
function AdminSidebar({ 
    is_sidebar_visible,
    toggle_sidebar,
    current_full_name,
    current_user_role,
    is_development,
    unread_count,
    toggle_notifications_offcanvas,
    handle_logout
}) {
    const location = useLocation();
    const [expanded_menus, set_expanded_menus] = useState(new Set(['examMenu']));

    // Check if a route is active
    const is_active_route = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        return path !== '/' && location.pathname.startsWith(path);
    };

    // Toggle menu expansion
    const toggle_menu = (menu_id) => {
        const new_expanded = new Set(expanded_menus);
        if (new_expanded.has(menu_id)) {
            new_expanded.delete(menu_id);
        } else {
            new_expanded.add(menu_id);
        }
        set_expanded_menus(new_expanded);
    };

    // Menu items configuration
    const menu_items = [
        {
            id: 'examMenu',
            title: 'Quản lý Thi',
            icon: 'bi-journal-check',
            items: [
                { path: '/', title: 'Dashboard', icon: 'bi-speedometer2' },
                { path: '/admin/dashboard', title: 'Thống kê Dashboard', icon: 'bi-graph-up' },
                { path: '/admin/reports', title: 'Báo cáo', icon: 'bi-file-earmark-text' },
                { path: '/admin/manage-exam', title: 'Quản lý kỳ thi', icon: 'bi-calendar-event' },
                { path: '/admin/manage-user', title: 'Quản lý Người dùng', icon: 'bi-people' },
                { path: '/admin/manage-schedule', title: 'Lịch Thi', icon: 'bi-calendar3' },
                { path: '/admin/manage-room', title: 'Phòng Thi', icon: 'bi-door-closed' },
                { path: '/admin/manage-subject', title: 'Quản lý môn học', icon: 'bi-book' },
            ]
        }
    ];

    if (is_development) {
        menu_items.push({
            id: 'debugMenu',
            title: 'Debug & Chẩn đoán',
            icon: 'bi-bug',
            items: [
                { path: '/development', title: 'Development Page', icon: 'bi-wrench' },
                { path: '/test/websocket', title: 'WebSocket Test', icon: 'bi-wifi' },
            ]
        });
    }
    return (
        <div
            className={`side-panel text-white d-flex flex-column sidebar-transition ${
                is_sidebar_visible ? "" : "sidebar-hidden w-0"
            }`}
            style={{
                width: "320px",
                minWidth: "320px",
                minHeight: "100vh",
                background: "linear-gradient(180deg, #0d6efd 0%, #0842a0 100%)",
                boxShadow: "4px 0 15px rgba(0,0,0,0.1)"
            }}
        >
            <div className="d-flex flex-column h-100">
                {/* Header Section */}
                <div className="px-3 py-4 border-bottom border-light-subtle position-relative">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <div 
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: "45px",
                                    height: "45px",
                                    background: "rgba(255,255,255,0.15)",
                                    backdropFilter: "blur(10px)"
                                }}
                            >
                                <i className="bi bi-calendar-check-fill fs-4 text-white"></i>
                            </div>
                            <div>
                                <Link
                                    to="/"
                                    className="text-white text-decoration-none"
                                >
                                    <h5 className="mb-1 fw-bold">ExamPro</h5>
                                    <small className="text-white-50 d-block">Admin Panel</small>
                                </Link>
                            </div>
                        </div>
                        <button
                            className="btn btn-outline-light btn-sm rounded-circle d-flex justify-content-center align-items-center"
                            onClick={toggle_sidebar}
                            title="Thu gọn sidebar"
                            style={{ width: "36px", height: "36px" }}
                        >
                            <i className="bi bi-list fs-5"></i>
                        </button>
                    </div>
                </div>

                {/* Menu Section */}
                <div className="flex-grow-1 py-3" style={{ overflowX: "hidden", overflowY: "auto" }}>
                    {menu_items.map((menu) => (
                        <div key={menu.id} className="mb-3">
                            <button
                                className="w-100 btn btn-link text-white text-start px-3 py-2 border-0"
                                onClick={() => toggle_menu(menu.id)}
                                style={{ textDecoration: "none" }}
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <i className={`${menu.icon} me-3 fs-5`}></i>
                                        <span className="fw-semibold">{menu.title}</span>
                                    </div>
                                    <i className={`bi ${expanded_menus.has(menu.id) ? 'bi-chevron-down' : 'bi-chevron-right'} small`}></i>
                                </div>
                            </button>
                            
                            <div className={`${expanded_menus.has(menu.id) ? 'd-block' : 'd-none'}`}>
                                {menu.items.map((item) => (
                                    <div key={item.path} className="px-3">
                                        {item.action ? (
                                            <button
                                                className={`w-100 btn btn-link text-start py-2 px-3 border-0 rounded-3 my-1 sidebar-menu-item ${
                                                    is_active_route(item.path) 
                                                        ? 'bg-white bg-opacity-25 text-white active' 
                                                        : 'text-white-75'
                                                }`}
                                                style={{ 
                                                    textDecoration: "none",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <i className={`${item.icon} me-3 text-white`}></i>
                                                    <span>{item.title}</span>
                                                </div>
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                className={`w-100 btn btn-link text-start py-2 px-3 border-0 rounded-3 my-1 text-decoration-none d-block sidebar-menu-item ${
                                                    is_active_route(item.path) 
                                                        ? 'bg-white bg-opacity-25 text-white active' 
                                                        : 'text-white-75'
                                                }`}
                                                style={{ 
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <i className={`${item.icon} me-3 text-white`}></i>
                                                    <span className='text-white'>{item.title}</span>
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Enhanced User Info Section */}
                <div 
                    className="mt-auto border-top border-light-subtle pt-3 px-3 mb-3"
                    style={{ 
                        background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "15px",
                        margin: "0 15px 15px 15px"
                    }}
                >
                    <div className="d-flex align-items-center mb-3">
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                                width: "50px",
                                height: "50px",
                                background: "rgba(255,255,255,0.2)",
                                border: "2px solid rgba(255,255,255,0.3)"
                            }}
                        >
                            <i className={`${get_role_icon(current_user_role)} fs-4 text-white`}></i>
                        </div>
                        <div className="flex-grow-1 me-2">
                            <h6 className="mb-1 text-white fw-bold text-start">{current_full_name}</h6>
                        </div>
                        
                        {/* Enhanced Notification Bell */}
                        {current_user_role === 'admin' && (
                            <button
                                className="btn btn-light btn-sm rounded-circle position-relative d-flex align-items-center justify-content-center sidebar-notification-btn"
                                onClick={toggle_notifications_offcanvas}
                                title="Thông báo"
                                style={{ 
                                    width: "40px", 
                                    height: "40px",
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    border: "1px solid rgba(255,255,255,0.3)",
                                    backdropFilter: "blur(5px)",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <i className="bi bi-bell-fill text-white fs-6"></i>
                                {unread_count > 0 && (
                                    <span 
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-flex align-items-center justify-content-center"
                                        style={{
                                            fontSize: "10px",
                                            minWidth: "18px",
                                            height: "18px",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                        }}
                                    >
                                        {unread_count > 99 ? '99+' : unread_count}
                                        <span className="visually-hidden">thông báo chưa đọc</span>
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                    
                    {/* Enhanced Logout Button */}
                    <button
                        className="btn btn-light w-100 py-2 fw-semibold sidebar-logout-btn"
                        onClick={handle_logout}
                        style={{
                            backgroundColor: "rgba(255,255,255,0.9)",
                            border: "none",
                            borderRadius: "10px",
                            color: "#0d6efd",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminSidebar;
