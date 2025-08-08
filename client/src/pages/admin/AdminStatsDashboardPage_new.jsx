/**
 * Consolidated Admin Statistics Dashboard
 * 
 * Comprehensive dashboard combining system statistics, enrollment data,
 * exam performance metrics, and real-time activity feeds using live API data.
 * 
 * Features:
 * - Real-time system metrics with WebSocket integration
 * - Live enrollment and exam statistics
 * - Recent activity feed with auto-refresh
 * - Vietnamese educational context with bilingual UI
 * - Bootstrap 5 responsive layout with interactive charts
 * 
 * Vietnamese Context: Supports grades 10-12, Vietnamese subjects, and
 * educational terminology for high school examination management.
 */

import React, { useState, useEffect } from 'react';
import { 
    getSystemStatistics, 
    getEnrollmentStatistics, 
    getExamStatistics, 
    getRecentActivity 
} from '../../services/apiService';
import useWebsocketConnection from '../../hooks/use_websocket_connection';
import AccessDeniedPage from '../common/AccessDeniedPage';
import Breadcrumb from '../../components/Breadcrumb';

function AdminStatsDashboardPage({ current_user_role }) {
    // State management for dashboard data
    const [system_stats, set_system_stats] = useState(null);
    const [enrollment_stats, set_enrollment_stats] = useState(null);
    const [exam_stats, set_exam_stats] = useState(null);
    const [recent_activity, set_recent_activity] = useState([]);
    const [loading, set_loading] = useState(true);
    const [error, set_error] = useState(null);
    const [refresh_time, set_refresh_time] = useState(new Date());
    const [filters, set_filters] = useState({
        period: 'current_semester'
    });

    // WebSocket connection for real-time updates
    const { 
        is_connected, 
        join_room_management, 
        leave_room_management 
    } = useWebsocketConnection();

    /**
     * Load all dashboard statistics from API
     * Fetches system, enrollment, exam statistics and recent activity in parallel
     */
    const load_dashboard_data = React.useCallback(async () => {
        try {
            set_loading(true);
            set_error(null);

            console.log('📊 Loading dashboard data with filters:', filters);

            // Parallel API calls for performance
            const [
                system_response,
                enrollment_response,
                exam_response,
                activity_response
            ] = await Promise.all([
                getSystemStatistics(filters),
                getEnrollmentStatistics(filters),
                getExamStatistics(filters),
                getRecentActivity({ limit: 10 })
            ]);

            // Update state with API responses
            if (system_response.success) {
                set_system_stats(system_response.data);
                console.log('✅ System statistics loaded:', system_response.data);
            }

            if (enrollment_response.success) {
                set_enrollment_stats(enrollment_response.data);
                console.log('✅ Enrollment statistics loaded:', enrollment_response.data);
            }

            if (exam_response.success) {
                set_exam_stats(exam_response.data);
                console.log('✅ Exam statistics loaded:', exam_response.data);
            }

            if (activity_response.success) {
                set_recent_activity(activity_response.data.activities);
                console.log('✅ Recent activity loaded:', activity_response.data.activities.length, 'items');
            }

            set_refresh_time(new Date());

        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            set_error(error.message || 'Lỗi khi tải dữ liệu dashboard');
        } finally {
            set_loading(false);
        }
    }, [filters]);

    /**
     * Handle filter changes and reload data
     */
    const handle_filter_change = (new_filters) => {
        set_filters(prev => ({ ...prev, ...new_filters }));
    };

    /**
     * Format percentage change with appropriate styling
     */
    const format_percentage_change = (change) => {
        if (!change && change !== 0) return '';
        
        const is_positive = change > 0;
        const color_class = is_positive ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';
        const icon = is_positive ? '↗' : change < 0 ? '↘' : '→';
        
        return (
            <small className={color_class}>
                {icon} {Math.abs(change)}%
            </small>
        );
    };

    /**
     * Get activity icon based on type
     */
    const get_activity_icon = (type) => {
        const icons = {
            'user_registration': '👤',
            'exam_scheduled': '📅',
            'exam_registration': '📝'
        };
        return icons[type] || '📌';
    };

    /**
     * Format numbers with Vietnamese locale
     */
    const format_number = (num) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    // Effects
    useEffect(() => {
        load_dashboard_data();
    }, [load_dashboard_data]);

    // Join admin dashboard room for real-time updates
    useEffect(() => {
        if (is_connected) {
            join_room_management('admin_dashboard');
            console.log('🔌 Joined admin dashboard room for real-time updates');
        }

        return () => {
            if (is_connected) {
                leave_room_management('admin_dashboard');
            }
        };
    }, [is_connected, join_room_management, leave_room_management]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing dashboard data...');
            load_dashboard_data();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [load_dashboard_data]);

    // Role-based access control
    if (current_user_role !== 'admin') {
        return <AccessDeniedPage user_role={current_user_role} required_role="admin" />;
    }

    if (loading && !system_stats) {
        return (
            <div className="container-fluid py-4">
                <Breadcrumb current_page="Thống kê hệ thống" />
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center py-5">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Đang tải...</span>
                                </div>
                                <h5>Đang tải thống kê hệ thống...</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid py-4">
                <Breadcrumb current_page="Thống kê hệ thống" />
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-danger" role="alert">
                            <h4 className="alert-heading">Lỗi tải dữ liệu</h4>
                            <p>{error}</p>
                            <button 
                                className="btn btn-outline-danger" 
                                onClick={load_dashboard_data}
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <Breadcrumb current_page="Thống kê hệ thống" />
            
            {/* Header with filters and refresh controls */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h4 className="mb-0">📊 Thống Kê Tổng Quan Hệ Thống</h4>
                                <small className="text-muted">
                                    Cập nhật lần cuối: {refresh_time.toLocaleString('vi-VN')}
                                    {is_connected && (
                                        <span className="badge bg-success ms-2">
                                            🔌 Kết nối thời gian thực
                                        </span>
                                    )}
                                </small>
                            </div>
                            <div className="d-flex gap-2">
                                <select 
                                    className="form-select form-select-sm" 
                                    value={filters.period}
                                    onChange={(e) => handle_filter_change({ period: e.target.value })}
                                >
                                    <option value="current_semester">Học kỳ hiện tại</option>
                                    <option value="current_year">Năm học hiện tại</option>
                                    <option value="last_semester">Học kỳ trước</option>
                                    <option value="all_time">Tất cả thời gian</option>
                                </select>
                                <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={load_dashboard_data}
                                    disabled={loading}
                                >
                                    🔄 Làm mới
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Overview Cards */}
            {system_stats && (
                <div className="row mb-4">
                    <div className="col-md-3 mb-3">
                        <div className="card h-100 border-primary">
                            <div className="card-body text-center">
                                <div className="display-4 text-primary mb-2">👥</div>
                                <h5 className="card-title">Tổng Người Dùng</h5>
                                <h2 className="text-primary">{format_number(system_stats.total_users || 0)}</h2>
                                <p className="card-text">
                                    Mới: {system_stats.new_users_this_period || 0} 
                                    {format_percentage_change(system_stats.user_growth)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 mb-3">
                        <div className="card h-100 border-success">
                            <div className="card-body text-center">
                                <div className="display-4 text-success mb-2">📝</div>
                                <h5 className="card-title">Tổng Kỳ Thi</h5>
                                <h2 className="text-success">{format_number(system_stats.total_exams || 0)}</h2>
                                <p className="card-text">
                                    Sắp tới: {system_stats.upcoming_exams || 0} | 
                                    Hoàn thành: {system_stats.completed_exams || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 mb-3">
                        <div className="card h-100 border-info">
                            <div className="card-body text-center">
                                <div className="display-4 text-info mb-2">🏫</div>
                                <h5 className="card-title">Phòng Thi Hoạt Động</h5>
                                <h2 className="text-info">{format_number(system_stats.active_rooms || 0)}</h2>
                                <p className="card-text">
                                    Sử dụng: {system_stats.system_utilization || 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3 mb-3">
                        <div className="card h-100 border-warning">
                            <div className="card-body text-center">
                                <div className="display-4 text-warning mb-2">👨‍🏫</div>
                                <h5 className="card-title">Giám Thị Hoạt Động</h5>
                                <h2 className="text-warning">{format_number(system_stats.active_proctors || 0)}</h2>
                                <p className="card-text">
                                    Đăng ký: {format_number(system_stats.total_registrations || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Enrollment Statistics */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">📚 Thống Kê Đăng Ký</h5>
                        </div>
                        <div className="card-body">
                            {enrollment_stats ? (
                                <>
                                    <div className="mb-4">
                                        <h6>Theo Khối Lớp</h6>
                                        {enrollment_stats.by_grade?.map(grade => (
                                            <div key={grade.grade_level} className="d-flex justify-content-between align-items-center mb-2">
                                                <span>{grade.grade_display}</span>
                                                <span className="badge bg-primary">{format_number(grade.student_count)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h6>Môn Học Phổ Biến</h6>
                                        {enrollment_stats.by_subject?.slice(0, 5).map(subject => (
                                            <div key={subject.subject_code} className="d-flex justify-content-between align-items-center mb-2">
                                                <small>{subject.subject_name}</small>
                                                <span className="badge bg-info">{format_number(subject.enrollment_count)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {enrollment_stats.trends && (
                                        <div className="text-center">
                                            <small className="text-muted">
                                                Xu hướng tháng này: {format_number(enrollment_stats.trends.current_month)} 
                                                {format_percentage_change(enrollment_stats.trends.percentage_change)}
                                            </small>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    <p className="mt-2 mb-0">Đang tải thống kê đăng ký...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Exam Statistics */}
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">🎯 Thống Kê Kỳ Thi</h5>
                        </div>
                        <div className="card-body">
                            {exam_stats ? (
                                <>
                                    <div className="mb-4">
                                        <h6>Theo Trạng Thái</h6>
                                        {exam_stats.by_status?.map(status => (
                                            <div key={status.status} className="d-flex justify-content-between align-items-center mb-2">
                                                <span>{status.status_display}</span>
                                                <span className="badge bg-secondary">{format_number(status.count)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-4">
                                        <h6>Sử Dụng Phòng Thi</h6>
                                        {exam_stats.room_utilization?.slice(0, 3).map(room => (
                                            <div key={room.room_name} className="d-flex justify-content-between align-items-center mb-2">
                                                <small>{room.room_name}</small>
                                                <span className="badge bg-success">{room.utilization_rate}%</span>
                                            </div>
                                        ))}
                                    </div>

                                    {exam_stats.trends && (
                                        <div className="text-center">
                                            <small className="text-muted">
                                                Kỳ thi tháng này: {format_number(exam_stats.trends.this_month)}
                                                {format_percentage_change(exam_stats.trends.percentage_change)}
                                            </small>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                    <p className="mt-2 mb-0">Đang tải thống kê kỳ thi...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">🕐 Hoạt Động Gần Đây</h5>
                        </div>
                        <div className="card-body">
                            {recent_activity.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {recent_activity.map(activity => (
                                        <div key={activity.id} className="list-group-item border-0 px-0">
                                            <div className="d-flex align-items-center">
                                                <div className="me-3">
                                                    <span className="fs-4">{get_activity_icon(activity.type)}</span>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">{activity.title}</h6>
                                                    <p className="mb-1 text-muted">{activity.description}</p>
                                                    <small className="text-muted">{activity.relative_time}</small>
                                                </div>
                                                <div>
                                                    <span className={`badge bg-${activity.color}`}>
                                                        {activity.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-muted mb-0">Không có hoạt động gần đây</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminStatsDashboardPage;
