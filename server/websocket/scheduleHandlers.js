const { models } = require("../models");
const { Op } = require('sequelize');
const { requireAdminPermission } = require('./authorizationHandlers');

const SCHEDULE_EVENTS = {
	STATS_UPDATE: "student_assignment_update",
	ERROR: "assignment_error",
	NOTIFICATION: "assignment_notification",
};

const ERROR_TYPES = {
	EXAM_NOT_FOUND: "exam_not_found",
	NOT_ENROLLED: "not_enrolled_in_subject",
	DUPLICATE: "duplicate_registration",
	DATABASE_ERROR: "database_error",
	UNAUTHORIZED: "unauthorized",
};

/**
 * Schedule Management WebSocket Handlers
 *
 * Handles real-time updates for student assignments, proctor assignments,
 * and live statistics for the schedule management system.
 */

class ScheduleHandler {
	constructor(io) {
		this.io = io;
		this.events = SCHEDULE_EVENTS;
		this.errors = ERROR_TYPES;
	}

    /**
     * Validate registration data from client
     * @param {Object} data - Registration data to validate
     * @returns {Object} Validation result with valid flag and errors
     */
    validateRegistrationData(data) {
        const errors = [];
        if (!data.student_id) errors.push("Missing student_id");
        if (!data.exam_id) errors.push("Missing exam_id");
        if (data.student_id && !Number.isInteger(Number(data.student_id))) {
            errors.push("Invalid student_id format");
        }
        if (data.exam_id && !Number.isInteger(Number(data.exam_id))) {
            errors.push("Invalid exam_id format");
        }
        return errors.length ? { valid: false, errors } : { valid: true };
    }

    /**
     * Validate proctor assignment data from client
     * @param {Object} data - Proctor assignment data to validate
     * @returns {Object} Validation result with valid flag and errors
     */
    validateProctorAssignmentData(data) {
        const errors = [];
        if (!data.proctor_id) errors.push("Missing proctor_id");
        if (!data.exam_id) errors.push("Missing exam_id");
        if (data.proctor_id && !Number.isInteger(Number(data.proctor_id))) {
            errors.push("Invalid proctor_id format");
        }
        if (data.exam_id && !Number.isInteger(Number(data.exam_id))) {
            errors.push("Invalid exam_id format");
        }
        return errors.length ? { valid: false, errors } : { valid: true };
    }

    /**
     * Get unregistered students for a specific exam
     * @param {number} exam_id - Exam ID to check registrations for
     * @returns {Promise<Array>} Array of unregistered students
     */
    async getUnregisteredStudents(exam_id) {
        try {
            const unregistered_students = await models.User.findAll({
                where: {
                    user_role: 'student',
                    is_active: true,
                    user_id: {
                        [Op.notIn]: models.sequelize.literal(
                            `(SELECT student_id FROM registrations WHERE exam_id = ${parseInt(exam_id)})`
                        )
                    }
                },
                attributes: ['user_id', 'user_name', 'full_name', 'email'],
                order: [['full_name', 'ASC']]
            });
            
            return unregistered_students;
        } catch (error) {
            console.error('❌ Error fetching unregistered students:', error);
            return [];
        }
    }

    /**
     * Get unassigned proctors for exam scheduling
     * @returns {Promise<Array>} Array of available proctors
     */
    async getUnassignedProctors() {
        try {
            const available_proctors = await models.User.findAll({
                where: {
                    user_role: 'teacher',
                    is_active: true
                },
                attributes: ['user_id', 'user_name', 'full_name', 'email'],
                order: [['full_name', 'ASC']]
            });
            
            return available_proctors;
        } catch (error) {
            console.error('❌ Error fetching available proctors:', error);
            return [];
        }
    }

	/**
	 * Handle request for live statistics
	 * @param {Object} data - Request data from client
	 * @param {Object} socket - Socket instance for authorization
	 */
	async handleLiveStatsRequest(data, socket) {
		try {
			// 🔐 Authorization check - only admins can view live stats
			if (!requireAdminPermission(socket)) {
				return;
			}

			// Prevent rapid consecutive requests (rate limiting)
			const now = Date.now();
			const lastRequest = socket.lastLiveStatsRequest || 0;
			const minInterval = 2000; // 2 seconds minimum between requests
			
			if (now - lastRequest < minInterval) {
				console.log(`⚠️ Rate limiting live stats request from ${socket.user?.user_name}`);
				return;
			}
			
			socket.lastLiveStatsRequest = now;

			console.log(`📊 Admin ${socket.user?.user_name} requested live stats`);
			
			// Get exam_id from request data or use a default exam for demo
			const exam_id = data.exam_id || 1; // You might want to make this required
			
			const stats_data = {
				unregistered_students: await this.getUnregisteredStudents(exam_id),
				unassigned_proctors: await this.getUnassignedProctors(),
				exam_id: exam_id,
				timestamp: new Date().toISOString(),
			};

			// Emit stats back to the requesting client
			socket.emit(SCHEDULE_EVENTS.STATS_UPDATE, stats_data);
			
			console.log(`✅ Sent live stats: ${stats_data.unregistered_students.length} unregistered students, ${stats_data.unassigned_proctors.length} available proctors`);
			
		} catch (error) {
			console.error("❌ Error handling live stats request:", error);
			socket.emit(SCHEDULE_EVENTS.ERROR, {
				success: false,
				message: "Lỗi hệ thống khi tải thống kê",
				error_type: ERROR_TYPES.DATABASE_ERROR
			});
		}
	}

	/**
	 * Handle request for exam statistics (for ManageExamPage)
	 * @param {Object} data - Request data from client
	 * @param {Object} socket - Socket instance for authorization
	 */
	async handleExamStatsRequest(data, socket) {
		try {
			// 🔐 Authorization check - only admins can view exam stats
			if (!requireAdminPermission(socket)) {
				return;
			}

			// Prevent rapid consecutive requests (rate limiting)
			const now = Date.now();
			const lastRequest = socket.lastExamStatsRequest || 0;
			const minInterval = 1000; // 1 second minimum between requests
			
			if (now - lastRequest < minInterval) {
				console.log(`⚠️ Rate limiting exam stats request from ${socket.user?.user_name}`);
				return;
			}
			
			socket.lastExamStatsRequest = now;

			console.log(`📊 Admin ${socket.user?.user_name} requested exam stats`);
			
			// For now, send mock exam stats. In a real implementation, 
			// you would fetch actual exam statistics from the database
			const mock_exam_stats = {
				1: {
					unregistered_student_ids: [101, 102, 103],
					unassigned_proctor_ids: [201, 202]
				},
				2: {
					unregistered_student_ids: [104, 105],
					unassigned_proctor_ids: [203]
				}
			};

			// Send stats for each exam - emit once per exam instead of individual emits
			Object.entries(mock_exam_stats).forEach(([exam_id, stats]) => {
				socket.emit('exam_stats_update', {
					success: true,
					exam_id: parseInt(exam_id),
					unregistered_student_ids: stats.unregistered_student_ids,
					unassigned_proctor_ids: stats.unassigned_proctor_ids,
					timestamp: new Date().toISOString()
				});
			});

			console.log(`✅ Exam stats sent for ${Object.keys(mock_exam_stats).length} exams`);
		
		} catch (error) {
			console.error('❌ Error handling exam stats request:', error);
			socket.emit('exam_stats_error', {
				success: false,
				message: 'Lỗi khi tải thống kê kỳ thi',
				error_type: this.errors.DATABASE_ERROR
			});
		}
	}

	/**
	 * Handle student assignment to exam with database transaction
	 * @param {Object} data - Registration data from client
	 * @param {number} data.student_id - ID of student to assign
	 * @param {number} data.exam_id - ID of exam to assign to
	 * @param {Object} socket - Socket instance for authorization and response
	 */
	async handleStudentRegistration(data, socket) {
		console.log(`👨‍🎓 Processing student assignment:`, data);

		// Start database transaction for data integrity
		const transaction = await models.sequelize.transaction();

		try {
			// 🔐 Authorization check - only admins can assign students
			if (!requireAdminPermission(socket)) {
				await transaction.rollback();
				return;
			}

			// Validate input data
			const validation = this.validateRegistrationData(data);
			if (!validation.valid) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: `Dữ liệu không hợp lệ: ${validation.errors.join(', ')}`,
					error_type: "validation_error"
				});
				return;
			}

			const { student_id, exam_id } = data;

			// Step 1: Get exam details within transaction
			const exam = await models.Exam.findByPk(exam_id, { transaction });
			if (!exam) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: "Kỳ thi không tồn tại",
					error_type: ERROR_TYPES.EXAM_NOT_FOUND,
				});
				return;
			}

			// Step 2: Verify student exists and is active
			const student = await models.User.findOne({
				where: {
					user_id: student_id,
					user_role: 'student',
					is_active: true
				},
				transaction
			});

			if (!student) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: "Học sinh không tồn tại hoặc đã bị vô hiệu hóa",
					error_type: "student_not_found"
				});
				return;
			}

			// Step 3: Check if student is enrolled in the subject
			const enrollment = await models.Enrollment.findOne({
				where: {
					student_id: student_id,
					subject_code: exam.subject_code,
					status: "enrolled",
				},
				transaction
			});

			if (!enrollment) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: `Học sinh ${student.full_name} chưa đăng ký môn học ${exam.subject_code}`,
					error_type: ERROR_TYPES.NOT_ENROLLED,
					student_name: student.full_name,
					subject_code: exam.subject_code,
				});
				return;
			}

			// Step 4: Check for existing registration
			const existing_registration = await models.Registration.findOne({
				where: {
					student_id: student_id,
					exam_id: exam_id,
				},
				transaction
			});

			if (existing_registration) {
				await transaction.rollback();
				console.log(`⚠️ Student ${student.full_name} already registered for exam ${exam.title}`);
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: `Học sinh ${student.full_name} đã được đăng ký cho kỳ thi này`,
					error_type: ERROR_TYPES.DUPLICATE,
					student_name: student.full_name,
					exam_title: exam.title,
				});
				return;
			}

			// Step 5: Create registration within transaction
			const new_registration = await models.Registration.create({
				student_id: student_id,
				exam_id: exam_id,
				registration_status: "approved",
				registered_by: socket.user.user_id,
				registered_at: new Date()
			}, { transaction });

			// Step 6: Commit transaction
			await transaction.commit();

			console.log(`✅ Successfully registered student ${student.full_name} for exam ${exam.title}`);

			// Step 7: Get updated stats and broadcast to all admins
			const updated_stats = {
				unregistered_students: await this.getUnregisteredStudents(exam_id),
				unassigned_proctors: await this.getUnassignedProctors(),
				exam_id: exam_id,
				timestamp: new Date().toISOString(),
			};

			this.io.emit(SCHEDULE_EVENTS.STATS_UPDATE, updated_stats);

			// Step 8: Send success notification to all admins
			this.io.emit(SCHEDULE_EVENTS.NOTIFICATION, {
				type: "student_assigned",
				message: `Học sinh ${student.full_name} đã được phân công thi ${exam.title}`,
				details: {
					student_name: student.full_name,
					student_id: student_id,
					exam_title: exam.title,
					exam_id: exam_id,
					subject_code: exam.subject_code,
					assigned_by: socket.user.full_name,
					registration_id: new_registration.registration_id
				},
				timestamp: new Date().toISOString(),
			});

		} catch (error) {
			// Rollback transaction on any error
			await transaction.rollback();
			console.error("❌ Database error in student assignment:", error);
			
			socket.emit(SCHEDULE_EVENTS.ERROR, {
				success: false,
				message: "Lỗi hệ thống khi phân công học sinh",
				error_type: ERROR_TYPES.DATABASE_ERROR,
				details: process.env.NODE_ENV === 'development' ? error.message : undefined
			});
		}
	}

	/**
	 * Handle proctor assignment to exam with database transaction
	 * @param {Object} data - Assignment data from client
	 * @param {number} data.proctor_id - ID of teacher to assign as proctor
	 * @param {number} data.exam_id - ID of exam to assign to
	 * @param {Object} socket - Socket instance for authorization and response
	 */
	async handleProctorAssignment(data, socket) {
		console.log(`👨‍🏫 Processing proctor assignment:`, data);

		// Start database transaction for data integrity
		const transaction = await models.sequelize.transaction();

		try {
			// 🔐 Authorization check - only admins can assign proctors
			if (!requireAdminPermission(socket)) {
				await transaction.rollback();
				return;
			}

			// Validate input data
			const validation = this.validateProctorAssignmentData(data);
			if (!validation.valid) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: `Dữ liệu không hợp lệ: ${validation.errors.join(', ')}`,
					error_type: "validation_error"
				});
				return;
			}

			const { proctor_id, exam_id } = data;

			// Step 1: Get exam details within transaction
			const exam = await models.Exam.findByPk(exam_id, { transaction });
			if (!exam) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: "Kỳ thi không tồn tại",
					error_type: ERROR_TYPES.EXAM_NOT_FOUND,
				});
				return;
			}

			// Step 2: Verify proctor exists and is a teacher
			const proctor = await models.User.findOne({
				where: {
					user_id: proctor_id,
					user_role: 'teacher',
					is_active: true
				},
				transaction
			});

			if (!proctor) {
				await transaction.rollback();
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: "Giáo viên không tồn tại hoặc đã bị vô hiệu hóa",
					error_type: "teacher_not_found"
				});
				return;
			}

			// Step 3: Check for existing proctor assignment
			const existing_assignment = await models.ExamProctor.findOne({
				where: {
					proctor_id: proctor_id,
					exam_id: exam_id,
				},
				transaction
			});

			if (existing_assignment) {
				await transaction.rollback();
				console.log(`⚠️ Teacher ${proctor.full_name} already assigned as proctor for exam ${exam.title}`);
				socket.emit(SCHEDULE_EVENTS.ERROR, {
					success: false,
					message: `Giáo viên ${proctor.full_name} đã được phân công giám thị cho kỳ thi này`,
					error_type: ERROR_TYPES.DUPLICATE,
					proctor_name: proctor.full_name,
					exam_title: exam.title,
				});
				return;
			}

			// Step 4: Check if proctor has conflicting exams at the same time
			if (exam.exam_date && exam.start_time && exam.end_time) {
				const conflicting_exams = await models.ExamProctor.findAll({
					include: [{
						model: models.Exam,
						where: {
							exam_date: exam.exam_date,
							[utility.sequelize.Op.or]: [
								{
									start_time: {
										[utility.sequelize.Op.lt]: exam.end_time
									},
									end_time: {
										[utility.sequelize.Op.gt]: exam.start_time
									}
								}
							]
						}
					}],
					where: { proctor_id: proctor_id },
					transaction
				});

				if (conflicting_exams.length > 0) {
					await transaction.rollback();
					socket.emit(SCHEDULE_EVENTS.ERROR, {
						success: false,
						message: `Giáo viên ${proctor.full_name} đã có lịch giám thị trùng thời gian`,
						error_type: "schedule_conflict",
						proctor_name: proctor.full_name,
						conflicting_exams: conflicting_exams.map(e => e.Exam.title)
					});
					return;
				}
			}

			// Step 5: Create proctor assignment within transaction
			const new_assignment = await models.ExamProctor.create({
				proctor_id: proctor_id,
				exam_id: exam_id,
				assigned_by: socket.user.user_id,
				assigned_at: new Date()
			}, { transaction });

			// Step 6: Commit transaction
			await transaction.commit();

			console.log(`✅ Successfully assigned proctor ${proctor.full_name} to exam ${exam.title}`);

			// Step 7: Get updated stats and broadcast to all admins
			const updated_stats = {
				unregistered_students: await this.getUnregisteredStudents(exam_id),
				unassigned_proctors: await this.getUnassignedProctors(),
				exam_id: exam_id,
				timestamp: new Date().toISOString(),
			};

			this.io.emit(SCHEDULE_EVENTS.STATS_UPDATE, updated_stats);

			// Step 8: Send success notification to all admins
			this.io.emit(SCHEDULE_EVENTS.NOTIFICATION, {
				type: "proctor_assigned",
				message: `Giáo viên ${proctor.full_name} đã được phân công giám thị ${exam.title}`,
				details: {
					proctor_name: proctor.full_name,
					proctor_id: proctor_id,
					exam_title: exam.title,
					exam_id: exam_id,
					subject_code: exam.subject_code,
					assigned_by: socket.user.full_name,
					assignment_id: new_assignment.exam_proctor_id
				},
				timestamp: new Date().toISOString(),
			});

		} catch (error) {
			// Rollback transaction on any error
			await transaction.rollback();
			console.error("❌ Database error in proctor assignment:", error);
			
			socket.emit(SCHEDULE_EVENTS.ERROR, {
				success: false,
				message: "Lỗi hệ thống khi phân công giám thị",
				error_type: ERROR_TYPES.DATABASE_ERROR,
				details: process.env.NODE_ENV === 'development' ? error.message : undefined
			});
		}
	}
}

/**
 * Register schedule-related WebSocket event handlers
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io_stream - Socket.io server instance for broadcasting
 */
function register_schedule_handlers(socket, io_stream) {
	console.log(`📅 Registering schedule handlers for socket ${socket.id}`);
	const handler = new ScheduleHandler(io_stream);

	// Event handlers for schedule operations
	/**
	 * 🧠 CRITICAL: Why we need .bind(handler)
	 *
	 * When Socket.io calls our handler (like handleStudentRegistration), JavaScript *loses*
	 * the connection to our ScheduleHandler instance ('this' becomes undefined).
	 *
	 * .bind(handler) FIXES THIS by permanently locking 'this' to our handler instance,
	 * so 'this.io' works correctly inside the method.
	 *
	 * 🔥 Without .bind():
	 *   - this.io → undefined (CRASH!)
	 *
	 * ✅ With .bind(handler):
	 *   - this.io → Our ScheduleHandler's io instance (WORKS!)
	 */
	socket.on(
		"request_live_stats",
		(data) => handler.handleLiveStatsRequest(data, socket)
	);
	socket.on(
		"request_exam_stats",
		(data) => handler.handleExamStatsRequest(data, socket)
	);
	socket.on(
		"assign_student_to_exam",
		(data) => handler.handleStudentRegistration(data, socket)
	);
	socket.on(
		"assign_proctor_to_exam",
		(data) => handler.handleProctorAssignment(data, socket)
	);
}

module.exports = {
	register_schedule_handlers,
};
