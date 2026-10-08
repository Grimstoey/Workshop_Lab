import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';
import { aParty, aVoter } from '../support/builders';

describe('Test Data Builders', () => {
  it('creates a voter with dynamically generated but valid Faker data', () => {
    // Arrange / Act
    const voter = aVoter().inDistrict('CM-2').build();

    // Assert
    expect(isValidThaiNationalId(voter.nationalId)).toBe(true);
    expect(voter.firstName).not.toBe('');
    expect(voter.lastName).not.toBe('');
    expect(voter.address).not.toBe('');
    expect(voter.districtId).toBe('CM-2');
    expect(voter.role).toBe('VOTER');
  });

  it('allows important values to be overridden while defaults come from Faker', () => {
    // Arrange / Act
    const party = aParty()
      .named('พรรคแม่ปิง')
      .withPolicy('แก้ปัญหาฝุ่น PM2.5')
      .build();

    // Assert
    expect(party).toMatchObject({
      name: 'พรรคแม่ปิง',
      policy: 'แก้ปัญหาฝุ่น PM2.5',
      logoUrl: null,
    });
  });
});
