import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
import ScheduleOptimizer from '../../components/ScheduleOptimizer';
import useWebsocketConnection from '../../hooks/use_websocket_connection';

/**
 * Schedule Optimizer Page
 * 
 * Comprehensive schedule conflict analysis and optimization dashboard for admins.
 * Features:
 * - Real-time conflict detection
 * - Interactive filtering and analysis
 * - WebSocket integration for live updates
 * - Detailed conflict resolution suggestions
 * - Export and reporting capabilities
 * 
 * This page provides administrators with a centralized view of all schedule conflicts
 * and optimization opportunities across the entire exam system.
 */
function ScheduleOptimizerPage() {
    const navigate = useNavigate();
    
    // Component state
    const [dateFilters, setDateFilters] = useState({
        start_date: '',
        end_date: ''
    });
    const [conflictSummary, setConflictSummary] = useState(null);
    const [lastAnalysis, setLastAnalysis] = useState(null);

    // WebSocket connection for real-time updates
    const { 
        connection_status, 
        is_connected 
    } = useWebsocketConnection({
        events: {
            'schedule_update': handleScheduleUpdate,
            'assignment_notification': handleAssignmentUpdate
        },
        debug: true
    });

    /**
     * Handle schedule updates from WebSocket
     */
    function handleScheduleUpdate(data) {
        console.log('📅 Schedule updated, refreshing conflict analysis:', data);
        // The ScheduleOptimizer component will auto-refresh via its own WebSocket events
    }

    /**
     * Handle assignment updates from WebSocket
     */
    function handleAssignmentUpdate(data) {
        console.log('👥 Assignment updated, may affect conflicts:', data);
        // The ScheduleOptimizer component will auto-refresh
    }

    /**
     * Handle conflict analysis updates from child component
     */
    const handleConflictUpdate = useCallback((analysisResult) => {
        if (analysisResult.success) {
            setConflictSummary(analysisResult.summary);
            setLastAnalysis(new Date());
        }
    }, []);

    /**
     * Handle date filter changes
     */
    const handleDateFilterChange = useCallback((field, value) => {
        setDateFilters(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    /**
     * Navigate to schedule management
     */
    const handleNavigateToSchedule = useCallback(() => {
        navigate('/admin/manage-schedule');
    }, [navigate]);

    /**
     * Navigate to exam management
     */
    const handleNavigateToExams = useCallback(() => {
        navigate('/admin/manage-exam');
    }, [navigate]);

    /**
     * Export conflict report (placeholder for future implementation)
     */
    const handleExportReport = useCallback(() => {
        // TODO: Implement export functionality
        alert('Tính năng xuất báo cáo sẽ được triển khai trong phiên bản tiếp theo');
    }, []);

    return (
        <div className="container-fluid">
            {/* Breadcrumb Navigation */}
            <Breadcrumb 
                items={[
                    { label: 'Dashboard', href: '/admin' },
                    { label: 'Quản lý lịch thi', href: '/admin/manage-schedule' },
                    { label: 'Trình tối ưu lịch thi', active: true }
                ]} 
            />

            {/* Page Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <h2 className="mb-2">
                                <i className="bi bi-shield-exclamation me-3"></i>
                                Trình tối ưu lịch thi
                            </h2>
                            <p className="text-muted mb-0">
                                Phân tích xung đột và đưa ra gợi ý tối ưu hóa để cải thiện hiệu quả lập lịch thi
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={handleExportReport}
                                title="Xuất báo cáo"
                            >
                                <i className="bi bi-download me-2"></i>
                                Xuất báo cáo
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleNavigateToSchedule}
                            >
                                <i className="bi bi-calendar-event me-2"></i>
                                Quản lý lịch thi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Status & Quick Stats */}
            <div className="row mb-4">
                <div className="col-md-8">
                    {/* Date Range Filter */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-funnel me-2"></i>
                                Bộ lọc phân tích
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Từ ngày</label>
                                    <input 
                                        type="date" 
                                        className="form-control"
                                        value={dateFilters.start_date}
                                        onChange={(e) => handleDateFilterChange('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Đến ngày</label>
                                    <input 
                                        type="date" 
                                        className="form-control"
                                        value={dateFilters.end_date}
                                        onChange={(e) => handleDateFilterChange('end_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    {/* Connection Status & Analysis Info */}
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-wifi me-2"></i>
                                Trạng thái kết nối
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className={`badge ${is_connected ? 'bg-success' : 'bg-danger'} me-2`}>
                                    <i className={`bi ${is_connected ? 'bi-wifi' : 'bi-wifi-off'} me-1`}></i>
                                    {is_connected ? 'Đã kết nối' : 'Mất kết nối'}
                                </div>
                                <small className="text-muted">{connection_status}</small>
                            </div>
                            
                            {lastAnalysis && (
                                <div>
                                    <small className="text-muted">
                                        <i className="bi bi-clock me-1"></i>
                                        Phân tích lần cuối: {lastAnalysis.toLocaleTimeString('vi-VN')}
                                    </small>
                                </div>
                            )}

                            {conflictSummary && (
                                <div className="mt-3">
                                    <div className="row g-2 text-center">
                                        <div className="col-6">
                                            <div className="text-danger h4">{conflictSummary.critical_count}</div>
                                            <small className="text-muted">Nghiêm trọng</small>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-warning h4">{conflictSummary.warning_count}</div>
                                            <small className="text-muted">Cảnh báo</small>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card bg-light">
                        <div className="card-body">
                            <h6 className="mb-3">
                                <i className="bi bi-lightning-charge me-2"></i>
                                Hành động nhanh
                            </h6>
                            <div className="d-flex flex-wrap gap-2">
                                <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={handleNavigateToSchedule}
                                    title="Điều chỉnh lịch thi"
                                >
                                    <i className="bi bi-calendar-event me-1"></i>
                                    Điều chỉnh lịch
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-info"
                                    onClick={handleNavigateToExams}
                                    title="Quản lý kỳ thi"
                                >
                                    <i className="bi bi-clipboard-check me-1"></i>
                                    Quản lý kỳ thi
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => navigate('/admin/manage-room')}
                                    title="Quản lý phòng thi"
                                >
                                    <i className="bi bi-door-closed me-1"></i>
                                    Quản lý phòng
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() => navigate('/admin/stats-dashboard')}
                                    title="Thống kê tổng quan"
                                >
                                    <i className="bi bi-graph-up me-1"></i>
                                    Thống kê
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Optimizer Component */}
            <div className="row">
                <div className="col-12">
                    <ScheduleOptimizer 
                        filters={dateFilters}
                        embedded={false}
                        onConflictUpdate={handleConflictUpdate}
                        autoRefresh={true}
                        refreshInterval={30000}
                    />
                </div>
            </div>

            {/* Additional Information */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0 bg-light">
                        <div className="card-body">
                            <h6 className="mb-3">
                                <i className="bi bi-info-circle me-2"></i>
                                Hướng dẫn sử dụng
                            </h6>
                            <div className="row">
                                <div className="col-md-4">
                                    <h6 className="text-danger">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        Xung đột nghiêm trọng
                                    </h6>
                                    <p className="small text-muted">
                                        Các xung đột cần được giải quyết ngay lập tức như trùng phòng thi, 
                                        giám thị bị phân công đồng thời nhiều kỳ thi.
                                    </p>
                                </div>
                                <div className="col-md-4">
                                    <h6 className="text-warning">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Cảnh báo
                                    </h6>
                                    <p className="small text-muted">
                                        Các vấn đề có thể ảnh hưởng đến chất lượng thi như thiếu giám thị, 
                                        vượt quá sức chứa phòng.
                                    </p>
                                </div>
                                <div className="col-md-4">
                                    <h6 className="text-info">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Gợi ý tối ưu
                                    </h6>
                                    <p className="small text-muted">
                                        Các đề xuất để cải thiện hiệu quả sử dụng tài nguyên và 
                                        tối ưu hóa thời gian thi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleOptimizerPage;
