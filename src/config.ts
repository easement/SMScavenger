import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'MONGODB_URI',
  'PORT',
  'NODE_ENV',
  'BASE_URL',
  'ADMIN_API_KEY'
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER!
  },
  mongodb: {
    uri: process.env.MONGODB_URI!
  },
  server: {
    port: parseInt(process.env.PORT!, 10),
    nodeEnv: process.env.NODE_ENV!,
    baseUrl: process.env.BASE_URL!,
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  admin: {
    apiKey: process.env.ADMIN_API_KEY!
  }
} as const; 