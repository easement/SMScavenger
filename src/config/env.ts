import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variable schema
const envSchema = z.object({
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),
  DB_PATH: z.string().default('./data/game.db'),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ADMIN_API_KEY: z.string().min(1),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Create config object with environment variables and derived configuration
const config = {
  env,
  admin: {
    apiKey: env.ADMIN_API_KEY,
  },
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
  },
  database: {
    path: env.DB_PATH,
  },
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  },
};

export { config };
export default env; 