import { fakerTH } from '@faker-js/faker';
import { Role } from '../../src/domain/types';
import { hashPassword } from '../../src/auth/passwords';
import { aValidNationalId } from './nationalIds';

const DEFAULT_PASSWORD = 'voter1234';
const DEFAULT_PASSWORD_HASH = hashPassword(DEFAULT_PASSWORD);

export interface UserSpec {
  nationalId: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  address: string;
  districtId: string;
  role: Role;
}

export interface PartySpec {
  name: string;
  logoUrl: string | null;
  policy: string;
}

export interface CandidateSpec {
  districtId: string;
  partyId: number;
  number: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

export class UserBuilder {
  private spec: UserSpec;

  constructor(role: Role) {
    this.spec = {
      nationalId: aValidNationalId(),
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: fakerTH.person.firstName(),
      lastName: fakerTH.person.lastName(),
      address: fakerTH.location.streetAddress(),
      districtId: 'CM-1',
      role,
    };
  }

  withNationalId(nationalId: string): this {
    this.spec.nationalId = nationalId;
    return this;
  }

  inDistrict(districtId: string): this {
    this.spec.districtId = districtId;
    return this;
  }

  withPasswordHash(passwordHash: string): this {
    this.spec.passwordHash = passwordHash;
    return this;
  }

  build(): UserSpec {
    return { ...this.spec };
  }
}

export class PartyBuilder {
  private spec: PartySpec = {
    name: `พรรค${fakerTH.company.name()}`,
    logoUrl: null,
    policy: fakerTH.lorem.sentence(),
  };

  named(name: string): this {
    this.spec.name = name;
    return this;
  }

  withPolicy(policy: string): this {
    this.spec.policy = policy;
    return this;
  }

  build(): PartySpec {
    return { ...this.spec };
  }
}

export class CandidateBuilder {
  private spec: CandidateSpec = {
    districtId: 'CM-1',
    partyId: 1,
    number: 1,
    firstName: fakerTH.person.firstName(),
    lastName: fakerTH.person.lastName(),
    photoUrl: null,
  };

  inDistrict(districtId: string): this {
    this.spec.districtId = districtId;
    return this;
  }

  forParty(partyId: number): this {
    this.spec.partyId = partyId;
    return this;
  }

  numbered(number: number): this {
    this.spec.number = number;
    return this;
  }

  build(): CandidateSpec {
    return { ...this.spec };
  }
}

export function aVoter(): UserBuilder {
  return new UserBuilder('VOTER');
}

export function aCommissioner(): UserBuilder {
  return new UserBuilder('COMMISSIONER');
}

export function anAdmin(): UserBuilder {
  return new UserBuilder('ADMIN');
}

export function aParty(): PartyBuilder {
  return new PartyBuilder();
}

export function aCandidate(): CandidateBuilder {
  return new CandidateBuilder();
}

export { DEFAULT_PASSWORD };
