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
 * Role-Based Navigation Component
 * 
 * Renders different navigation bars based on user role:
 * - Student: Green navbar with student-specific links
 * - Teacher: Info-colored navbar with teacher-specific links  
 * - Guest: Primary navbar with login link
 * - Admin: No navbar (uses sidebar instead)
 * 
 * @param {Object} props
 * @param {string} props.current_user_role - Current user's role
 * @param {string} props.current_full_name - User's full name
 * @param {Function} props.handle_logout - Logout handler function
 */
function RoleBasedNavigation({ 
    current_user_role, 
    current_full_name, 
    handle_logout 
}) {
    switch (current_user_role) {
        case "admin":
            // Admin users don't get a navbar (they have sidebar)
            return null;

        case "student":
            return (
                <nav className="navbar navbar-expand-lg navbar-dark bg-success">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">
                            🎓 ExamPro Student
                        </Link>

                        {/* Hamburger Toggle Button */}
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#studentNavbar"
                            aria-controls="studentNavbar"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>

                        {/* Student Navigation Menu */}
                        <div className="collapse navbar-collapse" id="studentNavbar">
                            <div className="navbar-nav me-auto">
                                <Link className="nav-link" to="/">
                                    <i className="bi bi-house me-1"></i>
                                    Dashboard
                                </Link>
                                <Link className="nav-link" to="/student/subject-enrollment">
                                    <i className="bi bi-book me-1"></i>
                                    Đăng ký môn học
                                </Link>
                                <Link className="nav-link" to="/student/my-exams">
                                    <i className="bi bi-calendar-check me-1"></i>
                                    Lịch thi của tôi
                                </Link>
                                <Link className="nav-link" to="/student/exam-schedule">
                                    <i className="bi bi-calendar-event me-1"></i>
                                    Lịch thi chung
                                </Link>
                            </div>
                            
                            {/* Student User Info */}
                            <div className="navbar-nav">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-light text-success px-3 py-2">
                                            <i className="bi bi-mortarboard me-1"></i>
                                            {get_role_text(current_user_role)}
                                        </span>
                                        <span className="text-white fw-semibold">
                                            {current_full_name}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-outline-light btn-sm"
                                        onClick={handle_logout}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i>
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            );

        case "teacher":
            return (
                <nav className="navbar navbar-expand-lg navbar-dark bg-info">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">
                            👨‍🏫 ExamPro Teacher
                        </Link>

                        {/* Hamburger Toggle Button */}
                        <button
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#teacherNavbar"
                            aria-controls="teacherNavbar"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>

                        {/* Teacher Navigation Menu */}
                        <div className="collapse navbar-collapse" id="teacherNavbar">
                            <div className="navbar-nav me-auto">
                                <Link className="nav-link" to="/">
                                    <i className="bi bi-house me-1"></i>
                                    Dashboard
                                </Link>
                                <Link className="nav-link" to="/teacher/my-subjects">
                                    <i className="bi bi-journal-text me-1"></i>
                                    Môn học của tôi
                                </Link>
                                <Link className="nav-link" to="/teacher/manage-class">
                                    <i className="bi bi-people me-1"></i>
                                    Quản lý lớp
                                </Link>
                                <Link className="nav-link" to="/teacher/schedule">
                                    <i className="bi bi-calendar-week me-1"></i>
                                    Lịch công tác
                                </Link>
                                <Link className="nav-link" to="/teacher/exam-proctor">
                                    <i className="bi bi-eye me-1"></i>
                                    Giám thị thi
                                </Link>
                            </div>
                            
                            {/* Teacher User Info */}
                            <div className="navbar-nav">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-light text-info px-3 py-2">
                                            <i className="bi bi-person-badge me-1"></i>
                                            {get_role_text(current_user_role)}
                                        </span>
                                        <span className="text-white fw-semibold">
                                            {current_full_name}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-outline-light btn-sm"
                                        onClick={handle_logout}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i>
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            );

        default:
            // Guest users (not logged in)
            return (
                <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">
                            📚 ExamPro Scheduler
                        </Link>

                        <div className="navbar-nav ms-auto">
                            <Link className="nav-link" to="/login">
                                <i className="bi bi-box-arrow-in-right me-1"></i>
                                Đăng Nhập
                            </Link>
                        </div>
                    </div>
                </nav>
            );
    }
}

export default RoleBasedNavigation;
