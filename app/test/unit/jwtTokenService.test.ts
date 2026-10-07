import { JwtTokenService, Principal } from '../../src/auth/tokenService';

describe('JwtTokenService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the principal while the token is still valid', () => {
    // Arrange
    jest.useFakeTimers({
      now: new Date('2026-10-03T09:00:00+07:00'),
    });
    const tokens = new JwtTokenService('test-secret', 60);
    const principal: Principal = {
      userId: 1,
      role: 'VOTER',
      districtId: 'CM-1',
    };
    const token = tokens.issue(principal);

    // Act
    const verified = tokens.verify(token);

    // Assert
    expect(verified).toEqual(principal);
  });

  it('returns null after the token has expired', () => {
    // Arrange
    jest.useFakeTimers({
      now: new Date('2026-10-03T09:00:00+07:00'),
    });
    const tokens = new JwtTokenService('test-secret', 60);
    const principal: Principal = {
      userId: 1,
      role: 'VOTER',
      districtId: 'CM-1',
    };
    const token = tokens.issue(principal);

    // Act
    jest.setSystemTime(new Date('2026-10-03T09:01:01+07:00'));
    const verified = tokens.verify(token);

    // Assert
    expect(verified).toBeNull();
  });
});
