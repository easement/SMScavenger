import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface IGame {
  id: string;
  name: string;
  description: string;
  active: boolean;
  startTime: Date;
  endTime?: Date;
  maxPlayers?: number;
  currentPlayers: number;
  settings: {
    maxAttempts?: number;
    hintThreshold?: number;
    timeLimit?: number;
  };
}

class Game extends Model<IGame> implements IGame {
  public id!: string;
  public name!: string;
  public description!: string;
  public active!: boolean;
  public startTime!: Date;
  public endTime?: Date;
  public maxPlayers?: number;
  public currentPlayers!: number;
  public settings!: {
    maxAttempts?: number;
    hintThreshold?: number;
    timeLimit?: number;
  };

  public async incrementPlayers(): Promise<void> {
    this.currentPlayers += 1;
    await this.save();
  }

  public async decrementPlayers(): Promise<void> {
    if (this.currentPlayers > 0) {
      this.currentPlayers -= 1;
      await this.save();
    }
  }

  public async deactivate(): Promise<void> {
    this.active = false;
    this.endTime = new Date();
    await this.save();
  }

  public canJoin(): boolean {
    if (!this.active) return false;
    if (this.maxPlayers && this.currentPlayers >= this.maxPlayers) return false;
    if (this.endTime && this.endTime <= new Date()) return false;
    return true;
  }
}

Game.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maxPlayers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  currentPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Game',
  tableName: 'games',
  timestamps: true,
  indexes: [
    {
      fields: ['active']
    },
    {
      fields: ['startTime']
    }
  ]
});

export { Game }; 