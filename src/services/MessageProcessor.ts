import { GameStateService, GameStateError } from './GameStateService';
import { TwilioService } from './TwilioService';
import { PlayerSession } from '../models/PlayerSession';

export enum Command {
  START = 'START',
  HINT = 'HINT',
  ANSWER = 'ANSWER',
  HELP = 'HELP'
}

export class MessageProcessor {
  private static instance: MessageProcessor | null = null;
  private readonly gameState: GameStateService;
  private readonly twilioService: TwilioService;

  constructor(
    gameState?: GameStateService,
    twilioService?: TwilioService
  ) {
    this.gameState = gameState || GameStateService.getInstance();
    this.twilioService = twilioService || TwilioService.getInstance();
  }

  public static getInstance(): MessageProcessor {
    if (!MessageProcessor.instance) {
      MessageProcessor.instance = new MessageProcessor();
    }
    return MessageProcessor.instance;
  }

  // For testing purposes
  public static resetInstance(): void {
    MessageProcessor.instance = null;
  }

  public async processMessage(phoneNumber: string, message: string): Promise<void> {
    const command = this.parseCommand(message);
    
    switch (command) {
      case Command.START:
        await this.handleStart(phoneNumber);
        break;
      case Command.HINT:
        await this.handleHint(phoneNumber);
        break;
      case Command.ANSWER:
        await this.handleAnswer(phoneNumber, message);
        break;
      case Command.HELP:
        await this.handleHelp(phoneNumber);
        break;
      default:
        await this.handleUnknownCommand(phoneNumber);
    }
  }

  private parseCommand(message: string): Command {
    const upperMessage = message.trim().toUpperCase();
    
    if (upperMessage === 'START') return Command.START;
    if (upperMessage === 'HINT') return Command.HINT;
    if (upperMessage === 'HELP') return Command.HELP;
    if (upperMessage.startsWith('ANSWER ')) return Command.ANSWER;
    
    return Command.HELP; // Default to help for unknown commands
  }

  private async handleStart(phoneNumber: string): Promise<void> {
    let session = await PlayerSession.findOne({
      where: { phoneNumber }
    });
    
    if (!session) {
      const gameId = await this.gameState.initializeClues();
      session = await PlayerSession.create({ 
        phoneNumber,
        gameId,
        currentClueId: '', // This will be set by GameState
        attempts: 0,
        hintsUsed: 0,
        completed: false,
        startTime: new Date()
      });
    }

    const currentClue = await this.gameState.getCurrentClue(phoneNumber);
    if (!currentClue) {
      await this.twilioService.sendMessage(phoneNumber, 'Sorry, no clues are available at the moment.');
      return;
    }

    await this.twilioService.sendMessage(
      phoneNumber,
      `Welcome to the Scavenger Hunt! Here's your first clue:\n\n${currentClue.question}`
    );
  }

  private async handleHint(phoneNumber: string): Promise<void> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      await this.twilioService.sendMessage(
        phoneNumber,
        'Please start the game first by sending START'
      );
      return;
    }

    const hint = await this.gameState.requestHint(phoneNumber);
    if (hint) {
      await this.twilioService.sendMessage(phoneNumber, `Hint: ${hint}`);
    } else {
      await this.twilioService.sendMessage(
        phoneNumber,
        'Sorry, no hint is available for this clue yet. Try making a few more attempts first.'
      );
    }
  }

  private async handleAnswer(phoneNumber: string, answer: string): Promise<void> {
    const session = await PlayerSession.findOne({
      where: { phoneNumber }
    });

    if (!session) {
      await this.twilioService.sendMessage(
        phoneNumber,
        'Please start the game first by sending START'
      );
      return;
    }

    const isCorrect = await this.gameState.checkAnswer(phoneNumber, answer);
    if (isCorrect) {
      const isComplete = await this.gameState.isGameComplete(phoneNumber);
      if (isComplete) {
        await this.twilioService.sendMessage(
          phoneNumber,
          'Congratulations! You have completed the scavenger hunt!'
        );
      } else {
        const nextClue = await this.gameState.getCurrentClue(phoneNumber);
        if (!nextClue) {
          await this.twilioService.sendMessage(
            phoneNumber,
            'Error: Could not retrieve next clue.'
          );
          return;
        }
        await this.twilioService.sendMessage(
          phoneNumber,
          `Correct! Here's your next clue:\n\n${nextClue.question}`
        );
      }
    } else {
      await this.twilioService.sendMessage(
        phoneNumber,
        'Sorry, that answer is incorrect. Try again!'
      );
    }
  }

  private async handleHelp(phoneNumber: string): Promise<void> {
    const helpMessage = 
      'Available commands:\n' +
      'START - Start the scavenger hunt\n' +
      'HINT - Get a hint for the current clue\n' +
      'ANSWER <your answer> - Submit an answer for the current clue\n' +
      'HELP - Show this help message';
    
    await this.twilioService.sendMessage(phoneNumber, helpMessage);
  }

  private async handleUnknownCommand(phoneNumber: string): Promise<void> {
    await this.handleHelp(phoneNumber);
  }
} 