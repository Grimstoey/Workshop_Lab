import { DistrictRepository } from '../../src/repositories/districtRepository';
import { ElectionAdminService } from '../../src/services/electionAdminService';
import { ConflictError } from '../../src/errors';
import {
  InMemoryCandidateRepository,
  InMemoryPartyRepository,
} from '../support/inMemoryRepositories';

// STUB: ควบคุม indirect input เรื่องการมีอยู่ของเขตเลือกตั้ง
function stubDistricts(existing: boolean): DistrictRepository {
  const cm1 = { id: 'CM-1', province: 'เชียงใหม่', number: 1 };
  return {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(existing ? cm1 : null),
  };
}

describe('ElectionAdminService', () => {
  it('creates a party using the in-memory repository fake', async () => {
    // Arrange
    const parties = new InMemoryPartyRepository();
    const candidates = new InMemoryCandidateRepository(parties);
    const service = new ElectionAdminService(parties, candidates, stubDistricts(true));

    // Act
    const party = await service.createParty({
      name: '  พรรคทดสอบ  ',
      logoUrl: null,
      policy: '  นโยบายเพื่อประชาชน  ',
    });

    // Assert
    expect(party).toMatchObject({
      id: 1,
      name: 'พรรคทดสอบ',
      policy: 'นโยบายเพื่อประชาชน',
    });
    await expect(parties.findByName('พรรคทดสอบ')).resolves.toEqual(party);
  });

  it('adds a candidate and keeps repository state consistent', async () => {
    // Arrange
    const parties = new InMemoryPartyRepository();
    const candidates = new InMemoryCandidateRepository(parties);
    const service = new ElectionAdminService(parties, candidates, stubDistricts(true));
    const party = await parties.create({
      name: 'พรรคทดสอบ',
      logoUrl: null,
      policy: 'นโยบาย',
    });

    // Act
    const candidate = await service.addCandidate('CM-1', {
      partyId: party.id,
      number: 1,
      firstName: '  มานะ  ',
      lastName: '  ดีใจ  ',
      photoUrl: null,
    });

    // Assert
    expect(candidate).toMatchObject({
      districtId: 'CM-1',
      partyId: party.id,
      partyName: 'พรรคทดสอบ',
      number: 1,
      firstName: 'มานะ',
      lastName: 'ดีใจ',
    });
    await expect(candidates.findByDistrict('CM-1')).resolves.toContainEqual(candidate);
  });

  it('rejects a duplicate candidate number in the same district', async () => {
    // Arrange
    const parties = new InMemoryPartyRepository();
    const candidates = new InMemoryCandidateRepository(parties);
    const service = new ElectionAdminService(parties, candidates, stubDistricts(true));
    const firstParty = await parties.create({ name: 'พรรคหนึ่ง', logoUrl: null, policy: 'A' });
    const secondParty = await parties.create({ name: 'พรรคสอง', logoUrl: null, policy: 'B' });

    await service.addCandidate('CM-1', {
      partyId: firstParty.id,
      number: 1,
      firstName: 'คนแรก',
      lastName: 'ทดสอบ',
    });

    // Act
    const result = service.addCandidate('CM-1', {
      partyId: secondParty.id,
      number: 1,
      firstName: 'คนที่สอง',
      lastName: 'ทดสอบ',
    });

    // Assert
    await expect(result).rejects.toThrow(
      new ConflictError('candidate number already used in this district'),
    );
  });
});
