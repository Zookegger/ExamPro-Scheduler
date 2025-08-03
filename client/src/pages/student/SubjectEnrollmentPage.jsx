import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";

function SubjectEnrollmentPage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    // Available subjects data
    const [available_subjects, set_available_subjects] = useState([]);
    const [my_enrollments, set_my_enrollments] = useState([]);
    
    // UI states
    const [loading, set_loading] = useState(true);
    const [search_term, set_search_term] = useState('');
    const [filter_department, set_filter_department] = useState('all');
    const [filter_credit, set_filter_credit] = useState('all');
    const [success_message, set_success_message] = useState('');
    const [error_message, set_error_message] = useState('');

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        // TODO: Replace with actual API calls
        // const fetch_available_subjects = async () => { ... }
        // const fetch_my_enrollments = async () => { ... }
        
        console.log('📚 Loading subject enrollment data...');
        
        setTimeout(() => {
            // Mock available subjects
            const mock_available_subjects = [
                {
                    subject_code: 'MATH101',
                    subject_name: 'Toán học cơ bản',
                    department: 'Toán học',
                    credit: 3,
                    description: 'Môn học cung cấp kiến thức toán học cơ bản',
                    max_students: 50,
                    enrolled_count: 35,
                    is_available: true,
                    semester: '2025-1'
                },
                {
                    subject_code: 'PHYS101',
                    subject_name: 'Vật lý đại cương',
                    department: 'Vật lý',
                    credit: 4,
                    description: 'Cơ sở vật lý cho sinh viên kỹ thuật',
                    max_students: 40,
                    enrolled_count: 40,
                    is_available: false, // Full
                    semester: '2025-1'
                },
                {
                    subject_code: 'CS101',
                    subject_name: 'Lập trình cơ bản',
                    department: 'Tin học',
                    credit: 3,
                    description: 'Nhập môn lập trình với Python',
                    max_students: 60,
                    enrolled_count: 25,
                    is_available: true,
                    semester: '2025-1'
                }
            ];

            // Mock current enrollments  
            const mock_enrollments = [
                {
                    enrollment_id: 1,
                    subject_code: 'MATH101',
                    subject_name: 'Toán học cơ bản',
                    department: 'Toán học',
                    credit: 3,
                    enrollment_date: '2025-08-01',
                    status: 'enrolled',
                    upcoming_exams: [
                        { exam_id: 1, title: 'Kiểm tra giữa kỳ', exam_date: '2025-08-15', status: 'published' },
                        { exam_id: 2, title: 'Thi cuối kỳ', exam_date: '2025-09-20', status: 'draft' }
                    ]
                }
            ];

            set_available_subjects(mock_available_subjects);
            set_my_enrollments(mock_enrollments);
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const handle_enroll_subject = async (subject_code) => {
        // TODO: Implement enrollment API call
        console.log(`🎓 Enrolling in subject: ${subject_code}`);
        
        try {
            // TODO: const result = await enroll_in_subject(current_user_id, subject_code);
            set_success_message(`Đã đăng ký môn học ${subject_code} thành công!`);
            
            // TODO: Refresh data
            // await fetch_available_subjects();
            // await fetch_my_enrollments();
            
        } catch (error) {
            console.error('Enrollment error:', error);
            set_error_message('Lỗi khi đăng ký môn học');
        }
    };

    const handle_drop_subject = async (subject_code) => {
        // TODO: Implement drop API call
        console.log(`❌ Dropping subject: ${subject_code}`);
        
        try {
            // TODO: const result = await drop_subject(current_user_id, subject_code);
            set_success_message(`Đã hủy đăng ký môn học ${subject_code}`);
            
            // TODO: Refresh data
            
        } catch (error) {
            console.error('Drop error:', error);
            set_error_message('Lỗi khi hủy đăng ký môn học');
        }
    };

    const get_enrollment_status = (subject_code) => {
        return my_enrollments.find(enrollment => enrollment.subject_code === subject_code);
    };

    const get_availability_badge = (subject) => {
        const remaining_slots = subject.max_students - subject.enrolled_count;
        
        if (!subject.is_available) {
            return <span className="badge bg-danger">Đã đầy</span>;
        } else if (remaining_slots <= 5) {
            return <span className="badge bg-warning text-dark">Còn {remaining_slots} chỗ</span>;
        } else {
            return <span className="badge bg-success">Còn trống</span>;
        }
    };

    // ====================================================================
    // FILTERING LOGIC
    // ====================================================================
    const filtered_subjects = available_subjects.filter(subject => {
        const matches_search = subject.subject_name.toLowerCase().includes(search_term.toLowerCase()) ||
                              subject.subject_code.toLowerCase().includes(search_term.toLowerCase());
        const matches_department = filter_department === 'all' || subject.department === filter_department;
        const matches_credit = filter_credit === 'all' || subject.credit.toString() === filter_credit;
        
        return matches_search && matches_department && matches_credit;
    });

    const get_unique_departments = () => {
        return [...new Set(available_subjects.map(subject => subject.department))];
    };

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'student') {
        return <AccessDeniedPage />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Đăng ký môn học", icon: "bi-book-fill" }
    ];

    return (
        <div className="container-fluid">
            <Breadcrumb items={breadcrumb_items} />
            
            {/* Success/Error Messages */}
            {success_message && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {success_message}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => set_success_message('')}
                    ></button>
                </div>
            )}

            {error_message && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error_message}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => set_error_message('')}
                    ></button>
                </div>
            )}

            <div className="row">
                {/* My Enrollments */}
                <div className="col-12 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-person-check me-2"></i>
                                Môn học đã đăng ký ({my_enrollments.length})
                            </h5>
                        </div>
                        <div className="card-body">
                            {my_enrollments.length === 0 ? (
                                <p className="text-muted mb-0">Bạn chưa đăng ký môn học nào</p>
                            ) : (
                                <div className="row">
                                    {my_enrollments.map(enrollment => (
                                        <div key={enrollment.enrollment_id} className="col-md-6 mb-3">
                                            <div className="card border-success">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <h6 className="card-title mb-1">
                                                                <span className="badge bg-info me-2">{enrollment.subject_code}</span>
                                                                {enrollment.subject_name}
                                                            </h6>
                                                            <p className="text-muted small mb-1">
                                                                {enrollment.department} • {enrollment.credit} tín chỉ
                                                            </p>
                                                        </div>
                                                        <button 
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handle_drop_subject(enrollment.subject_code)}
                                                            title="Hủy đăng ký"
                                                        >
                                                            <i className="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                    
                                                    {enrollment.upcoming_exams.length > 0 && (
                                                        <div className="mt-2">
                                                            <small className="text-muted">Kỳ thi sắp tới:</small>
                                                            <ul className="list-unstyled mt-1">
                                                                {enrollment.upcoming_exams.map(exam => (
                                                                    <li key={exam.exam_id} className="small">
                                                                        <i className="bi bi-calendar-event me-1"></i>
                                                                        {exam.title} - {new Date(exam.exam_date).toLocaleDateString('vi-VN')}
                                                                        <span className={`badge ms-2 ${exam.status === 'published' ? 'bg-primary' : 'bg-secondary'}`}>
                                                                            {exam.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Available Subjects */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <i className="bi bi-book me-2"></i>
                                Môn học có thể đăng ký
                            </h5>
                            <span className="text-muted">{filtered_subjects.length} môn học</span>
                        </div>
                        
                        <div className="card-body">
                            {/* Search and Filter Controls */}
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm môn học..."
                                            value={search_term}
                                            onChange={(e) => set_search_term(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filter_department}
                                        onChange={(e) => set_filter_department(e.target.value)}
                                    >
                                        <option value="all">Tất cả khoa</option>
                                        {get_unique_departments().map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select 
                                        className="form-select"
                                        value={filter_credit}
                                        onChange={(e) => set_filter_credit(e.target.value)}
                                    >
                                        <option value="all">Tất cả tín chỉ</option>
                                        <option value="1">1 tín chỉ</option>
                                        <option value="2">2 tín chỉ</option>
                                        <option value="3">3 tín chỉ</option>
                                        <option value="4">4 tín chỉ</option>
                                        <option value="5">5 tín chỉ</option>
                                    </select>
                                </div>
                            </div>

                            {/* Loading State */}
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Đang tải danh sách môn học...</p>
                                </div>
                            ) : (
                                /* Subject Cards */
                                <div className="row">
                                    {filtered_subjects.length === 0 ? (
                                        <div className="col-12">
                                            <div className="text-center py-4 text-muted">
                                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                Không có môn học nào phù hợp
                                            </div>
                                        </div>
                                    ) : (
                                        filtered_subjects.map(subject => {
                                            const enrollment = get_enrollment_status(subject.subject_code);
                                            const is_enrolled = !!enrollment;
                                            
                                            return (
                                                <div key={subject.subject_code} className="col-md-6 col-lg-4 mb-3">
                                                    <div className={`card h-100 ${is_enrolled ? 'border-success' : ''}`}>
                                                        <div className="card-body d-flex flex-column">
                                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                                <div>
                                                                    <h6 className="card-title mb-1">
                                                                        <span className="badge bg-primary me-2">{subject.subject_code}</span>
                                                                    </h6>
                                                                    <h5 className="card-title">{subject.subject_name}</h5>
                                                                </div>
                                                                {get_availability_badge(subject)}
                                                            </div>
                                                            
                                                            <p className="text-muted small mb-2">
                                                                <i className="bi bi-building me-1"></i>
                                                                {subject.department} • {subject.credit} tín chỉ
                                                            </p>
                                                            
                                                            <p className="card-text small mb-3 flex-grow-1">
                                                                {subject.description}
                                                            </p>
                                                            
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small className="text-muted">
                                                                    {subject.enrolled_count}/{subject.max_students} học sinh
                                                                </small>
                                                                
                                                                {is_enrolled ? (
                                                                    <span className="badge bg-success">
                                                                        <i className="bi bi-check-circle me-1"></i>
                                                                        Đã đăng ký
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        onClick={() => handle_enroll_subject(subject.subject_code)}
                                                                        disabled={!subject.is_available}
                                                                    >
                                                                        <i className="bi bi-plus-circle me-1"></i>
                                                                        Đăng ký
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubjectEnrollmentPage;
