import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export interface IClue {
  id: string;
  type: string;
  question: string;
  answer: string;
  hint?: string;
  answerLowerCase?: string;
}

class Clue extends Model<IClue> implements IClue {
  public id!: string;
  public type!: string;
  public question!: string;
  public answer!: string;
  public hint?: string;
  public answerLowerCase?: string;

  public checkAnswer(answer: string): boolean {
    return this.answerLowerCase === answer.trim().toLowerCase();
  }
}

Clue.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  question: {
    type: DataTypes.STRING,
    allowNull: false
  },
  answer: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value: string) {
      this.setDataValue('answer', value);
      this.setDataValue('answerLowerCase', value.trim().toLowerCase());
    }
  },
  hint: {
    type: DataTypes.STRING,
    allowNull: true
  },
  answerLowerCase: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'answer_lower_case'
  }
}, {
  sequelize,
  modelName: 'Clue',
  tableName: 'clues',
  timestamps: true,
  underscored: true
});

export { Clue }; 