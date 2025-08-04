import React, { useState, useEffect } from "react";
import AccessDeniedPage from "../common/AccessDeniedPage";
import Breadcrumb from "../../components/Breadcrumb";
// TODO: import { getClassStudents, addStudentToClass, removeStudentFromClass } from "../../services/apiService";

function ManageClassPage({ current_user_role, current_user_id }) {
    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================
    const [my_classes, set_my_classes] = useState([]);
    const [selected_class, set_selected_class] = useState(null);
    const [class_students, set_class_students] = useState([]);
    const [available_students, set_available_students] = useState([]);
    const [loading, set_loading] = useState(true);
    const [students_loading, set_students_loading] = useState(false);
    
    // Modal states
    const [show_add_student_modal, set_show_add_student_modal] = useState(false);
    const [search_term, set_search_term] = useState('');
    const [selected_students_to_add, set_selected_students_to_add] = useState([]);

    // ====================================================================
    // MOCK DATA FOR UI DESIGN
    // ====================================================================
    useEffect(() => {
        console.log('👨‍🏫 Loading teacher classes...');
        
        setTimeout(() => {
            const mock_classes = [
                {
                    class_id: 1,
                    class_code: '12A1',
                    class_name: 'Lớp 12A1 - Khối Tự Nhiên',
                    grade_level: 12,
                    academic_year: '2024-2025',
                    student_count: 32,
                    max_students: 35,
                    homeroom_teacher: {
                        user_id: current_user_id,
                        full_name: 'Nguyễn Văn Giảng'
                    },
                    role: 'homeroom_teacher'
                },
                {
                    class_id: 2,
                    class_code: '11B2',
                    class_name: 'Lớp 11B2 - Khối Xã Hội',
                    grade_level: 11,
                    academic_year: '2024-2025',
                    student_count: 28,
                    max_students: 35,
                    homeroom_teacher: {
                        user_id: 999,
                        full_name: 'Trần Thị Mai'
                    },
                    role: 'subject_teacher'
                }
            ];

            set_my_classes(mock_classes);
            
            // Set first class as selected by default
            if (mock_classes.length > 0) {
                set_selected_class(mock_classes[0]);
                load_class_students(mock_classes[0].class_id);
            }
            
            set_loading(false);
        }, 1000);
    }, [current_user_id]);

    // ====================================================================
    // API FUNCTIONS
    // ====================================================================
    const load_class_students = async (class_id) => {
        set_students_loading(true);
        
        // TODO: Replace with actual API call
        setTimeout(() => {
            const mock_students = [
                {
                    user_id: 101,
                    user_name: 'student001',
                    full_name: 'Nguyễn Văn An',
                    email: 'nguyenvanan@school.edu.vn',
                    subject_enrollments: [
                        { subject_code: 'MATH12', status: 'enrolled' },
                        { subject_code: 'PHYS12', status: 'enrolled' },
                        { subject_code: 'CHEM12', status: 'enrolled' }
                    ]
                },
                {
                    user_id: 102,
                    user_name: 'student002',
                    full_name: 'Trần Thị Bình',
                    email: 'tranthibinh@school.edu.vn',
                    subject_enrollments: [
                        { subject_code: 'MATH12', status: 'enrolled' },
                        { subject_code: 'PHYS12', status: 'enrolled' }
                    ]
                },
                {
                    user_id: 103,
                    user_name: 'student003',
                    full_name: 'Lê Văn Cường',
                    email: 'levancuong@school.edu.vn',
                    subject_enrollments: [
                        { subject_code: 'MATH12', status: 'enrolled' },
                        { subject_code: 'CHEM12', status: 'enrolled' }
                    ]
                }
            ];

            set_class_students(mock_students);
            set_students_loading(false);
        }, 500);
    };

    const load_available_students = async () => {
        // TODO: Replace with actual API call
        const mock_available = [
            {
                user_id: 201,
                user_name: 'student201',
                full_name: 'Phạm Thị Dung',
                email: 'phamthidung@school.edu.vn',
                current_class: null
            },
            {
                user_id: 202,
                user_name: 'student202',
                full_name: 'Hoàng Văn Em',
                email: 'hoangvanem@school.edu.vn',
                current_class: 'Lớp 10A1'
            }
        ];

        set_available_students(mock_available);
    };

    const handle_add_students_to_class = async () => {
        try {
            // TODO: Implement actual API call
            console.log(`Adding students ${selected_students_to_add} to class ${selected_class.class_id}`);
            
            // Mock success
            alert(`Đã thêm ${selected_students_to_add.length} học sinh vào lớp!`);
            
            // Refresh data
            load_class_students(selected_class.class_id);
            set_show_add_student_modal(false);
            set_selected_students_to_add([]);
            
        } catch (error) {
            console.error('Error adding students:', error);
            alert('Lỗi khi thêm học sinh vào lớp');
        }
    };

    const handle_remove_student = async (student_id, student_name) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa học sinh "${student_name}" khỏi lớp?`)) {
            return;
        }

        try {
            // TODO: Implement actual API call
            console.log(`Removing student ${student_id} from class ${selected_class.class_id}`);
            
            // Mock success
            alert(`Đã xóa học sinh "${student_name}" khỏi lớp!`);
            
            // Refresh data
            load_class_students(selected_class.class_id);
            
        } catch (error) {
            console.error('Error removing student:', error);
            alert('Lỗi khi xóa học sinh khỏi lớp');
        }
    };

    // ====================================================================
    // EVENT HANDLERS
    // ====================================================================
    const handle_class_select = (class_obj) => {
        set_selected_class(class_obj);
        load_class_students(class_obj.class_id);
    };

    const handle_open_add_student_modal = () => {
        load_available_students();
        set_show_add_student_modal(true);
    };

    const handle_student_selection = (student_id, is_selected) => {
        if (is_selected) {
            set_selected_students_to_add(prev => [...prev, student_id]);
        } else {
            set_selected_students_to_add(prev => prev.filter(id => id !== student_id));
        }
    };

    // ====================================================================
    // HELPER FUNCTIONS
    // ====================================================================
    const get_role_badge = (role) => {
        switch (role) {
            case 'homeroom_teacher':
                return <span className="badge bg-primary">Chủ nhiệm</span>;
            case 'subject_teacher':
                return <span className="badge bg-success">Giáo viên môn</span>;
            default:
                return <span className="badge bg-secondary">Không xác định</span>;
        }
    };

    const get_subject_badges = (enrollments) => {
        return enrollments.map(enrollment => (
            <span key={enrollment.subject_code} className="badge bg-light text-dark me-1">
                {enrollment.subject_code}
            </span>
        ));
    };

    const filtered_available_students = available_students.filter(student => 
        student.full_name.toLowerCase().includes(search_term.toLowerCase()) ||
        student.user_name.toLowerCase().includes(search_term.toLowerCase()) ||
        student.email.toLowerCase().includes(search_term.toLowerCase())
    );

    // ====================================================================
    // ACCESS CONTROL
    // ====================================================================
    if (current_user_role !== 'teacher') {
        return <AccessDeniedPage />;
    }

    // ====================================================================
    // RENDER COMPONENT
    // ====================================================================
    const breadcrumb_items = [
        { label: "Trang chủ", link: "/" },
        { label: "Quản lý Lớp học", icon: "bi-door-open-fill" }
    ];

    return (
        <div className="container-fluid">
            <Breadcrumb items={breadcrumb_items} />
            
            <div className="row">
                {/* Class Selection Sidebar */}
                <div className="col-md-4 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="bi bi-list-ul me-2"></i>
                                Lớp học của tôi
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Đang tải...</span>
                                    </div>
                                </div>
                            ) : my_classes.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Không có lớp học nào
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {my_classes.map(cls => (
                                        <button
                                            key={cls.class_id}
                                            className={`list-group-item list-group-item-action ${
                                                selected_class?.class_id === cls.class_id ? 'active' : ''
                                            }`}
                                            onClick={() => handle_class_select(cls)}
                                        >
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="text-start">
                                                    <h6 className="mb-1">
                                                        <span className="badge bg-secondary me-2">{cls.class_code}</span>
                                                        {cls.class_name}
                                                    </h6>
                                                    <p className="mb-1 small">
                                                        <i className="bi bi-people me-1"></i>
                                                        {cls.student_count}/{cls.max_students} học sinh
                                                    </p>
                                                    <small className="text-muted">
                                                        Năm học: {cls.academic_year}
                                                    </small>
                                                </div>
                                                <div>
                                                    {get_role_badge(cls.role)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Class Details and Student Management */}
                <div className="col-md-8 mb-4">
                    {selected_class ? (
                        <div className="card h-100">
                            <div className="card-header">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-0">
                                            <i className="bi bi-door-open me-2"></i>
                                            {selected_class.class_name}
                                        </h5>
                                        <small className="text-muted">
                                            Quản lý học sinh và thông tin lớp học
                                        </small>
                                    </div>
                                    {selected_class.role === 'homeroom_teacher' && (
                                        <button 
                                            className="btn btn-success"
                                            onClick={handle_open_add_student_modal}
                                        >
                                            <i className="bi bi-person-plus me-2"></i>
                                            Thêm học sinh
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="card-body">
                                {/* Class Information */}
                                <div className="row mb-4">
                                    <div className="col-md-3">
                                        <div className="card border-primary">
                                            <div className="card-body text-center">
                                                <i className="bi bi-hash display-4 text-primary"></i>
                                                <h5 className="mt-2">{selected_class.class_code}</h5>
                                                <p className="text-muted">Mã lớp</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-success">
                                            <div className="card-body text-center">
                                                <i className="bi bi-people display-4 text-success"></i>
                                                <h5 className="mt-2">{selected_class.student_count}</h5>
                                                <p className="text-muted">Học sinh</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-warning">
                                            <div className="card-body text-center">
                                                <i className="bi bi-trophy display-4 text-warning"></i>
                                                <h5 className="mt-2">{selected_class.grade_level}</h5>
                                                <p className="text-muted">Khối</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-info">
                                            <div className="card-body text-center">
                                                <i className="bi bi-bookmark display-4 text-info"></i>
                                                <h5 className="mt-2">{selected_class.max_students - selected_class.student_count}</h5>
                                                <p className="text-muted">Chỗ trống</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Student List */}
                                <h6 className="mb-3">
                                    <i className="bi bi-people me-2"></i>
                                    Danh sách học sinh ({class_students.length})
                                </h6>
                                
                                {students_loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                    </div>
                                ) : class_students.length === 0 ? (
                                    <div className="text-center py-4 text-muted">
                                        <i className="bi bi-person-x fs-1 d-block mb-2"></i>
                                        Lớp chưa có học sinh nào
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>STT</th>
                                                    <th>Tên đăng nhập</th>
                                                    <th>Họ và tên</th>
                                                    <th>Email</th>
                                                    <th>Môn học đăng ký</th>
                                                    {selected_class.role === 'homeroom_teacher' && (
                                                        <th className="text-center">Hành động</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {class_students.map((student, index) => (
                                                    <tr key={student.user_id}>
                                                        <td>
                                                            <span className="fw-bold text-primary">#{index + 1}</span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-person-circle me-2 text-muted"></i>
                                                                <span className="fw-semibold">{student.user_name}</span>
                                                            </div>
                                                        </td>
                                                        <td>{student.full_name}</td>
                                                        <td>
                                                            <a href={`mailto:${student.email}`} className="text-decoration-none">
                                                                {student.email}
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                {get_subject_badges(student.subject_enrollments || [])}
                                                            </div>
                                                        </td>
                                                        {selected_class.role === 'homeroom_teacher' && (
                                                            <td className="text-center">
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm"
                                                                    onClick={() => handle_remove_student(student.user_id, student.full_name)}
                                                                    title="Xóa khỏi lớp"
                                                                >
                                                                    <i className="bi bi-person-dash"></i>
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card h-100">
                            <div className="card-body d-flex align-items-center justify-content-center">
                                <div className="text-center text-muted">
                                    <i className="bi bi-arrow-left fs-1 d-block mb-2"></i>
                                    <h5>Chọn một lớp học để xem chi tiết</h5>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Student Modal */}
            {show_add_student_modal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-person-plus me-2"></i>
                                    Thêm học sinh vào lớp {selected_class?.class_code}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => set_show_add_student_modal(false)}
                                ></button>
                            </div>
                            
                            <div className="modal-body">
                                {/* Search Box */}
                                <div className="mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Tìm kiếm học sinh..."
                                            value={search_term}
                                            onChange={(e) => set_search_term(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Available Students */}
                                <div className="row">
                                    {filtered_available_students.length === 0 ? (
                                        <div className="col-12">
                                            <div className="text-center py-4 text-muted">
                                                <i className="bi bi-person-x fs-1 d-block mb-2"></i>
                                                Không tìm thấy học sinh nào
                                            </div>
                                        </div>
                                    ) : (
                                        filtered_available_students.map(student => (
                                            <div key={student.user_id} className="col-md-6 mb-2">
                                                <div className={`card ${selected_students_to_add.includes(student.user_id) ? 'border-success' : ''}`}>
                                                    <div className="card-body">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={selected_students_to_add.includes(student.user_id)}
                                                                onChange={(e) => handle_student_selection(student.user_id, e.target.checked)}
                                                            />
                                                            <label className="form-check-label">
                                                                <h6 className="mb-1">{student.full_name}</h6>
                                                                <small className="text-muted d-block">{student.user_name}</small>
                                                                <small className="text-muted d-block">{student.email}</small>
                                                                {student.current_class && (
                                                                    <span className="badge bg-warning text-dark mt-1">
                                                                        Hiện tại: {student.current_class}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => set_show_add_student_modal(false)}
                                >
                                    <i className="bi bi-x-circle me-2"></i>
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handle_add_students_to_class}
                                    disabled={selected_students_to_add.length === 0}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Thêm ({selected_students_to_add.length}) học sinh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageClassPage;
