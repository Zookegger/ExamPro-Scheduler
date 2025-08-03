import React from 'react';

/**
 * Role-Based Footer Component
 * 
 * Renders different footers based on user role:
 * - Student: Green footer with student portal text
 * - Teacher: Info-colored footer with teacher portal text
 * - Guest: Light footer with general system text
 * - Admin: No footer (full-height layout)
 * 
 * @param {Object} props
 * @param {string} props.current_user_role - Current user's role
 * @param {boolean} props.is_development - Whether development mode is enabled
 */
function RoleBasedFooter({ current_user_role, is_development }) {
    switch (current_user_role) {
        case "admin":
            // Admin users don't get a footer (full-height layout)
            return null;

        case "student":
            return (
                <footer className="bg-success text-white text-center p-3">
                    <small>
                        © 2025 ExamPro Scheduler - Student Portal
                        {is_development && (
                            <span className="ms-2 badge bg-warning text-dark">
                                DEVELOPMENT MODE
                            </span>
                        )}
                    </small>
                </footer>
            );

        case "teacher":
            return (
                <footer className="bg-info text-white text-center p-3">
                    <small>
                        © 2025 ExamPro Scheduler - Teacher Portal
                        {is_development && (
                            <span className="ms-2 badge bg-warning text-dark">
                                DEVELOPMENT MODE
                            </span>
                        )}
                    </small>
                </footer>
            );

        default:
            // Guest users
            return (
                <footer className="bg-light text-center p-3">
                    <small className="text-muted">
                        © 2025 ExamPro Scheduler - Hệ thống quản lý lịch thi
                        {is_development && (
                            <span className="ms-2 badge bg-warning text-dark">
                                DEVELOPMENT MODE
                            </span>
                        )}
                    </small>
                </footer>
            );
    }
}

export default RoleBasedFooter;
