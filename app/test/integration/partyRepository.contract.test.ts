import { Pool } from 'pg';
import { PgPartyRepository, PartyRepository } from '../../src/repositories/partyRepository';
import { InMemoryPartyRepository } from '../support/inMemoryRepositories';
import { createTestPool, truncateAll } from './support/database';

describe('PartyRepository contract', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createTestPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe.each([
    [
      'InMemoryPartyRepository',
      async (): Promise<PartyRepository> => new InMemoryPartyRepository(),
    ],
    [
      'PgPartyRepository',
      async (): Promise<PartyRepository> => {
        await truncateAll(pool);
        return new PgPartyRepository(pool);
      },
    ],
  ])('%s', (_name, makeRepository) => {
    let parties: PartyRepository;

    beforeEach(async () => {
      parties = await makeRepository();
    });

    it('finds a created party by id and by name', async () => {
      // Arrange / Act
      const created = await parties.create({
        name: 'พรรคแม่ปิง',
        logoUrl: null,
        policy: 'แก้ฝุ่น',
      });

      // Assert
      await expect(parties.findById(created.id)).resolves.toEqual(created);
      await expect(parties.findByName('พรรคแม่ปิง')).resolves.toEqual(created);
    });
  });
});
