const subject_handler = require('./subjectHandlers');
const notification_handler = require('./notificationHandlers');
const scheduler_handler = require('./scheduleHandlers');
const room_handler = require('./roomHandlers');

function setup_websocket_handlers(socket, io_stream) {
    console.log(`🔌 Setting up WebSocket handlers for socket ${socket.id}`);

    // Register each type of handler
    subject_handler.register_subject_handlers(socket, io_stream);
    scheduler_handler.register_schedule_handlers(socket, io_stream);
    room_handler.register_room_handlers(socket, io_stream);
    
    // NOTE: Notification handler is initialized once globally, not per-socket
    // notification_handler.setupNotificationHandlers(io_stream);
}

module.exports = {
    setup_websocket_handlers
};