import twilio from 'twilio';
import env from '../config/env';

export class TwilioError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'TwilioError';
  }
}

interface MessageTemplate {
  welcome: string;
  clue: string;
  hint: string;
  correct: string;
  incorrect: string;
  complete: string;
  help: string;
}

interface MediaMessage {
  to: string;
  message: string;
  mediaUrl: string;
  retries: number;
}

interface TextMessage {
  to: string;
  message: string;
  retries: number;
}

type QueuedMessage = TextMessage | MediaMessage;

export class TwilioService {
  private static instance: TwilioService;
  private client: twilio.Twilio;
  private fromNumber: string;
  private messageQueue: QueuedMessage[] = [];
  private isProcessingQueue: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  private readonly templates: MessageTemplate = {
    welcome: 'Welcome to the Scavenger Hunt! Here\'s your first clue:\n\n{clue}',
    clue: 'Here\'s your next clue:\n\n{clue}',
    hint: 'Here\'s your hint:\n\n{hint}',
    correct: 'Correct! {message}',
    incorrect: 'That\'s not correct. Try again!',
    complete: 'Congratulations! You\'ve completed all the clues in the scavenger hunt!',
    help: 'Available commands:\nSTART - Start the scavenger hunt\nHINT - Get a hint for the current clue\nANSWER <your answer> - Submit an answer for the current clue\nHELP - Show this help message'
  };

  private constructor() {
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    this.fromNumber = env.TWILIO_PHONE_NUMBER;
    this.startQueueProcessor();
  }

  public static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  private async startQueueProcessor(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.isProcessingQueue) {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue[0];
        try {
          if ('mediaUrl' in message) {
            await this.sendMediaMessageInternal(message.to, message.message, message.mediaUrl);
          } else {
            await this.sendMessageInternal(message.to, message.message);
          }
          this.messageQueue.shift(); // Remove sent message from queue
        } catch (error) {
          if (message.retries < this.MAX_RETRIES) {
            message.retries++;
            // Move to end of queue for retry
            this.messageQueue.shift();
            this.messageQueue.push(message);
          } else {
            this.messageQueue.shift(); // Remove failed message
            console.error('Failed to send message after max retries:', error);
          }
          // Wait before processing next message
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      } else {
        // Wait before checking queue again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async sendMessageInternal(to: string, message: string): Promise<void> {
    try {
      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: this.fromNumber
      });

      if (result.errorCode) {
        throw new TwilioError(`Twilio error: ${result.errorMessage}`, result.errorCode.toString());
      }
    } catch (error) {
      if (error instanceof TwilioError) {
        throw error;
      }
      throw new TwilioError(`Failed to send SMS message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async sendMediaMessageInternal(to: string, message: string, mediaUrl: string): Promise<void> {
    try {
      const result = await this.client.messages.create({
        body: message,
        to: to,
        from: this.fromNumber,
        mediaUrl: [mediaUrl]
      });

      if (result.errorCode) {
        throw new TwilioError(`Twilio error: ${result.errorMessage}`, result.errorCode.toString());
      }
    } catch (error) {
      if (error instanceof TwilioError) {
        throw error;
      }
      throw new TwilioError(`Failed to send media message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async sendMessage(to: string, message: string): Promise<void> {
    // Add message to queue
    this.messageQueue.push({
      to,
      message,
      retries: 0
    });
  }

  public async sendMediaMessage(to: string, message: string, mediaUrl: string): Promise<void> {
    // Add media message to queue
    this.messageQueue.push({
      to,
      message,
      mediaUrl,
      retries: 0
    });
  }

  public async sendWelcomeMessage(to: string, clue: string, mediaUrl?: string): Promise<void> {
    const message = this.templates.welcome.replace('{clue}', clue);
    if (mediaUrl) {
      await this.sendMediaMessage(to, message, mediaUrl);
    } else {
      await this.sendMessage(to, message);
    }
  }

  public async sendClueMessage(to: string, clue: string, mediaUrl?: string): Promise<void> {
    const message = this.templates.clue.replace('{clue}', clue);
    if (mediaUrl) {
      await this.sendMediaMessage(to, message, mediaUrl);
    } else {
      await this.sendMessage(to, message);
    }
  }

  public async sendHintMessage(to: string, hint: string, mediaUrl?: string): Promise<void> {
    const message = this.templates.hint.replace('{hint}', hint);
    if (mediaUrl) {
      await this.sendMediaMessage(to, message, mediaUrl);
    } else {
      await this.sendMessage(to, message);
    }
  }

  public async sendCorrectAnswerMessage(to: string, nextClue?: string, mediaUrl?: string): Promise<void> {
    const message = this.templates.correct.replace('{message}', 
      nextClue ? this.templates.clue.replace('{clue}', nextClue) : this.templates.complete
    );
    if (mediaUrl) {
      await this.sendMediaMessage(to, message, mediaUrl);
    } else {
      await this.sendMessage(to, message);
    }
  }

  public async sendIncorrectAnswerMessage(to: string): Promise<void> {
    await this.sendMessage(to, this.templates.incorrect);
  }

  public async sendHelpMessage(to: string): Promise<void> {
    await this.sendMessage(to, this.templates.help);
  }

  public stopQueueProcessor(): void {
    this.isProcessingQueue = false;
  }
} 