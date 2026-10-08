import { faker } from '@faker-js/faker';

/**
 * สร้างเลขบัตรประชาชน 13 หลักที่ checksum ถูกต้องตามกฎของ domain
 * ข้อมูล 12 หลักแรกมาจาก Faker ส่วนหลักสุดท้ายคำนวณจาก checksum
 */
export function aValidNationalId(): string {
  const base = faker.string.numeric({ length: 12, allowLeadingZeros: false });
  const sum = [...base].reduce((acc, digit, index) => acc + Number(digit) * (13 - index), 0);
  const checksum = (11 - (sum % 11)) % 10;
  return base + checksum;
}
