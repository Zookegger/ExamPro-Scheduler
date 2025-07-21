const { Exam, Registration, Room, User, Subject, ExamProctor } = require('../models/index');
const { Op } = require('sequelize');

/**  
 * Exam Controller
 *
 * Manages all operations related to exams including:
 * - Creating, reading, updating and deleting exams
 * - Managing exam status transitions
 * - Retrieving exams with filters
 */