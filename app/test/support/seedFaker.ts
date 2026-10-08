import { faker, fakerTH } from '@faker-js/faker';

/**
 * ทำให้ข้อมูลสุ่มของ Test ทำซ้ำได้ทุกครั้ง
 * ถ้า Test fail เราจะ reproduce dataset เดิมได้จาก seed เดียวกัน
 */
beforeEach(() => {
  faker.seed(20261003);
  fakerTH.seed(20261003);
});
