import request from 'supertest';
import { app } from '../server';
import { config } from '../config/env';

describe('Webhook Endpoint', () => {
  it('should return 200 for valid Twilio request', async () => {
    const response = await request(app)
      .post('/webhook')
      .send({
        MessageSid: 'test_message_sid',
        From: config.twilio.phoneNumber,
        Body: 'test message',
        To: config.twilio.phoneNumber
      });

    expect(response.status).toBe(200);
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/webhook')
      .send({
        MessageSid: 'test_message_sid',
        // Missing From and Body fields
        To: config.twilio.phoneNumber
      });

    expect(response.status).toBe(400);
  });
}); 