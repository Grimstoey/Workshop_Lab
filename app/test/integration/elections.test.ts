import { Pool } from 'pg';
import request from 'supertest';
import { createApp, pgDeps } from '../../src/app';
import { JwtTokenService } from '../../src/auth/tokenService';
import { aCandidate, aParty, aVoter } from '../support/builders';
import { createTestPool, truncateAll } from './support/database';
import { authHeaderFor, givenFor } from './support/given';

describe('Election test data (component test: app + real Postgres)', () => {
  let pool: Pool;
  let app: ReturnType<typeof createApp>;
  let tokens: JwtTokenService;

  beforeAll(() => {
    pool = createTestPool();
    tokens = new JwtTokenService('test-secret');
    app = createApp(pgDeps(pool, tokens));
  });

  beforeEach(async () => {
    // Fresh Fixture: Test ทุกตัวเริ่มจากข้อมูลที่สะอาดเหมือนกัน
    await truncateAll(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('shows a voter only the candidates of their own district', async () => {
    // Arrange
    const given = givenFor(pool);
    const party = await given.party(aParty().named('พรรคทดสอบ'));

    await given.candidate(
      aCandidate().inDistrict('CM-1').forParty(party.id).numbered(1),
    );
    await given.candidate(
      aCandidate().inDistrict('CM-2').forParty(party.id).numbered(7),
    );
    const voter = await given.user(aVoter().inDistrict('CM-2'));

    // Act
    const response = await request(app)
      .get('/me/candidates')
      .set(authHeaderFor(tokens, voter));

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      number: 7,
      party: 'พรรคทดสอบ',
    });
  });

  it('records a first vote after the election has opened', async () => {
    // Arrange
    const given = givenFor(pool);
    const party = await given.party(aParty().named('พรรคสำหรับลงคะแนน'));
    const candidate = await given.candidate(
      aCandidate().inDistrict('CM-1').forParty(party.id).numbered(3),
    );
    const voter = await given.user(aVoter().inDistrict('CM-1'));
    await given.electionOpenedAt(new Date('2020-01-01T00:00:00Z'));

    // Act
    const response = await request(app)
      .put('/me/vote')
      .set(authHeaderFor(tokens, voter))
      .send({ candidateId: candidate.id });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      candidateId: candidate.id,
      changed: false,
    });

    const saved = await pool.query(
      'SELECT voter_id, candidate_id FROM votes WHERE voter_id = $1',
      [voter.id],
    );
    expect(saved.rows).toEqual([
      { voter_id: voter.id, candidate_id: candidate.id },
    ]);
  });

  it('starts with a fresh fixture for every test', async () => {
    // Arrange
    const given = givenFor(pool);
    const before = await pool.query('SELECT COUNT(*)::int AS count FROM users');

    // Act
    await given.user(aVoter());
    const after = await pool.query('SELECT COUNT(*)::int AS count FROM users');

    // Assert
    expect(before.rows[0].count).toBe(0);
    expect(after.rows[0].count).toBe(1);
  });
});
