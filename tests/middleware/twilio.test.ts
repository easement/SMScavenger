import { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { validateTwilioRequest } from '../../src/middleware/twilio';
import { config } from '../../src/config';

// Mock twilio.validateRequest
jest.mock('twilio', () => ({
  validateRequest: jest.fn()
}));

describe('Twilio Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      headers: {},
      originalUrl: '/webhook/sms',
      body: {
        From: '+1234567890',
        Body: 'START',
        MessageSid: 'test_message_sid',
        AccountSid: config.twilio.accountSid
      }
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Setup next function
    nextFunction = jest.fn();
  });

  it('should pass validation with valid Twilio signature', () => {
    // Setup
    mockRequest.headers = { 'x-twilio-signature': 'valid_signature' };
    (twilio.validateRequest as jest.Mock).mockReturnValue(true);

    // Execute
    validateTwilioRequest(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // Verify
    expect(twilio.validateRequest).toHaveBeenCalledWith(
      config.twilio.authToken,
      'valid_signature',
      `${config.server.baseUrl}/webhook/sms`,
      mockRequest.body
    );
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject request with missing Twilio signature', () => {
    // Execute
    validateTwilioRequest(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // Verify
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith('Missing Twilio signature');
    expect(nextFunction).not.toHaveBeenCalled();
    expect(twilio.validateRequest).not.toHaveBeenCalled();
  });

  it('should reject request with invalid Twilio signature', () => {
    // Setup
    mockRequest.headers = { 'x-twilio-signature': 'invalid_signature' };
    (twilio.validateRequest as jest.Mock).mockReturnValue(false);

    // Execute
    validateTwilioRequest(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // Verify
    expect(twilio.validateRequest).toHaveBeenCalledWith(
      config.twilio.authToken,
      'invalid_signature',
      `${config.server.baseUrl}/webhook/sms`,
      mockRequest.body
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith('Invalid Twilio signature');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should handle different URL paths correctly', () => {
    // Setup
    mockRequest.headers = { 'x-twilio-signature': 'valid_signature' };
    mockRequest.originalUrl = '/webhook/sms/custom';
    (twilio.validateRequest as jest.Mock).mockReturnValue(true);

    // Execute
    validateTwilioRequest(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    // Verify
    expect(twilio.validateRequest).toHaveBeenCalledWith(
      config.twilio.authToken,
      'valid_signature',
      `${config.server.baseUrl}/webhook/sms/custom`,
      mockRequest.body
    );
    expect(nextFunction).toHaveBeenCalled();
  });
}); 