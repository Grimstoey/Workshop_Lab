import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('reads PORT from the provided environment', () => {
    // Arrange
    const env = { PORT: '8080' };

    // Act
    const config = loadConfig(env);

    // Assert
    expect(config.port).toBe(8080);
  });

  it('defaults PORT to 3000 when it is not provided', () => {
    // Arrange
    const env = {};

    // Act
    const config = loadConfig(env);

    // Assert
    expect(config.port).toBe(3000);
  });

  it('reads DATABASE_URL from the provided environment', () => {
    // Arrange
    const env = { DATABASE_URL: 'postgres://test:test@localhost:5432/test_db' };

    // Act
    const config = loadConfig(env);

    // Assert
    expect(config.databaseUrl).toBe('postgres://test:test@localhost:5432/test_db');
  });

  it('reads JWT_SECRET from the provided environment', () => {
    // Arrange
    const env = { JWT_SECRET: 'test-secret' };

    // Act
    const config = loadConfig(env);

    // Assert
    expect(config.jwtSecret).toBe('test-secret');
  });

  it('uses development defaults when values are not provided', () => {
    // Arrange
    const env = {};

    // Act
    const config = loadConfig(env);

    // Assert
    expect(config).toEqual({
      port: 3000,
      databaseUrl: 'postgres://election:election@localhost:5432/election_dev',
      jwtSecret: 'dev-secret',
    });
  });
});
