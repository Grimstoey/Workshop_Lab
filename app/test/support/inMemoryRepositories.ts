import { Candidate, Party, Role, User } from '../../src/domain/types';
import { CandidateRepository, NewCandidate } from '../../src/repositories/candidateRepository';
import { NewParty, PartyRepository } from '../../src/repositories/partyRepository';
import { NewUser, UserRepository } from '../../src/repositories/userRepository';

/**
 * FAKE: implementation แบบง่ายของ UserRepository ที่เก็บข้อมูลใน memory
 * ใช้แทน PostgreSQL ใน unit test เพื่อให้ทดสอบได้เร็วและไม่ต้องมี I/O
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];
  private nextId = 1;

  async findById(id: number): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByNationalId(nationalId: string): Promise<User | null> {
    return this.users.find((user) => user.nationalId === nationalId) ?? null;
  }

  async create(user: NewUser): Promise<User> {
    const created: User = {
      ...user,
      id: this.nextId++,
      role: 'VOTER',
    };
    this.users.push(created);
    return created;
  }

  async updateRole(id: number, role: Role): Promise<User | null> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) return null;
    user.role = role;
    return user;
  }
}

/**
 * FAKE: PartyRepository แบบ in-memory
 * ทำให้ ElectionAdminService ใช้งาน repository ได้เหมือนจริงโดยไม่แตะ database
 */
export class InMemoryPartyRepository implements PartyRepository {
  private readonly parties: Party[] = [];
  private nextId = 1;

  async findAll(): Promise<Party[]> {
    return [...this.parties];
  }

  async findById(id: number): Promise<Party | null> {
    return this.parties.find((party) => party.id === id) ?? null;
  }

  async findByName(name: string): Promise<Party | null> {
    return this.parties.find((party) => party.name === name) ?? null;
  }

  async create(party: NewParty): Promise<Party> {
    const created: Party = { ...party, id: this.nextId++ };
    this.parties.push(created);
    return created;
  }
}

/**
 * FAKE: CandidateRepository แบบ in-memory
 * เก็บ candidate ที่ถูกสร้างและคืนค่าตาม district / party ได้อย่างสอดคล้องกัน
 */
export class InMemoryCandidateRepository implements CandidateRepository {
  private readonly candidates: Candidate[] = [];
  private nextId = 1;

  constructor(private readonly parties: PartyRepository) {}

  async findByDistrict(districtId: string): Promise<Candidate[]> {
    return this.candidates.filter((candidate) => candidate.districtId === districtId);
  }

  async findByParty(partyId: number): Promise<Candidate[]> {
    return this.candidates.filter((candidate) => candidate.partyId === partyId);
  }

  async create(candidate: NewCandidate): Promise<Candidate> {
    const party = await this.parties.findById(candidate.partyId);
    const created: Candidate = {
      ...candidate,
      id: this.nextId++,
      partyName: party?.name ?? '',
    };
    this.candidates.push(created);
    return created;
  }
}
