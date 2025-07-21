// Import necessary libraries
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Room Model
 * 
 * This model represents exam rooms available in the system.
 * 
 * @property {number} room_id - Unique identifier for the room
 * @property {string} room_name - Name/number of the room (e.g., "Phòng A1")
 * @property {string} building - Building where the room is located
 * @property {number} capacity - Maximum number of students the room can accommodate
 * @property {boolean} has_computers - Whether the room has computers for exams
 * @property {boolean} is_active - Whether the room is currently usable
 * 
 * @example
 * // How to create a new room:
 * const newRoom = await Room.create({
 *   room_name: 'Phòng A1',
 *   building: 'Tòa nhà A',
 *   capacity: 40,
 *   has_computers: true
 * });
 */
const Room = sequelize.define('Room', {
    room_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Unique identifier for each room'
    },
    room_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Name/number of the room (e.g., "Phòng A1")'
    },
    building: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Building where the room is located'
    },
    floor: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Floor where the room is located'
    },
    capacity: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        comment: 'Maximum number of students the room can accommodate'
    },
    has_computers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the room has computers for exams'
    },
    features: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Additional features of the room (JSON stringified)'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether the room is currently usable'
    }
},{
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Room;