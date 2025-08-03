const subject_handler = require('./subjectHandlers');
const notification_handler = require('./notificationHandlers');
const scheduler_handler = require('./scheduleHandlers');

function setup_websocket_handlers(socket, io_stream) {
    console.log(`🔌 Setting up WebSocket handlers for socket ${socket.id}`);

    // Register each type of handler
    subject_handler.register_subject_handlers(socket, io_stream);
    scheduler_handler.register_schedule_handlers(socket);
    notification_handler.setup_notification_handlers(io_stream);
}