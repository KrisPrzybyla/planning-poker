// MySQL Configuration Example for Planning Poker
// npm install mysql2 sequelize

import mysql from 'mysql2/promise';
import { Sequelize, DataTypes } from 'sequelize';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'planning_poker',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'planning_poker',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Models
const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.STRING(6),
    primaryKey: true
  },
  votingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'voting_count'
  },
  currentStoryId: {
    type: DataTypes.STRING(36),
    allowNull: true,
    field: 'current_story_id'
  },
  isVotingActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_voting_active'
  },
  isResultsVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_results_visible'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'rooms',
  underscored: true
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  roomId: {
    type: DataTypes.STRING(6),
    allowNull: false,
    field: 'room_id'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Scrum Master', 'Participant', 'Temporary Scrum Master', 'Displaced Scrum Master'),
    defaultValue: 'Participant'
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_connected'
  },
  connectedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'connected_at'
  },
  disconnectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'disconnected_at'
  }
}, {
  tableName: 'users',
  underscored: true
});

const Story = sequelize.define('Story', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  roomId: {
    type: DataTypes.STRING(6),
    allowNull: false,
    field: 'room_id'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  votingStartedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'voting_started_at'
  },
  votingEndedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'voting_ended_at'
  },
  averageVote: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    field: 'average_vote'
  },
  consensusReached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'consensus_reached'
  }
}, {
  tableName: 'stories',
  underscored: true
});

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true
  },
  storyId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'story_id'
  },
  userId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'user_id'
  },
  voteValue: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'vote_value'
  },
  votedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'voted_at'
  }
}, {
  tableName: 'votes',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['story_id', 'user_id']
    }
  ]
});

// Associations
Room.hasMany(User, { foreignKey: 'roomId', as: 'users' });
Room.hasMany(Story, { foreignKey: 'roomId', as: 'stories' });
Room.belongsTo(Story, { foreignKey: 'currentStoryId', as: 'currentStory' });

User.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
User.hasMany(Vote, { foreignKey: 'userId', as: 'votes' });

Story.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Story.hasMany(Vote, { foreignKey: 'storyId', as: 'votes' });

Vote.belongsTo(Story, { foreignKey: 'storyId', as: 'story' });
Vote.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Database service class
class DatabaseService {
  static async initialize() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
      
      // Sync models (create tables if they don't exist)
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        console.log('✅ Database models synchronized.');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Unable to connect to the database:', error);
      return false;
    }
  }

  // Room operations
  static async createRoom(roomData) {
    return await Room.create(roomData);
  }

  static async getRoomWithUsers(roomId) {
    return await Room.findByPk(roomId, {
      include: [
        {
          model: User,
          as: 'users',
          where: { isConnected: true },
          required: false
        },
        {
          model: Story,
          as: 'currentStory',
          include: [{
            model: Vote,
            as: 'votes',
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name']
            }]
          }]
        }
      ]
    });
  }

  static async updateRoom(roomId, updates) {
    return await Room.update(updates, { where: { id: roomId } });
  }

  static async deleteRoom(roomId) {
    return await Room.destroy({ where: { id: roomId } });
  }

  // User operations
  static async createUser(userData) {
    return await User.create(userData);
  }

  static async updateUserConnection(userId, isConnected) {
    const updates = { 
      isConnected,
      [isConnected ? 'connectedAt' : 'disconnectedAt']: new Date()
    };
    return await User.update(updates, { where: { id: userId } });
  }

  static async removeUser(userId) {
    return await User.destroy({ where: { id: userId } });
  }

  // Story operations
  static async createStory(storyData) {
    return await Story.create(storyData);
  }

  static async updateStory(storyId, updates) {
    return await Story.update(updates, { where: { id: storyId } });
  }

  // Vote operations
  static async createOrUpdateVote(voteData) {
    return await Vote.upsert(voteData);
  }

  static async getVotesForStory(storyId) {
    return await Vote.findAll({
      where: { storyId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }]
    });
  }

  // Analytics
  static async getRoomStatistics(roomId) {
    const room = await Room.findByPk(roomId, {
      include: [
        { model: User, as: 'users' },
        { model: Story, as: 'stories' }
      ]
    });

    if (!room) return null;

    const totalVotes = await Vote.count({
      include: [{
        model: Story,
        as: 'story',
        where: { roomId }
      }]
    });

    return {
      roomId,
      totalUsers: room.users.length,
      connectedUsers: room.users.filter(u => u.isConnected).length,
      totalStories: room.stories.length,
      totalVotes,
      createdAt: room.createdAt
    };
  }

  static async getGlobalStatistics() {
    const [totalRooms, totalUsers, totalStories, totalVotes] = await Promise.all([
      Room.count({ where: { isActive: true } }),
      User.count({ where: { isConnected: true } }),
      Story.count(),
      Vote.count()
    ]);

    return {
      totalRooms,
      totalUsers,
      totalStories,
      totalVotes
    };
  }
}

export {
  sequelize,
  Room,
  User,
  Story,
  Vote,
  DatabaseService
};

// Usage example:
/*
import { DatabaseService } from './mysql-config.js';

// Initialize database
await DatabaseService.initialize();

// Create room
const room = await DatabaseService.createRoom({
  id: 'ABC123',
  votingCount: 0
});

// Get room with users
const roomData = await DatabaseService.getRoomWithUsers('ABC123');
*/