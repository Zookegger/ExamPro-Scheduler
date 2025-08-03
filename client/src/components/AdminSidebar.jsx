import React from 'react';
import { Link } from 'react-router-dom';

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

/**
 * Admin Sidebar Component
 * 
 * Displays the collapsible admin sidebar with:
 * - Exam management menu with accordion
 * - Debug/development menu (if enabled)
 * - User info section with notification bell
 * - Logout button
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
    return (
        <div
            className={`side-panel bg-primary text-white d-flex flex-column sidebar-transition ${
                is_sidebar_visible ? "" : "sidebar-hidden w-0"
            }`}
            style={{
                width: "300px",
                minWidth: "260px",
                minHeight: "100vh",
            }}
        >
            <div className="d-flex flex-column h-100">
                <div className="d-flex px-3 py-3 justify-content-between align-items-center border-bottom border-light-subtle">
                    <div className="d-flex align-items-center text-white text-decoration-none">
                        <i className="bi bi-calendar-check me-2"></i>
                        <Link
                            to="/"
                            className="fs-5 fw-semibold text-white"
                            style={{ textDecoration: "none" }}
                        >
                            ExamPro Admin
                        </Link>
                    </div>
                    {/* Hamburger toggle button */}
                    <button
                        className="btn btn-outline-light btn-sm"
                        onClick={toggle_sidebar}
                        title="Thu gọn sidebar"
                    >
                        <i className="bi bi-list fs-5"></i>
                    </button>
                </div>
                <div
                    className="flex-grow-1 d-flex flex-column p-0"
                    style={{ overflowX: "hidden" }}
                >
                    <ul
                        className="d-flex nav nav-pills accordion accordion-flush flex-column mb-auto flex-grow-1 gap-1"
                        id="accordionSidepanel"
                    >
                        <li className="accordion-item bg-primary px-2 hvr-border-fade">
                            <h2 className="accordion-header">
                                <button
                                    className="accordion-button px-0 py-3 collapsed bg-transparent text-white hvr-underline-from-center"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#examMenu"
                                    aria-expanded="false"
                                    aria-controls="examMenu"
                                >
                                    <span className="fs-5 fw-semibold">
                                        <i className="bi bi-journal-check me-2 hvr-icon-back"></i>
                                        Quản lý Thi
                                    </span>
                                </button>
                            </h2>
                            <div
                                id="examMenu"
                                className="accordion-collapse collapse"
                                data-bs-parent="#accordionSidepanel"
                            >
                                <div className="accordion-body ps-3">
                                    <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                                        <li>
                                            <Link
                                                to="/"
                                                className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
                                            >
                                                <span className="text-start d-block fs-6">
                                                    <i className="bi bi-speedometer2 me-2 hvr-icon-back"></i>
                                                    Dashboard
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/admin/manage-exam"
                                                className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
                                            >
                                                <span className="text-start d-block fs-6">
                                                    <i className="bi bi-people me-2 hvr-icon-back"></i>
                                                    Quản lý kỳ thi
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/admin/manage-user"
                                                className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
                                            >
                                                <span className="text-start d-block fs-6">
                                                    <i className="bi bi-people me-2 hvr-icon-back"></i>
                                                    Quản lý Người dùng
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                to='/admin/manage-schedule'
                                                className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none" 
                                            >
                                                <span className="text-start d-block fs-6">
                                                    <i className="bi bi-calendar-event me-2 hvr-icon-back"></i>
                                                    Lịch Thi
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                to='/admin/manage-room'
                                                className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none" 
                                            >
                                                <span className="text-start d-block fs-6">
                                                    <i className="bi bi-door-closed me-2 hvr-icon-back"></i>
                                                    Phòng Thi
                                                </span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link 
                                                to='/admin/manage-subject'
                                                className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none" 
                                            >
                                                <span className="text-start d-block fs-6">
                                                    <i className="bi bi-door-closed me-2 hvr-icon-back"></i>
                                                    Quản lý môn học
                                                </span>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </li>

                        {is_development && (
                            <li className="accordion-item bg-primary px-2 hvr-border-fade">
                                <h2 className="accordion-header">
                                    <button
                                        className="accordion-button px-0 py-3 collapsed bg-transparent text-white hvr-underline-from-center"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#debugMenu"
                                        aria-expanded="false"
                                        aria-controls="debugMenu"
                                    >
                                        <span className="fs-5 fw-semibold">
                                            <i className="bi bi-bug me-2 hvr-icon-back"></i>
                                            Debug & Chẩn đoán
                                        </span>
                                    </button>
                                </h2>
                                <div
                                    id="debugMenu"
                                    className="accordion-collapse collapse"
                                    data-bs-parent="#accordionSidepanel"
                                >
                                    <div className="accordion-body ps-3">
                                        <ul className="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                                            <li>
                                                <Link
                                                    to="/development"
                                                    className="nav-link w-100 text-white ps-2 hvr-underline-from-left text-decoration-none"
                                                >
                                                    <span className="text-start d-block fs-6">
                                                        <i className="bi bi-wrench me-2 hvr-icon-back"></i>
                                                        Development
                                                        Page
                                                    </span>
                                                </Link>
                                            </li>
                                            <li>
                                                <button className="nav-link w-100 text-white ps-2 hvr-underline-from-left bg-transparent border-0 text-start">
                                                    <span className="text-start d-block fs-6">
                                                        <i className="bi bi-database me-2 hvr-icon-back"></i>
                                                        Database
                                                        Info
                                                    </span>
                                                </button>
                                            </li>
                                            <li>
                                                <button className="nav-link w-100 text-white ps-2 hvr-underline-from-left bg-transparent border-0 text-start">
                                                    <span className="text-start d-block fs-6">
                                                        <i className="bi bi-activity me-2 hvr-icon-back"></i>
                                                        Server
                                                        Health
                                                    </span>
                                                </button>
                                            </li>
                                            <li>
                                                <button className="nav-link w-100 text-white ps-2 hvr-underline-from-left bg-transparent border-0 text-start">
                                                    <span className="text-start d-block fs-6">
                                                        <i className="bi bi-graph-up me-2 hvr-icon-back"></i>
                                                        API Logs
                                                    </span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </li>
                        )}
                    </ul>

                    {/* Admin User Info Section at Bottom */}
                    <div className="mt-auto border-top border-light-subtle pt-3 px-2 mb-3">
                        <div className="d-flex align-items-center mb-2">
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                    <div className="d-flex gap-2 align-items-center">
                                        <i className="bi bi-person-circle fs-5"></i>
                                        <span className="text-white fw-semibold small">
                                            {current_full_name}
                                        </span>
                                        <span className="badge bg-light text-dark px-2 py-1 small">
                                            {get_role_text(current_user_role)}
                                        </span>
                                    </div>
                                    {/* Notification Bell - Only for admin */}
                                    {current_user_role === 'admin' && (
                                        <button
                                            className="btn btn-secondary text-white rounded-circle position-relative me-1"
                                            onClick={toggle_notifications_offcanvas}
                                            title="Thông báo"
                                        >
                                            <i className="bi bi-bell fs-6"></i>
                                            {unread_count > 0 && (
                                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                                    {unread_count > 99 ? '99+' : unread_count}
                                                    <span className="visually-hidden">thông báo chưa đọc</span>
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn btn-outline-light btn-sm w-100 py-3"
                            onClick={handle_logout}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminSidebar;
