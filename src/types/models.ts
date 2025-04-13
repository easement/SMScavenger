import { Types } from 'mongoose';

export enum ClueType {
  TEXT = 'text',
  IMAGE = 'image',
  RIDDLE = 'riddle'
}

export interface IClue {
  id: string;
  type: ClueType;
  question: string;
  answer: string;
  hint: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlayerSession {
  phoneNumber: string;
  gameId: string;
  currentClueId: string;
  attempts: number;
  hintsUsed: number;
  completed: boolean;
  startTime: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 