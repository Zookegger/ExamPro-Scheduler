import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getTeacherSubjects, getClassStudents } from "../../services/apiService";

function TeacherSubjectsPage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [subjects_data, set_subjects_data] = useState([]);
    const [loading, set_loading] = useState(true);
    const [selected_subject, set_selected_subject] = useState(null);
    const [view_mode, set_view_mode] = useState('overview'); // 'overview', 'classes', 'exams'

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('📚 Loading teacher subjects...');
        
        setTimeout(() => {
            const mock_subjects = [
                {
                    subject_code: 'MATH12',
                    subject_name: 'Toán học 12',
                    grade_level: 12,
                    total_classes: 3,
                    total_students: 95,
                    upcoming_exams: 2,
                    pending_grades: 5,
                    classes: [
                        {
                            class_id: 1,
                            class_code: '12A1',
                            class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                            student_count: 32,
                            room_name: 'Phòng A1',
                            schedule: 'T2, T4, T6 - 07:30-08:15'
                        },
                        {
                            class_id: 2,
                            class_code: '12A2',
                            class_name: 'Lớp 12A2 - Khối Tự Nhiên',
                            student_count: 31,
                            room_name: 'Phòng A2',
                            schedule: 'T3, T5, T7 - 08:20-09:05'
                        },
                        {
                            class_id: 3,
                            class_code: '12B1',
                            class_name: 'Lớp 12B1 - Khối Xã Hội',
                            student_count: 32,
                            room_name: 'Phòng B1',
                            schedule: 'T2, T4, T6 - 10:05-10:50'
                        }
                    ],
                    recent_exams: [
                        {
                            exam_id: 1,
                            title: 'Kiểm tra giữa kỳ',
                            exam_date: '2025-08-20',
                            status: 'scheduled',
                            registered_students: 90
                        },
                        {
                            exam_id: 2,
                            title: 'Kiểm tra 15 phút',
                            exam_date: '2025-08-25',
                            status: 'draft',
                            registered_students: 0
                        }
                    ]
                },
                {
                    subject_code: 'MATH11',
                    subject_name: 'Toán học 11',
                    grade_level: 11,
                    total_classes: 2,
                    total_students: 62,
                    upcoming_exams: 1,
                    pending_grades: 8,
                    classes: [
                        {
                            class_id: 4,
                            class_code: '11A1',
                            class_name: 'Lớp 11A1 - Khối Tự Nhiên',
                            student_count: 30,
                            room_name: 'Phòng A3',
                            schedule: 'T2, T4 - 14:00-14:45'
                        },
                        {
                            class_id: 5,
                            class_code: '11B2',
                            class_name: 'Lớp 11B2 - Khối Xã Hội',
                            student_count: 32,
                            room_name: 'Phòng C1',
                            schedule: 'T3, T6 - 15:00-15:45'
                        }
                    ],
                    recent_exams: [
                        {
                            exam_id: 3,
                            title: 'Kiểm tra cuối kỳ',
                            exam_date: '2025-09-10',
                            status: 'draft',
                            registered_students: 0
                        }
                    ]
                }
            ];

            set_subjects_data(mock_subjects);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_status_badge = (status) => {
        switch (status) {
            case 'scheduled':
                return <span className="badge bg-primary">Đã lên lịch</span>;
            case 'draft':
                return <span className="badge bg-secondary">Nháp</span>;
            case 'published':
                return <span className="badge bg-success">Đã công bố</span>;
            case 'completed':
                return <span className="badge bg-info">Hoàn thành</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_priority_class = (upcoming_exams, pending_grades) => {
        if (pending_grades > 10 || upcoming_exams > 3) return 'border-danger';
        if (pending_grades > 5 || upcoming_exams > 1) return 'border-warning';
        return 'border-success';
    };

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'teacher') {
        return <AccessDeniedPage message="Chỉ giáo viên mới có thể xem danh sách môn học của mình." />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Môn học của tôi", icon: "bi-journal-text" }
    ];

    if (loading) {
        return (
            <div className="container-fluid px-4">
                <Breadcrumb items={breadcrumb_items} />
                <div className="text-center mt-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="mt-3">Đang tải môn học...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-4">
            <Breadcrumb items={breadcrumb_items} />
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="h3 mb-1">
                        <i className="bi bi-journal-text text-info me-2"></i>
                        Môn học của tôi
                    </h2>
                    <p className="text-muted mb-0">Quản lý các môn học và lớp học</p>
                </div>
                <button className="btn btn-primary">
                    <i className="bi bi-plus-circle me-1"></i>
                    Tạo bài kiểm tra
                </button>
            </div>

            {/* Overview Statistics */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Tổng môn học</h5>
                                    <h3 className="mb-0">{subjects_data.length}</h3>
                                </div>
                                <i className="bi bi-journal-bookmark-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Tổng lớp học</h5>
                                    <h3 className="mb-0">{subjects_data.reduce((sum, subject) => sum + subject.total_classes, 0)}</h3>
                                </div>
                                <i className="bi bi-people-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Tổng học sinh</h5>
                                    <h3 className="mb-0">{subjects_data.reduce((sum, subject) => sum + subject.total_students, 0)}</h3>
                                </div>
                                <i className="bi bi-mortarboard-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-dark">
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <h5 className="card-title">Kỳ thi sắp tới</h5>
                                    <h3 className="mb-0">{subjects_data.reduce((sum, subject) => sum + subject.upcoming_exams, 0)}</h3>
                                </div>
                                <i className="bi bi-calendar-check-fill fs-1 opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subjects Grid */}
            <div className="row">
                {subjects_data.map(subject => (
                    <div key={subject.subject_code} className="col-md-6 col-lg-4 mb-4">
                        <div className={`card h-100 ${get_priority_class(subject.upcoming_exams, subject.pending_grades)}`}>
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">{subject.subject_name}</h5>
                                    <span className="badge bg-light text-dark">{subject.subject_code}</span>
                                </div>
                                <small className="text-muted">Khối {subject.grade_level}</small>
                            </div>
                            <div className="card-body">
                                <div className="row text-center mb-3">
                                    <div className="col-4">
                                        <div className="border-end">
                                            <h4 className="text-primary mb-0">{subject.total_classes}</h4>
                                            <small className="text-muted">Lớp</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="border-end">
                                            <h4 className="text-success mb-0">{subject.total_students}</h4>
                                            <small className="text-muted">Học sinh</small>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <h4 className="text-warning mb-0">{subject.upcoming_exams}</h4>
                                        <small className="text-muted">Kỳ thi</small>
                                    </div>
                                </div>

                                {/* Classes */}
                                <h6 className="fw-bold mb-2">
                                    <i className="bi bi-people me-1"></i>
                                    Lớp học
                                </h6>
                                <div className="mb-3">
                                    {subject.classes.slice(0, 2).map(cls => (
                                        <div key={cls.class_id} className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small">{cls.class_code}</span>
                                            <span className="badge bg-light text-dark small">{cls.student_count} HS</span>
                                        </div>
                                    ))}
                                    {subject.classes.length > 2 && (
                                        <small className="text-muted">và {subject.classes.length - 2} lớp khác...</small>
                                    )}
                                </div>

                                {/* Recent Exams */}
                                <h6 className="fw-bold mb-2">
                                    <i className="bi bi-calendar-check me-1"></i>
                                    Kỳ thi gần đây
                                </h6>
                                <div className="mb-3">
                                    {subject.recent_exams.slice(0, 2).map(exam => (
                                        <div key={exam.exam_id} className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small">{exam.title}</span>
                                            {get_status_badge(exam.status)}
                                        </div>
                                    ))}
                                    {subject.recent_exams.length === 0 && (
                                        <small className="text-muted">Chưa có kỳ thi nào</small>
                                    )}
                                </div>

                                {/* Warnings */}
                                {subject.pending_grades > 5 && (
                                    <div className="alert alert-warning py-2 px-3 small mb-2">
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        {subject.pending_grades} bài chưa chấm điểm
                                    </div>
                                )}
                            </div>
                            <div className="card-footer">
                                <div className="btn-group w-100" role="group">
                                    <button 
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => {
                                            set_selected_subject(subject);
                                            set_view_mode('classes');
                                        }}
                                    >
                                        <i className="bi bi-people me-1"></i>
                                        Lớp học
                                    </button>
                                    <button 
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() => {
                                            set_selected_subject(subject);
                                            set_view_mode('exams');
                                        }}
                                    >
                                        <i className="bi bi-calendar-check me-1"></i>
                                        Kỳ thi
                                    </button>
                                    <button className="btn btn-outline-info btn-sm">
                                        <i className="bi bi-bar-chart me-1"></i>
                                        Thống kê
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Modal/Expanded View */}
            {selected_subject && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selected_subject.subject_name} - {view_mode === 'classes' ? 'Lớp học' : 'Kỳ thi'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => set_selected_subject(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {view_mode === 'classes' && (
                                    <div>
                                        <h6 className="mb-3">Danh sách lớp học</h6>
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Mã lớp</th>
                                                        <th>Tên lớp</th>
                                                        <th>Sĩ số</th>
                                                        <th>Phòng học</th>
                                                        <th>Lịch học</th>
                                                        <th>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selected_subject.classes.map(cls => (
                                                        <tr key={cls.class_id}>
                                                            <td>{cls.class_code}</td>
                                                            <td>{cls.class_name}</td>
                                                            <td>
                                                                <span className="badge bg-primary">{cls.student_count}</span>
                                                            </td>
                                                            <td>{cls.room_name}</td>
                                                            <td><small>{cls.schedule}</small></td>
                                                            <td>
                                                                <button className="btn btn-sm btn-outline-primary me-1">
                                                                    <i className="bi bi-people"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-success">
                                                                    <i className="bi bi-plus-circle"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                
                                {view_mode === 'exams' && (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="mb-0">Danh sách kỳ thi</h6>
                                            <button className="btn btn-sm btn-primary">
                                                <i className="bi bi-plus-circle me-1"></i>
                                                Tạo kỳ thi mới
                                            </button>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Tên kỳ thi</th>
                                                        <th>Ngày thi</th>
                                                        <th>Trạng thái</th>
                                                        <th>Học sinh đăng ký</th>
                                                        <th>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selected_subject.recent_exams.map(exam => (
                                                        <tr key={exam.exam_id}>
                                                            <td>{exam.title}</td>
                                                            <td>{new Date(exam.exam_date).toLocaleDateString('vi-VN')}</td>
                                                            <td>{get_status_badge(exam.status)}</td>
                                                            <td>
                                                                <span className="badge bg-info">{exam.registered_students}</span>
                                                            </td>
                                                            <td>
                                                                <button className="btn btn-sm btn-outline-primary me-1">
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-success">
                                                                    <i className="bi bi-eye"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => set_selected_subject(null)}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherSubjectsPage;
