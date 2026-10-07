import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';

describe('isValidThaiNationalId', () => {
  it.each([
    ['1509900000017'],
    ['1100000000016'],
  ])('accepts %s when the checksum digit is valid', (id) => {
    // Arrange
    const nationalId = id;

    // Act
    const valid = isValidThaiNationalId(nationalId);

    // Assert
    expect(valid).toBe(true);
  });

  it('rejects an id whose checksum digit is wrong', () => {
    // Arrange
    const nationalId = '1509900000018';

    // Act
    const valid = isValidThaiNationalId(nationalId);

    // Assert
    expect(valid).toBe(false);
  });

  it.each([
    ['empty', ''],
    ['12 digits', '150990000001'],
    ['14 digits', '15099000000170'],
    ['a letter', '150990000001x'],
    ['all letters', 'abcdefghijklm'],
  ])('rejects a malformed id (%s)', (_case, id) => {
    // Arrange
    const nationalId = id;

    // Act
    const valid = isValidThaiNationalId(nationalId);

    // Assert
    expect(valid).toBe(false);
  });
});
