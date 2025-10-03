import { beforeAll, afterAll } from 'vitest';

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});
