import { hashPassword, verifyPassword } from '../../src/auth/passwords';

describe('hashPassword', () => {
  it('never returns the plain-text password', () => {
    // Arrange
    const password = 'voter1234';

    // Act
    const stored = hashPassword(password);

    // Assert
    expect(stored).not.toBe(password);
  });

  it('gives a different hash each time for the same password (random salt)', () => {
    // Arrange
    const password = 'voter1234';

    // Act
    const firstHash = hashPassword(password);
    const secondHash = hashPassword(password);

    // Assert
    expect(firstHash).not.toBe(secondHash);
  });
});

describe('verifyPassword', () => {
  it('accepts the password that was hashed', () => {
    // Arrange
    const password = 'voter1234';
    const stored = hashPassword(password);

    // Act
    const valid = verifyPassword(password, stored);

    // Assert
    expect(valid).toBe(true);
  });

  it('rejects a different password', () => {
    // Arrange
    const stored = hashPassword('voter1234');

    // Act
    const valid = verifyPassword('wrong-password', stored);

    // Assert
    expect(valid).toBe(false);
  });

  it.each([
    ['garbage'],
    [''],
  ])('rejects a malformed stored hash %p without throwing', (stored) => {
    // Arrange
    const password = 'voter1234';

    // Act
    const valid = verifyPassword(password, stored);

    // Assert
    expect(valid).toBe(false);
  });
});
