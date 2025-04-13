import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TestDatabase } from './utils/testUtils';

// Configure test timeouts
jest.setTimeout(30000);

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.PORT = '3000';
process.env.BASE_URL = 'http://localhost:3000';
process.env.ADMIN_API_KEY = 'test_admin_api_key';

beforeAll(async () => {
  if (!mongoose.connection.readyState) {
    await TestDatabase.connect();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState) {
    await TestDatabase.disconnect();
  }
});

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.readyState) {
    await TestDatabase.cleanup();
  }
  jest.clearAllMocks();
});

// Mock console.error to keep test output clean
console.error = jest.fn();

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 