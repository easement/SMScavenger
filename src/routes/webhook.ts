import { Router } from 'express';
import { MessageProcessor } from '../services/MessageProcessor';
import { z } from 'zod';

const router = Router();
const messageProcessor = MessageProcessor.getInstance();

// Validation schema for incoming webhook requests
const webhookSchema = z.object({
  From: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  Body: z.string().min(1, 'Message body is required')
});

router.post('/', async (req, res) => {
  try {
    // Validate request body
    const { From: phoneNumber, Body: message } = webhookSchema.parse(req.body);

    // Process the message
    await messageProcessor.processMessage(phoneNumber, message);

    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Error processing webhook:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

export default router; 