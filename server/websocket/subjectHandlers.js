function register_subject_handlers(socket, io_stream) {
    console.log(`📚 Registering subject handlers for socket ${socket.id}`);

    // Event handlers for CRUD operations
    socket.on('subject_created', handle_subject_created);
    socket.on('subject_updated', handle_subject_updated);  
    socket.on('subject_deleted', handle_subject_deleted);
}

async function handle_subject_created(data) {
    try{
        const { subject_data, admin_info } = data;

        console.log(`📚 Subject created by admin ${admin_info?.user_id}`);

        io_stream.emit('subject_table_update', {
            action: 'create',
            subject: subject_data,
            timestamp: new Date(),
            changed_by: admin_info
        });
    } catch (error) {
        console.error('❌ Error handling subject creation:', error);
    }
}

async function handle_subject_updated(data) {
    try{
        const { subject_data, admin_info } = data;

        console.log(`📚 Subject updated by admin ${admin_info?.user_id}`);

        io_stream.emit('subject_table_update', {
            action: 'update',
            subject: subject_data,
            timestamp: new Date(),
            changed_by: admin_info
        });
    } catch (error) {
        console.error('❌ Error handling subject update:', error);
    }
}

async function handle_subject_deleted(data) {
    try{
        const { subject_data, admin_info } = data;

        console.log(`📚 Subject deleted by admin ${admin_info?.user_id}`);

        io_stream.emit('subject_table_update', {
            action: 'delete',
            subject: subject_data,
            timestamp: new Date(),
            changed_by: admin_info
        });
    } catch (error) {
        console.error('❌ Error handling subject deletion:', error);
    }
}

module.exports = {
    register_subject_handlers
}