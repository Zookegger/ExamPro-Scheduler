/**
 * Notification WebSocket Handlers - Real-time notification delivery system
 *
 * Features:
 * - User-specific notification rooms
 * - Connection state tracking
 * - Notification acknowledgment
 * - Unread count tracking
 * - System broadcasts
 *
 * Architecture:
 * - Each user gets a dedicated room (notifications_<user_id>)
 * - Socket.io rooms enable efficient targeted messaging
 * - Automatic cleanup on disconnect
 */
const { models, utility } = require("../models");
const { sequelize } = utility;
const { Notification } = models;

// Constants for error messages and events
const NOTIFICATION_EVENTS = {
	JOINED: "notification_room_joined",
	ERROR: "notification_error",
	NEW: "new_notification",
	ACKNOWLEDGED: "notification_acknowledged",
	UNREAD_UPDATE: "unread_count_update",
	SYSTEM: "system_announcement",
};

const ERROR_MESSAGES = {
	AUTH: "Chưa xác thực người dùng",
	NOT_FOUND: "Không tìm thấy thông báo",
	DEFAULT: "Lỗi xử lý thông báo",
};

class NotificationHandler {
	constructor(io) {
		this.io = io;
		this.setupConnectionHandlers();
	}

	setupConnectionHandlers() {
		this.io.on("connection", (socket) => {
			console.log(`🔌 Client connected: ${socket.id}`);

			this.setupJoinRoomHandler(socket);
			this.setupAckHandler(socket);
			this.setupUnreadCountHandler(socket);
			this.setupDisconnectHandler(socket);
		});
	}

	setupJoinRoomHandler(socket) {
		socket.on("join_notification_room", (user_id) => {
			try {
				const room = `notifications_${user_id}`;
				socket.join(room);
				socket.user_id = user_id;

				console.log(`📡 User ${user_id} joined room: ${room}`);

				socket.emit(NOTIFICATION_EVENTS.JOINED, {
					success: true,
					room,
					message: "Đã kết nối thông báo thời gian thực",
				});
			} catch (error) {
				this.handleError(socket, error, "joining notification room");
			}
		});
	}

	setupAckHandler(socket) {
		socket.on("acknowledge_notification", async (notification_id) => {
			const transaction = await sequelize.transaction();
			
			try {
				if (!this.validateUser(socket)) {
					await transaction.rollback();
					return;
				}

				const updated = await Notification.update(
					{ is_read: true },
					{
						where: {
							notification_id,
							user_id: socket.user_id,
						},
						transaction
					}
				);

				if (updated[0] > 0) {
					await transaction.commit();
					console.log(
						`✅ Notification ${notification_id} acknowledged with transaction`
					);
					socket.emit(NOTIFICATION_EVENTS.ACKNOWLEDGED, {
						success: true,
						notification_id,
					});
					this.updateUnreadCount(socket, socket.user_id);
				} else {
					await transaction.rollback();
					this.sendError(socket, ERROR_MESSAGES.NOT_FOUND);
				}
			} catch (error) {
				await transaction.rollback();
				this.handleError(socket, error, "acknowledging notification");
			}
		});
	}

	setupUnreadCountHandler(socket) {
		socket.on("get_unread_count", async () => {
			try {
				if (!this.validateUser(socket)) return;

				const count = await Notification.count({
					where: {
						user_id: socket.user_id,
						is_read: false,
					},
				});

				socket.emit(NOTIFICATION_EVENTS.UNREAD_UPDATE, {
					success: true,
					unread_count: count,
				});
			} catch (error) {
				this.handleError(socket, error, "getting unread count");
			}
		});
	}

	setupDisconnectHandler(socket) {
		socket.on("disconnect", () => {
			console.log(
				socket.user_id
					? `🔌 User ${socket.user_id} disconnected`
					: `🔌 Anonymous client disconnected: ${socket.id}`
			);
		});
	}

	// Helper methods
	validateUser(socket) {
		if (!socket.user_id) {
			this.sendError(socket, ERROR_MESSAGES.AUTH);
			return false;
		}
		return true;
	}

	handleError(socket, error, context) {
		console.error(`❌ Error ${context}:`, error);
		this.sendError(socket, ERROR_MESSAGES.DEFAULT);
	}

	sendError(socket, message) {
		socket.emit(NOTIFICATION_EVENTS.ERROR, {
			success: false,
			message,
		});
	}

	// Public API
	async emitToUser(user_id, notification) {
		try {
			this.io
				.to(`notifications_${user_id}`)
				.emit(NOTIFICATION_EVENTS.NEW, {
					success: true,
					notification,
					timestamp: new Date().toISOString(),
				});
			console.log(`📨 Sent notification to user ${user_id}`);
			await this.updateUnreadCount(null, user_id);
		} catch (error) {
			console.error(`❌ Error notifying user ${user_id}:`, error);
		}
	}

	async emitToUsers(user_ids, notification) {
		await Promise.all(
			user_ids.map((id) => this.emitToUser(id, notification))
		);
		console.log(`📨 Sent to ${user_ids.length} users`);
	}

	async updateUnreadCount(socket, user_id) {
		try {
			const count = await Notification.count({
				where: {
					user_id,
					is_read: false,
				},
			});

			const target = socket || this.io;
			target
				.to(`notifications_${user_id}`)
				.emit(NOTIFICATION_EVENTS.UNREAD_UPDATE, {
					success: true,
					unread_count: count,
				});
		} catch (error) {
			console.error(`❌ Error updating unread count:`, error);
		}
	}

	broadcastAnnouncement(announcement) {
		this.io.emit(NOTIFICATION_EVENTS.SYSTEM, {
			success: true,
			announcement,
			timestamp: new Date().toISOString(),
		});
		console.log(`📢 Broadcasted: ${announcement.title}`);
	}
}

// Singleton export pattern
let notificationHandler;

function setupNotificationHandlers(io) {
	if (!notificationHandler) {
		notificationHandler = new NotificationHandler(io);
	}
	return notificationHandler;
}

module.exports = {
	setupNotificationHandlers,
	getNotificationHandler: () => notificationHandler,
};
