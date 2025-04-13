import { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { config } from '../config';

export const validateTwilioRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const url = `${config.server.baseUrl}${req.originalUrl}`;
  const params = req.body;

  if (!twilioSignature) {
    return res.status(401).send('Missing Twilio signature');
  }

  const isValid = twilio.validateRequest(
    config.twilio.authToken,
    twilioSignature,
    url,
    params
  );

  if (!isValid) {
    return res.status(401).send('Invalid Twilio signature');
  }

  next();
}; 