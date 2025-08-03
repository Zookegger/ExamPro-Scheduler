const express = require("express");
const router = express.Router();
const { authenticate_jwt } = require("../middleware/auth");
const {
	getAllSubjects,
	addNewSubject,
	updateSubject,
	deleteSubject,
} = require("../controllers/subjectController");

router.get("/", authenticate_jwt, getAllSubjects);

router.post("/", authenticate_jwt, addNewSubject);

router.put("/:subject_id", authenticate_jwt, updateSubject);

router.delete("/:subject_id", authenticate_jwt, deleteSubject);

/**
 * Error Handler Middleware for Subject Routes
 *
 * Catches any errors passed via next(error) from route handlers
 * and provides consistent error response format.
 *
 * @param {Error} error - The error object passed from previous middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
router.use((error, req, res, next) => {
	console.error("❌ Subject route error:", error);

	// If response already sent, delegate to Express default error handler
	if (res.headersSent) {
		return next(error);
	}

	// Database connection errors
	if (error.name === "SequelizeConnectionError") {
		return res.status(503).json({
			success: false,
			message: "Lỗi kết nối cơ sở dữ liệu",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Database unavailable",
		});
	}

	// Validation errors
	if (error.name === "SequelizeValidationError") {
		return res.status(400).json({
			success: false,
			message: "Dữ liệu không hợp lệ",
			error:
				process.env.NODE_ENV === "development"
					? error.message
					: "Validation failed",
		});
	}

	// Default error response
	res.status(500).json({
		success: false,
		message: "Lỗi hệ thống",
		error:
			process.env.NODE_ENV === "development"
				? error.message
				: "Internal server error",
	});
});

module.exports = router;
