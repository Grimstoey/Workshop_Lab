import { hashPassword, verifyPassword } from '../../src/auth/passwords';
import { TokenService } from '../../src/auth/tokenService';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { AccountService, Registration } from '../../src/services/accountService';
import { ValidationError } from '../../src/errors';
import { InMemoryUserRepository } from '../support/inMemoryRepositories';

const registration: Registration = {
  nationalId: '1509900000017',
  password: 'voter1234',
  firstName: '  สมชาย  ',
  lastName: '  ใจดี  ',
  address: '  เชียงใหม่  ',
  districtId: 'CM-1',
};

// DUMMY: register() ไม่ควรเรียก TokenService เลย
// ถ้า production code เปลี่ยนแล้วมาเรียก dependency นี้ Test จะ fail ทันที
const dummyTokens: TokenService = {
  issue: () => {
    throw new Error('dummy TokenService should not be used');
  },
  verify: () => {
    throw new Error('dummy TokenService should not be used');
  },
};

// STUB: ป้อน indirect input ให้ SUT ว่าเขตเลือกตั้งมีอยู่หรือไม่
function stubDistricts(existing: boolean): DistrictRepository {
  const cm1 = { id: 'CM-1', province: 'เชียงใหม่', number: 1 };
  return {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(existing ? cm1 : null),
  };
}

describe('AccountService.register', () => {
  it('rejects registration when the district does not exist', async () => {
    // Arrange
    const users = new InMemoryUserRepository();
    const accounts = new AccountService(users, stubDistricts(false), dummyTokens);

    // Act
    const result = accounts.register(registration);

    // Assert
    await expect(result).rejects.toThrow(new ValidationError('unknown district'));
  });

  it('stores a password hash instead of plain text and trims user fields', async () => {
    // Arrange
    const users = new InMemoryUserRepository();

    // SPY: ห่อ method จริงเพื่อบันทึก indirect output ที่ SUT ส่งไปยัง repository
    const create = jest.spyOn(users, 'create');
    const accounts = new AccountService(users, stubDistricts(true), dummyTokens);

    // Act
    await accounts.register(registration);

    // Assert
    const saved = create.mock.calls[0][0];
    expect(saved.passwordHash).not.toContain(registration.password);
    expect(verifyPassword(registration.password, saved.passwordHash)).toBe(true);
    expect(saved.firstName).toBe('สมชาย');
    expect(saved.lastName).toBe('ใจดี');
    expect(saved.address).toBe('เชียงใหม่');
  });
});

describe('AccountService.login', () => {
  it('issues a token with the registered voter principal', async () => {
    // Arrange
    const users = new InMemoryUserRepository();
    const voter = await users.create({
      nationalId: '1509900000017',
      passwordHash: hashPassword('voter1234'),
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      address: 'เชียงใหม่',
      districtId: 'CM-1',
    });

    // MOCK: การเรียก issue() ด้วย principal ที่ถูกต้องคือ behavior ที่ต้องการตรวจ
    // mockReturnValue ทำหน้าที่เป็น Stub เล็กน้อยด้วย เพราะป้อน token กลับให้ SUT
    const tokens: TokenService = {
      issue: jest.fn().mockReturnValue('token-123'),
      verify: jest.fn(),
    };
    const accounts = new AccountService(users, stubDistricts(true), tokens);

    // Act
    const token = await accounts.login('1509900000017', 'voter1234');

    // Assert
    expect(token).toBe('token-123');
    expect(tokens.issue).toHaveBeenCalledWith({
      userId: voter.id,
      role: 'VOTER',
      districtId: 'CM-1',
    });
  });

  it('rejects a wrong password without issuing a token', async () => {
    // Arrange
    const users = new InMemoryUserRepository();
    await users.create({
      nationalId: '1509900000017',
      passwordHash: hashPassword('voter1234'),
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      address: 'เชียงใหม่',
      districtId: 'CM-1',
    });

    // MOCK: ใน failure path ต้องยืนยันว่าไม่มีการออก token
    const tokens: TokenService = {
      issue: jest.fn(),
      verify: jest.fn(),
    };
    const accounts = new AccountService(users, stubDistricts(true), tokens);

    // Act
    const result = accounts.login('1509900000017', 'wrong-password');

    // Assert
    await expect(result).rejects.toThrow('invalid national id or password');
    expect(tokens.issue).not.toHaveBeenCalled();
  });
});
