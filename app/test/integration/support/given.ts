import { Pool } from 'pg';
import { TokenService } from '../../../src/auth/tokenService';
import { Candidate, Party, User } from '../../../src/domain/types';
import { PgCandidateRepository } from '../../../src/repositories/candidateRepository';
import { PgPartyRepository } from '../../../src/repositories/partyRepository';
import { PgUserRepository } from '../../../src/repositories/userRepository';
import {
  aCandidate,
  aParty,
  aVoter,
  CandidateBuilder,
  PartyBuilder,
  UserBuilder,
} from '../../support/builders';

/**
 * Creation Methods สำหรับ Integration Test
 *
 * จุดประสงค์คือซ่อนรายละเอียดการ Insert และให้ Test อ่านเป็นภาษาของ Domain
 * เช่น given.user(aVoter().inDistrict('CM-2'))
 */
export function givenFor(pool: Pool) {
  const users = new PgUserRepository(pool);
  const parties = new PgPartyRepository(pool);
  const candidates = new PgCandidateRepository(pool);

  return {
    async user(builder: UserBuilder = aVoter()): Promise<User> {
      const spec = builder.build();
      const created = await users.create({
        nationalId: spec.nationalId,
        passwordHash: spec.passwordHash,
        firstName: spec.firstName,
        lastName: spec.lastName,
        address: spec.address,
        districtId: spec.districtId,
      });

      if (spec.role !== 'VOTER') {
        return (await users.updateRole(created.id, spec.role))!;
      }
      return created;
    },

    async party(builder: PartyBuilder = aParty()): Promise<Party> {
      return parties.create(builder.build());
    },

    async candidate(builder: CandidateBuilder = aCandidate()): Promise<Candidate> {
      return candidates.create(builder.build());
    },

    async electionOpenedAt(opensAt: Date): Promise<void> {
      await pool.query(
        `INSERT INTO election (id, opens_at)
         VALUES (1, $1)
         ON CONFLICT (id) DO UPDATE SET opens_at = EXCLUDED.opens_at`,
        [opensAt],
      );
    },
  };
}

export function authHeaderFor(tokens: TokenService, user: User): { Authorization: string } {
  const token = tokens.issue({
    userId: user.id,
    role: user.role,
    districtId: user.districtId,
  });
  return { Authorization: `Bearer ${token}` };
}
