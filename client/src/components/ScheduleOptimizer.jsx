import React, { useState, useEffect, useCallback } from 'react';
import { getScheduleConflicts } from '../services/apiService';

/**
 * ScheduleOptimizer Component
 * 
 * Provides real-time schedule conflict detection and optimization suggestions.
 * Can be embedded in other pages or used as a standalone optimizer.
 * 
 * Features:
 * - Real-time conflict detection
 * - Severity-based filtering (Critical, Warning, Info)
 * - Auto-refresh via WebSocket events
 * - Visual conflict indicators
 * - Optimization suggestions
 * 
 * @param {Object} props - Component props
 * @param {Object} [props.filters] - Date/scope filters for analysis
 * @param {boolean} [props.embedded=false] - Whether component is embedded (compact view)
 * @param {Function} [props.onConflictUpdate] - Callback when conflicts change
 * @param {boolean} [props.autoRefresh=true] - Auto-refresh when enabled
 * @param {number} [props.refreshInterval=30000] - Refresh interval in milliseconds
 */
const ScheduleOptimizer = ({ 
    filters = {}, 
    embedded = false, 
    onConflictUpdate,
    autoRefresh = true,
    refreshInterval = 30000 
}) => {
    const [conflicts, setConflicts] = useState([]);
    const [summary, setSummary] = useState({
        total_conflicts: 0,
        critical_count: 0,
        warning_count: 0,
        info_count: 0,
        exams_analyzed: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [expandedConflict, setExpandedConflict] = useState(null);

    /**
     * Load schedule conflicts with current filters
     */
    const loadConflicts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const analysis_filters = {
                ...filters,
                severity: selectedSeverity
            };

            const response = await getScheduleConflicts(analysis_filters);
            
            if (response.success) {
                setConflicts(response.data || []);
                setSummary(response.summary || {});
                
                // Notify parent component if callback provided
                if (onConflictUpdate) {
                    onConflictUpdate(response);
                }
            } else {
                throw new Error(response.message || 'Không thể tải phân tích xung đột');
            }
        } catch (err) {
            console.error('Error loading schedule conflicts:', err);
            setError(err.message);
            setConflicts([]);
        } finally {
            setLoading(false);
        }
    }, [filters, selectedSeverity, onConflictUpdate]);

    /**
     * Auto-refresh effect
     */
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(loadConflicts, refreshInterval);
        return () => clearInterval(interval);
    }, [loadConflicts, autoRefresh, refreshInterval]);

    /**
     * Initial load and filter change effect
     */
    useEffect(() => {
        loadConflicts();
    }, [loadConflicts]);

    /**
     * Get severity badge styling
     */
    const getSeverityBadge = useCallback((severity) => {
        const styles = {
            critical: { bg: 'danger', icon: 'bi-exclamation-triangle-fill' },
            warning: { bg: 'warning', icon: 'bi-exclamation-triangle' },
            info: { bg: 'info', icon: 'bi-info-circle' }
        };
        return styles[severity] || styles.info;
    }, []);

    /**
     * Get conflict type icon
     */
    const getConflictIcon = useCallback((type) => {
        const icons = {
            room_conflict: 'bi-door-closed',
            proctor_conflict: 'bi-person-exclamation',
            capacity_issue: 'bi-people-fill',
            time_optimization: 'bi-clock-history',
            resource_efficiency: 'bi-diagram-3'
        };
        return icons[type] || 'bi-exclamation-triangle';
    }, []);

    /**
     * Render conflict details based on type
     */
    const renderConflictDetails = useCallback((conflict) => {
        const { type, details } = conflict;

        switch (type) {
            case 'room_conflict':
                return (
                    <div className="mt-2">
                        <h6 className="mb-2">
                            <i className="bi bi-door-closed me-2"></i>
                            Xung đột phòng: {details.room_name}
                        </h6>
                        <p className="text-muted mb-2">
                            Ngày: {new Date(details.date).toLocaleDateString('vi-VN')}
                        </p>
                        <div className="row">
                            {details.conflicting_exams.map((exam, index) => (
                                <div key={exam.exam_id} className="col-md-6 mb-2">
                                    <div className="border rounded p-2">
                                        <strong>{exam.title}</strong>
                                        <br />
                                        <small className="text-muted">{exam.subject}</small>
                                        <br />
                                        <span className="badge bg-primary">
                                            {exam.start_time} - {exam.end_time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'proctor_conflict':
                return (
                    <div className="mt-2">
                        <h6 className="mb-2">
                            <i className="bi bi-person-exclamation me-2"></i>
                            Giám thị xung đột: {details.proctor_name}
                        </h6>
                        <p className="text-muted mb-2">
                            Ngày: {new Date(details.date).toLocaleDateString('vi-VN')}
                        </p>
                        <div className="row">
                            {details.conflicting_exams.map((exam, index) => (
                                <div key={exam.exam_id} className="col-md-6 mb-2">
                                    <div className="border rounded p-2">
                                        <strong>{exam.title}</strong>
                                        <br />
                                        <small className="text-muted">
                                            Vai trò: {exam.role} • Phòng: {exam.room_name}
                                        </small>
                                        <br />
                                        <span className="badge bg-primary">
                                            {exam.start_time} - {exam.end_time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'capacity_issue':
                return (
                    <div className="mt-2">
                        <h6 className="mb-2">
                            <i className="bi bi-people-fill me-2"></i>
                            Vấn đề sức chứa
                        </h6>
                        {details.type === 'overcapacity' ? (
                            <div className="alert alert-warning">
                                <strong>{details.exam_title}</strong>
                                <br />
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {details.registered} học sinh đăng ký nhưng phòng {details.room_name} chỉ chứa {details.capacity}
                                <br />
                                <span className="text-danger">Vượt quá: {details.overflow} học sinh</span>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                <strong>{details.exam_title}</strong>
                                <br />
                                <i className="bi bi-person-badge me-2"></i>
                                Cần {details.recommended_proctors} giám thị cho {details.students} học sinh 
                                (hiện có {details.current_proctors})
                            </div>
                        )}
                    </div>
                );

            case 'time_optimization':
                return (
                    <div className="mt-2">
                        <h6 className="mb-2">
                            <i className="bi bi-clock-history me-2"></i>
                            Tối ưu hóa thời gian
                        </h6>
                        <div className="alert alert-light">
                            <p>{details.message}</p>
                            {details.gap_hours && (
                                <small className="text-muted">
                                    Khoảng trống: {details.gap_hours} giờ
                                </small>
                            )}
                        </div>
                    </div>
                );

            case 'resource_efficiency':
                return (
                    <div className="mt-2">
                        <h6 className="mb-2">
                            <i className="bi bi-diagram-3 me-2"></i>
                            Tối ưu hóa tài nguyên
                        </h6>
                        <div className="alert alert-light">
                            <p>{details.message}</p>
                            {details.utilization_rate && (
                                <div className="progress mt-2" style={{height: '4px'}}>
                                    <div 
                                        className="progress-bar bg-info"
                                        style={{width: `${details.utilization_rate}%`}}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="mt-2">
                        <p className="text-muted">{conflict.description}</p>
                    </div>
                );
        }
    }, []);

    /**
     * Render embedded (compact) view
     */
    const renderEmbeddedView = () => (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <div>
                    <i className="bi bi-shield-exclamation me-2"></i>
                    <strong>Trình tối ưu lịch thi</strong>
                </div>
                <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={loadConflicts}
                    disabled={loading}
                >
                    <i className={`bi ${loading ? 'bi-arrow-clockwise spinner-border spinner-border-sm' : 'bi-arrow-clockwise'} me-1`}></i>
                    Làm mới
                </button>
            </div>
            <div className="card-body p-3">
                {error ? (
                    <div className="alert alert-danger mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                ) : (
                    <div>
                        {/* Summary Cards */}
                        <div className="row g-2 mb-3">
                            <div className="col-3">
                                <div className="text-center">
                                    <div className="h4 mb-1 text-danger">{summary.critical_count}</div>
                                    <small className="text-muted">Nghiêm trọng</small>
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="text-center">
                                    <div className="h4 mb-1 text-warning">{summary.warning_count}</div>
                                    <small className="text-muted">Cảnh báo</small>
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="text-center">
                                    <div className="h4 mb-1 text-info">{summary.info_count}</div>
                                    <small className="text-muted">Gợi ý</small>
                                </div>
                            </div>
                            <div className="col-3">
                                <div className="text-center">
                                    <div className="h4 mb-1 text-primary">{summary.exams_analyzed}</div>
                                    <small className="text-muted">Kỳ thi</small>
                                </div>
                            </div>
                        </div>

                        {/* Quick Conflict List */}
                        {conflicts.length > 0 ? (
                            <div className="list-group list-group-flush">
                                {conflicts.slice(0, embedded ? 3 : conflicts.length).map((conflict, index) => {
                                    const badge = getSeverityBadge(conflict.severity);
                                    return (
                                        <div key={index} className="list-group-item border-0 px-0 py-2">
                                            <div className="d-flex align-items-start">
                                                <i className={`${getConflictIcon(conflict.type)} me-2 mt-1`}></i>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <h6 className="mb-1 small">{conflict.title}</h6>
                                                        <span className={`badge bg-${badge.bg} badge-sm`}>
                                                            {conflict.severity}
                                                        </span>
                                                    </div>
                                                    <p className="mb-0 small text-muted">{conflict.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {embedded && conflicts.length > 3 && (
                                    <div className="text-center pt-2">
                                        <small className="text-muted">
                                            +{conflicts.length - 3} xung đột khác
                                        </small>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-success">
                                <i className="bi bi-check-circle-fill h4"></i>
                                <p className="mb-0 small">Không có xung đột</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    /**
     * Render full view
     */
    const renderFullView = () => (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">
                        <i className="bi bi-shield-exclamation me-2"></i>
                        Trình tối ưu lịch thi
                    </h4>
                    <p className="text-muted mb-0">
                        Phân tích xung đột và đưa ra gợi ý tối ưu hóa lịch thi
                    </p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={loadConflicts}
                    disabled={loading}
                >
                    <i className={`bi ${loading ? 'bi-arrow-clockwise spinner-border spinner-border-sm' : 'bi-arrow-clockwise'} me-2`}></i>
                    Phân tích lại
                </button>
            </div>

            {/* Summary Statistics */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-danger">
                        <div className="card-body text-center">
                            <i className="bi bi-exclamation-triangle-fill text-danger h1"></i>
                            <h3 className="text-danger">{summary.critical_count}</h3>
                            <p className="mb-0">Xung đột nghiêm trọng</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-warning">
                        <div className="card-body text-center">
                            <i className="bi bi-exclamation-triangle text-warning h1"></i>
                            <h3 className="text-warning">{summary.warning_count}</h3>
                            <p className="mb-0">Cảnh báo</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-info">
                        <div className="card-body text-center">
                            <i className="bi bi-info-circle text-info h1"></i>
                            <h3 className="text-info">{summary.info_count}</h3>
                            <p className="mb-0">Gợi ý tối ưu</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-primary">
                        <div className="card-body text-center">
                            <i className="bi bi-calendar-check text-primary h1"></i>
                            <h3 className="text-primary">{summary.exams_analyzed}</h3>
                            <p className="mb-0">Kỳ thi đã phân tích</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Severity Filter */}
            <div className="card mb-4">
                <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Bộ lọc mức độ</h5>
                        <div className="btn-group" role="group">
                            {[
                                { key: 'all', label: 'Tất cả', icon: 'bi-list' },
                                { key: 'critical', label: 'Nghiêm trọng', icon: 'bi-exclamation-triangle-fill' },
                                { key: 'warning', label: 'Cảnh báo', icon: 'bi-exclamation-triangle' },
                                { key: 'info', label: 'Gợi ý', icon: 'bi-info-circle' }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    className={`btn ${selectedSeverity === filter.key ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setSelectedSeverity(filter.key)}
                                >
                                    <i className={`${filter.icon} me-1`}></i>
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Conflicts List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang phân tích...</span>
                    </div>
                    <p className="mt-3 text-muted">Đang phân tích xung đột lịch thi...</p>
                </div>
            ) : error ? (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Lỗi phân tích:</strong> {error}
                </div>
            ) : conflicts.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-check-circle-fill text-success display-1"></i>
                    <h3 className="text-success mt-3">Tuyệt vời!</h3>
                    <p className="text-muted">Không phát hiện xung đột lịch thi nào.</p>
                </div>
            ) : (
                <div className="accordion" id="conflictsAccordion">
                    {conflicts.map((conflict, index) => {
                        const badge = getSeverityBadge(conflict.severity);
                        const isExpanded = expandedConflict === index;
                        
                        return (
                            <div key={index} className="accordion-item">
                                <h2 className="accordion-header">
                                    <button 
                                        className={`accordion-button ${isExpanded ? '' : 'collapsed'}`}
                                        type="button"
                                        onClick={() => setExpandedConflict(isExpanded ? null : index)}
                                    >
                                        <div className="d-flex align-items-center w-100">
                                            <i className={`${badge.icon} me-3 text-${badge.bg}`}></i>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">{conflict.title}</h6>
                                                    <span className={`badge bg-${badge.bg} me-3`}>
                                                        {conflict.severity}
                                                    </span>
                                                </div>
                                                <small className="text-muted">{conflict.description}</small>
                                            </div>
                                        </div>
                                    </button>
                                </h2>
                                <div className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}>
                                    <div className="accordion-body">
                                        {renderConflictDetails(conflict)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return embedded ? renderEmbeddedView() : renderFullView();
};

export default ScheduleOptimizer;
