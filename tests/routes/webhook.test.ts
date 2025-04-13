import request from 'supertest';
import { app } from '../../src/server';
import { MessageProcessor } from '../../src/services/MessageProcessor';
import { Clue } from '../../src/models/Clue';
import { PlayerSession } from '../../src/models/PlayerSession';
import { v4 as uuidv4 } from 'uuid';

jest.mock('../../src/services/MessageProcessor');

describe('Webhook Routes', () => {
  const mockMessageProcessor = MessageProcessor as jest.MockedClass<typeof MessageProcessor>;

  beforeEach(async () => {
    await Clue.destroy({ where: {} });
    await PlayerSession.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('POST /webhook/sms', () => {
    const validTwilioRequest = {
      From: '+1234567890',
      Body: 'Test message',
      MessageSid: 'TEST_SID',
      AccountSid: 'TEST_ACCOUNT_SID'
    };

    it('should process valid Twilio SMS request', async () => {
      mockMessageProcessor.prototype.processMessage.mockResolvedValue();

      const response = await request(app)
        .post('/webhook/sms')
        .set('X-Twilio-Signature', 'valid_signature')
        .send(validTwilioRequest);

      expect(response.status).toBe(200);
      expect(mockMessageProcessor.prototype.processMessage).toHaveBeenCalledWith(
        validTwilioRequest.From,
        validTwilioRequest.Body
      );
    });

    it('should handle missing Twilio signature', async () => {
      const response = await request(app)
        .post('/webhook/sms')
        .send(validTwilioRequest);

      expect(response.status).toBe(401);
      expect(response.text).toBe('Missing Twilio signature');
      expect(mockMessageProcessor.prototype.processMessage).not.toHaveBeenCalled();
    });

    it('should handle invalid Twilio signature', async () => {
      const response = await request(app)
        .post('/webhook/sms')
        .set('X-Twilio-Signature', 'invalid_signature')
        .send(validTwilioRequest);

      expect(response.status).toBe(401);
      expect(response.text).toBe('Invalid Twilio signature');
      expect(mockMessageProcessor.prototype.processMessage).not.toHaveBeenCalled();
    });

    it('should handle message processing errors gracefully', async () => {
      mockMessageProcessor.prototype.processMessage.mockRejectedValue(new Error('Processing error'));

      const response = await request(app)
        .post('/webhook/sms')
        .set('X-Twilio-Signature', 'valid_signature')
        .send(validTwilioRequest);

      expect(response.status).toBe(200); // Should still return 200 to Twilio
      expect(mockMessageProcessor.prototype.processMessage).toHaveBeenCalled();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/webhook/sms')
        .set('X-Twilio-Signature', 'valid_signature')
        .send({});

      expect(response.status).toBe(200); // Should still return 200 to Twilio
      expect(mockMessageProcessor.prototype.processMessage).not.toHaveBeenCalled();
    });
  });
}); 