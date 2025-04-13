import env, { config } from '../../src/config/env';

describe('Environment Configuration', () => {
  it('should load all required environment variables', () => {
    expect(env.TWILIO_ACCOUNT_SID).toBeDefined();
    expect(env.TWILIO_AUTH_TOKEN).toBeDefined();
    expect(env.TWILIO_PHONE_NUMBER).toBeDefined();
    expect(env.PORT).toBeDefined();
    expect(env.NODE_ENV).toBeDefined();
    expect(env.ADMIN_API_KEY).toBeDefined();
    expect(env.DB_PATH).toBeDefined();
  });

  it('should have correct types for environment variables', () => {
    expect(typeof env.TWILIO_ACCOUNT_SID).toBe('string');
    expect(typeof env.TWILIO_AUTH_TOKEN).toBe('string');
    expect(typeof env.TWILIO_PHONE_NUMBER).toBe('string');
    expect(typeof env.PORT).toBe('number');
    expect(['development', 'test', 'production']).toContain(env.NODE_ENV);
    expect(typeof env.ADMIN_API_KEY).toBe('string');
    expect(typeof env.DB_PATH).toBe('string');
  });

  it('should have correct config structure', () => {
    expect(config.admin.apiKey).toBe(env.ADMIN_API_KEY);
    expect(config.twilio.accountSid).toBe(env.TWILIO_ACCOUNT_SID);
    expect(config.twilio.authToken).toBe(env.TWILIO_AUTH_TOKEN);
    expect(config.twilio.phoneNumber).toBe(env.TWILIO_PHONE_NUMBER);
    expect(config.database.path).toBe(env.DB_PATH);
    expect(config.server.port).toBe(env.PORT);
    expect(config.server.nodeEnv).toBe(env.NODE_ENV);
  });
}); 