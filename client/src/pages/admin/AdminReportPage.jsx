import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';
// import { get_current_user } from '../../services/apiService';
// import { generate_enrollment_report, generate_performance_report, generate_schedule_report } from '../../services/apiService';

/**
 * AdminReportPage - Comprehensive report generation interface for administrators
 * Features:
 * - Generate enrollment reports by class, subject, or date range
 * - Create class performance reports with exam statistics
 * - Export schedule utilization reports
 * - Download reports in PDF/Excel format
 * - View historical report archives
 */
function AdminReportPage() {
    // TODO: const navigate = useNavigate();
    
    // State management
    const [current_user, set_current_user] = useState(null);
    const [loading, set_loading] = useState(true);
    const [generating_report, set_generating_report] = useState(false);
    const [selected_report_type, set_selected_report_type] = useState('enrollment');
    const [report_filters, set_report_filters] = useState({
        start_date: '',
        end_date: '',
        subject_id: '',
        class_id: '',
        grade_level: '',
        format: 'pdf'
    });
    const [generated_reports, set_generated_reports] = useState([]);
    const [available_filters, set_available_filters] = useState({
        subjects: [],
        classes: [],
        grade_levels: []
    });

    // Load component data
    useEffect(() => {
        const load_component_data = async () => {
            try {
                // TODO: Implement actual API calls
                // const user = await get_current_user();
                // set_current_user(user);
                
                // Mock user data
                const mock_user = {
                    user_id: 1,
                    role: 'admin',
                    full_name: 'Quản trị viên'
                };
                set_current_user(mock_user);

                // Mock available filters
                const mock_filters = {
                    subjects: [
                        { subject_id: 1, subject_name: 'Toán học', subject_code: 'MATH' },
                        { subject_id: 2, subject_name: 'Vật lý', subject_code: 'PHYS' },
                        { subject_id: 3, subject_name: 'Hóa học', subject_code: 'CHEM' },
                        { subject_id: 4, subject_name: 'Sinh học', subject_code: 'BIO' }
                    ],
                    classes: [
                        { class_id: 1, class_name: 'Lớp 10A1', grade_level: 10 },
                        { class_id: 2, class_name: 'Lớp 10A2', grade_level: 10 },
                        { class_id: 3, class_name: 'Lớp 11A1', grade_level: 11 },
                        { class_id: 4, class_name: 'Lớp 12A1', grade_level: 12 }
                    ],
                    grade_levels: [10, 11, 12]
                };
                set_available_filters(mock_filters);

                // Mock recent reports
                const mock_reports = [
                    {
                        report_id: 1,
                        report_type: 'enrollment',
                        title: 'Báo cáo đăng ký môn học tháng 12/2024',
                        generated_at: new Date('2024-12-15'),
                        generated_by: 'Quản trị viên',
                        file_size: '2.3 MB',
                        format: 'PDF',
                        download_count: 15
                    },
                    {
                        report_id: 2,
                        report_type: 'performance',
                        title: 'Thống kê kết quả thi cuối kỳ',
                        generated_at: new Date('2024-12-10'),
                        generated_by: 'Quản trị viên',
                        file_size: '1.8 MB',
                        format: 'Excel',
                        download_count: 8
                    },
                    {
                        report_id: 3,
                        report_type: 'schedule',
                        title: 'Báo cáo sử dụng phòng thi',
                        generated_at: new Date('2024-12-05'),
                        generated_by: 'Quản trị viên',
                        file_size: '1.2 MB',
                        format: 'PDF',
                        download_count: 12
                    }
                ];
                set_generated_reports(mock_reports);

                set_loading(false);
            } catch (error) {
                console.error('Error loading report page data:', error);
                set_loading(false);
            }
        };

        load_component_data();
    }, []);

    // Check user authorization
    if (current_user && current_user.role !== 'admin') {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-danger">
                    <h4>Truy cập bị từ chối</h4>
                    <p>Bạn không có quyền truy cập trang này.</p>
                </div>
            </div>
        );
    }

    // Handle filter changes
    const handle_filter_change = (field, value) => {
        set_report_filters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Generate report
    const handle_generate_report = async () => {
        set_generating_report(true);
        
        try {
            // TODO: Implement actual API calls
            // let report_data;
            // switch (selected_report_type) {
            //     case 'enrollment':
            //         report_data = await generate_enrollment_report(report_filters);
            //         break;
            //     case 'performance':
            //         report_data = await generate_performance_report(report_filters);
            //         break;
            //     case 'schedule':
            //         report_data = await generate_schedule_report(report_filters);
            //         break;
            // }

            // Mock report generation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const new_report = {
                report_id: Date.now(),
                report_type: selected_report_type,
                title: get_report_title(selected_report_type),
                generated_at: new Date(),
                generated_by: current_user.full_name,
                file_size: '1.5 MB',
                format: report_filters.format.toUpperCase(),
                download_count: 0
            };

            set_generated_reports(prev => [new_report, ...prev]);
            
            // Reset filters
            set_report_filters({
                start_date: '',
                end_date: '',
                subject_id: '',
                class_id: '',
                grade_level: '',
                format: 'pdf'
            });

        } catch (error) {
            console.error('Error generating report:', error);
            alert('Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại.');
        } finally {
            set_generating_report(false);
        }
    };

    // Get report title based on type
    const get_report_title = (type) => {
        const titles = {
            enrollment: 'Báo cáo đăng ký môn học',
            performance: 'Báo cáo kết quả học tập',
            schedule: 'Báo cáo lịch thi và sử dụng phòng'
        };
        return titles[type] || 'Báo cáo tổng hợp';
    };

    // Download report (mock function)
    const handle_download_report = (report) => {
        // TODO: Implement actual download functionality
        console.log('Downloading report:', report);
        alert(`Đang tải xuống: ${report.title}`);
        
        // Update download count
        set_generated_reports(prev => 
            prev.map(r => 
                r.report_id === report.report_id 
                    ? { ...r, download_count: r.download_count + 1 }
                    : r
            )
        );
    };

    // Format date for display
    const format_date = (date) => {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    if (loading) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <Breadcrumb 
                items={[
                    { label: 'Trang chủ', href: '/admin' },
                    { label: 'Báo cáo', active: true }
                ]} 
            />

            <div className="row">
                {/* Report Generation Panel */}
                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="fas fa-chart-line me-2"></i>
                                Tạo báo cáo mới
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* Report Type Selection */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <label className="form-label fw-bold">Loại báo cáo</label>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="radio" 
                                                    name="report_type" 
                                                    id="enrollment_report"
                                                    value="enrollment"
                                                    checked={selected_report_type === 'enrollment'}
                                                    onChange={(e) => set_selected_report_type(e.target.value)}
                                                />
                                                <label className="form-check-label" htmlFor="enrollment_report">
                                                    <strong>Đăng ký môn học</strong>
                                                    <br />
                                                    <small className="text-muted">Thống kê học sinh đăng ký môn học</small>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="radio" 
                                                    name="report_type" 
                                                    id="performance_report"
                                                    value="performance"
                                                    checked={selected_report_type === 'performance'}
                                                    onChange={(e) => set_selected_report_type(e.target.value)}
                                                />
                                                <label className="form-check-label" htmlFor="performance_report">
                                                    <strong>Kết quả học tập</strong>
                                                    <br />
                                                    <small className="text-muted">Điểm thi và thành tích lớp học</small>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-check">
                                                <input 
                                                    className="form-check-input" 
                                                    type="radio" 
                                                    name="report_type" 
                                                    id="schedule_report"
                                                    value="schedule"
                                                    checked={selected_report_type === 'schedule'}
                                                    onChange={(e) => set_selected_report_type(e.target.value)}
                                                />
                                                <label className="form-check-label" htmlFor="schedule_report">
                                                    <strong>Lịch thi và phòng học</strong>
                                                    <br />
                                                    <small className="text-muted">Sử dụng phòng và lịch trình thi</small>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <label className="form-label">Từ ngày</label>
                                    <input 
                                        type="date" 
                                        className="form-control"
                                        value={report_filters.start_date}
                                        onChange={(e) => handle_filter_change('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Đến ngày</label>
                                    <input 
                                        type="date" 
                                        className="form-control"
                                        value={report_filters.end_date}
                                        onChange={(e) => handle_filter_change('end_date', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="row mb-4">
                                {selected_report_type !== 'schedule' && (
                                    <div className="col-md-4">
                                        <label className="form-label">Môn học</label>
                                        <select 
                                            className="form-select"
                                            value={report_filters.subject_id}
                                            onChange={(e) => handle_filter_change('subject_id', e.target.value)}
                                        >
                                            <option value="">Tất cả môn học</option>
                                            {available_filters.subjects.map(subject => (
                                                <option key={subject.subject_id} value={subject.subject_id}>
                                                    {subject.subject_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <div className="col-md-4">
                                    <label className="form-label">Lớp học</label>
                                    <select 
                                        className="form-select"
                                        value={report_filters.class_id}
                                        onChange={(e) => handle_filter_change('class_id', e.target.value)}
                                    >
                                        <option value="">Tất cả lớp học</option>
                                        {available_filters.classes.map(cls => (
                                            <option key={cls.class_id} value={cls.class_id}>
                                                {cls.class_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Định dạng</label>
                                    <select 
                                        className="form-select"
                                        value={report_filters.format}
                                        onChange={(e) => handle_filter_change('format', e.target.value)}
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="excel">Excel</option>
                                        <option value="csv">CSV</option>
                                    </select>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="d-flex justify-content-end">
                                <button 
                                    className="btn btn-primary btn-lg"
                                    onClick={handle_generate_report}
                                    disabled={generating_report}
                                >
                                    {generating_report ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Đang tạo báo cáo...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-file-export me-2"></i>
                                            Tạo báo cáo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="col-lg-4">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h6 className="mb-0">Thống kê nhanh</h6>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-6 mb-3">
                                    <div className="bg-primary bg-opacity-10 rounded p-3">
                                        <div className="h4 mb-1 text-primary">156</div>
                                        <small className="text-muted">Báo cáo đã tạo</small>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="bg-success bg-opacity-10 rounded p-3">
                                        <div className="h4 mb-1 text-success">42</div>
                                        <small className="text-muted">Tháng này</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="bg-info bg-opacity-10 rounded p-3">
                                        <div className="h4 mb-1 text-info">8.2GB</div>
                                        <small className="text-muted">Dung lượng lưu trữ</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="bg-warning bg-opacity-10 rounded p-3">
                                        <div className="h4 mb-1 text-warning">289</div>
                                        <small className="text-muted">Lượt tải xuống</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="fas fa-history me-2"></i>
                                Báo cáo đã tạo
                            </h5>
                            <button className="btn btn-outline-secondary btn-sm">
                                <i className="fas fa-archive me-1"></i>
                                Xem tất cả
                            </button>
                        </div>
                        <div className="card-body">
                            {generated_reports.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                                    <p className="text-muted">Chưa có báo cáo nào được tạo.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Tên báo cáo</th>
                                                <th>Loại</th>
                                                <th>Người tạo</th>
                                                <th>Ngày tạo</th>
                                                <th>Định dạng</th>
                                                <th>Kích thước</th>
                                                <th>Lượt tải</th>
                                                <th>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {generated_reports.map(report => (
                                                <tr key={report.report_id}>
                                                    <td>
                                                        <div className="fw-medium">{report.title}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${
                                                            report.report_type === 'enrollment' ? 'bg-primary' :
                                                            report.report_type === 'performance' ? 'bg-success' :
                                                            'bg-info'
                                                        }`}>
                                                            {report.report_type === 'enrollment' ? 'Đăng ký' :
                                                             report.report_type === 'performance' ? 'Kết quả' :
                                                             'Lịch trình'}
                                                        </span>
                                                    </td>
                                                    <td>{report.generated_by}</td>
                                                    <td>{format_date(report.generated_at)}</td>
                                                    <td>
                                                        <span className="badge bg-secondary">
                                                            {report.format}
                                                        </span>
                                                    </td>
                                                    <td>{report.file_size}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">
                                                            {report.download_count}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handle_download_report(report)}
                                                            title="Tải xuống"
                                                        >
                                                            <i className="fas fa-download"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminReportPage;
