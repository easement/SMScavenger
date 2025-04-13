import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface IPlayerSession {
  phoneNumber: string;
  gameId: string;
  currentClueId: string;
  attempts: number;
  hintsUsed: number;
  completed: boolean;
  startTime: Date;
  completedAt?: Date;
}

class PlayerSession extends Model<IPlayerSession> implements IPlayerSession {
  public phoneNumber!: string;
  public gameId!: string;
  public currentClueId!: string;
  public attempts!: number;
  public hintsUsed!: number;
  public completed!: boolean;
  public startTime!: Date;
  public completedAt?: Date;

  public async canRequestHint(): Promise<boolean> {
    return this.attempts >= 2 && this.hintsUsed === 0;
  }

  public async incrementAttempts(): Promise<void> {
    this.attempts += 1;
    await this.save();
  }

  public async resetForNextClue(nextClueId: string): Promise<void> {
    this.currentClueId = nextClueId;
    this.attempts = 0;
    this.hintsUsed = 0;
    await this.save();
  }
}

PlayerSession.init({
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^\+[1-9]\d{1,14}$/
    },
    field: 'phone_number'
  },
  gameId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'game_id'
  },
  currentClueId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'current_clue_id'
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  hintsUsed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    field: 'hints_used'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'start_time'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  }
}, {
  sequelize,
  modelName: 'PlayerSession',
  tableName: 'player_sessions',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['phone_number', 'game_id']
    }
  ]
});

export { PlayerSession }; 