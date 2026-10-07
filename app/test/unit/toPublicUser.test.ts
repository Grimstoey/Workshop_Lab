import { User } from '../../src/domain/types';
import { toPublicUser } from '../../src/services/accountService';

describe('toPublicUser', () => {
  describe('when an internal user contains a password hash', () => {
    it('does not expose passwordHash in the public user', () => {
      // Arrange
      const user: User = {
        id: 1,
        nationalId: '1509900000017',
        passwordHash: 'scrypt$salt$hash',
        firstName: 'Somchai',
        lastName: 'Jaidee',
        address: 'Chiang Mai',
        districtId: 'CM-1',
        role: 'VOTER',
      };

      // Act
      const publicUser = toPublicUser(user);

      // Assert
      expect(publicUser).not.toHaveProperty('passwordHash');
    });
  });
});
