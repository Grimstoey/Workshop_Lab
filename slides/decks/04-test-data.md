---
marp: true
theme: camt
paginate: true
header: 'Automated Testing Workshop · CMU CAMT · 3–4 ต.ค. 2026'
footer: '04 · Test Data Management'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Test Data Management

### Database versioning · Builders + faker · Isolation

xUnit Test Patterns — *Fresh Fixture, Shared Fixture, Test Data Builder, Creation Method* · Liquibase

<span class="tag">Day 1 · บ่าย</span>

---

## 3 คำถามของทุก test ที่แตะ database

1. **Schema มาจากไหน?**
   → Database versioning (Liquibase)
2. **ข้อมูลที่ test ต้องใช้มาจากไหน?**
   → Test Data Builders + faker + creation methods
3. **Test ไม่กวนกันได้อย่างไร?**
   → Fresh fixture, truncate, runInBand

> ถ้าตอบ 3 ข้อนี้ไม่ได้ test จะ *"ผ่านในเครื่องผม"* แต่แดงในเครื่องเพื่อนและใน CI

---

<!-- _class: divider -->

# Database Versioning

Schema คือโค้ด

---

## Anti-patterns ที่เจอบ่อย

- 📎 `schema.sql` ล่าสุดส่งใน LINE กลุ่ม — *"ใช้ไฟล์ของวันพฤหัสนะ ไม่ใช่วันพุธ"*
- 🖱️ เพิ่ม column ผ่าน pgAdmin แล้วลืมบอกทีม
- 💾 `pg_dump` จากเครื่องใครสักคน = database ของ test
- 🤷 production กับ dev มี column ไม่เหมือนกัน — ไม่มีใครรู้ตั้งแต่เมื่อไหร่

**สิ่งที่ต้องการ**

- schema อยู่ใน **git** คู่กับโค้ดที่ใช้มัน
- เปลี่ยนทีละ **changeset** ที่มีลำดับ และ apply **แบบเดียวกันทุก environment**
- รู้ว่า database แต่ละตัว **อยู่ version ไหน**
- test database **สร้างใหม่จากศูนย์** ได้ทุกครั้งด้วยคำสั่งเดียว

---

## Liquibase: formatted SQL

```sql
--liquibase formatted sql

--changeset election:002-create-users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    national_id   CHAR(13) NOT NULL UNIQUE,
    ...
    district_id   TEXT     NOT NULL REFERENCES districts (id),
    role          TEXT     NOT NULL DEFAULT 'VOTER'
                  CHECK (role IN ('VOTER', 'COMMISSIONER', 'ADMIN'))
);
--rollback DROP TABLE users;
```

- `db.changelog-master.yaml` → `includeAll: changes/` (เรียงตามชื่อไฟล์ `001-`, `002-`, ...)
- **changeset id** = `author:id` — ห้ามซ้ำ, ห้ามแก้หลังรันไปแล้ว
- `--rollback` บอกวิธีถอยกลับ — Lab 05 จะให้ CI ตรวจว่าถอยได้จริง

---

## Liquibase จำอะไรไว้

```text
election_test=# SELECT id, filename, md5sum, contexts FROM databasechangelog ORDER BY orderexecuted;

               id                |          filename           |   md5sum    | contexts
---------------------------------+-----------------------------+-------------+----------
 001-create-districts            | changes/001-districts.sql   | 9:1b2c...   |
 002-create-users                | changes/002-users.sql       | 9:7ad0...   |
 ...
```

- รันเฉพาะ changeset ที่ **ยังไม่อยู่ในตาราง** → `update` รันซ้ำได้ปลอดภัย
- **checksum**: แก้ changeset ที่รันไปแล้ว → Liquibase **ปฏิเสธ** (Lab 04 · A2)
  ต้องการเปลี่ยน schema? → เขียน **changeset ใหม่** เสมอ
- `databasechangeloglock` กันสองคน migrate พร้อมกัน

---

## Contexts: ข้อมูล seed ไม่ใช่ข้อมูล test

```sql
--changeset election:900-seed-dev-users context:dev
INSERT INTO users (...) VALUES ('1100000000016', ..., 'ADMIN'), ...
```

| Environment | `LIQUIBASE_COMMAND_CONTEXTS` | ได้อะไร |
|---|---|---|
| `db` (dev, 5432) | `dev` | schema + เขต + ผู้ใช้/พรรคตัวอย่าง |
| `db-test` (5433, tmpfs) | `test` | schema + เขต (reference data) **เท่านั้น** |
| `db-e2e` (5434, tmpfs) | `e2e` | schema + เขต + admin / กกต. สำหรับ login |

changeset ที่ **ไม่มี** context (schema, เขต) รันทุก environment

---

## คำสั่งเดียวกันทุกที่

```bash
npm run db:up:test          # docker compose up -d --wait db-test
npm run db:migrate:test     # docker compose run --rm --build liquibase update
```

```text
┌───────────────┐   update   ┌──────────────────────┐
│ liquibase     │ ─────────▶ │ db-test (Postgres 17) │   tmpfs = restart แล้วว่างเปล่า
│ (Docker image │            └──────────────────────┘
│  + changelog) │
└───────────────┘
```

- ไม่ต้องติดตั้ง Java / Liquibase ในเครื่อง — image เดียวกันทั้ง laptop และ CI
- changelog ถูก `COPY` เข้า image → ไม่มี bind mount → ทำงานบน GitLab dind ได้

```bash
docker compose run --rm liquibase status --verbose     # อะไรยังไม่ได้รัน
docker compose run --rm liquibase tag --tag=lab04-start
docker compose run --rm liquibase rollback --tag=lab04-start
```

---

<!-- _class: divider -->

# Test Data

Fresh Fixture · Builders · faker

---

## Shared Fixture: ง่ายตอนแรก เจ็บทีหลัง

ถ้าทุก test ใช้ `900-dev-seed.sql` ร่วมกัน...

- test A เปลี่ยน vote ของ "สมชาย" → test B ที่นับคะแนน **พังเฉพาะตอนรันต่อจาก A**
- มีคนเพิ่มผู้สมัครใน seed → test 12 ตัวที่นับจำนวนผู้สมัคร **พังพร้อมกัน**
- อ่าน test แล้วไม่รู้ว่า "ผู้สมัครหมายเลข 2" มาจากไหน → **Mystery Guest**

**Fresh Fixture** — ทุก test สร้างข้อมูลที่ตัวเองต้องใช้ *ใน test นั้นเอง*

แต่ถ้าต้องเขียน object เต็ม ๆ ทุกครั้ง...

```ts
// ❌ ค่าไหนสำคัญกับ test นี้?
await users.create({ nationalId: '1509900000017', passwordHash: '...', firstName: 'สมชาย',
                     lastName: 'ใจดี', address: '...', districtId: 'CM-2' });
```

---

<!-- _class: dense -->

## Test Data Builder

```ts
export class UserBuilder {
  private spec: UserSpec;

  constructor(role: Role) {
    this.spec = {
      nationalId: aValidNationalId(),                 // checksum ถูกเสมอ
      passwordHash: DEFAULT_PASSWORD_HASH,            // scrypt ช้า → hash ครั้งเดียว
      firstName: fakerTH.person.firstName(),
      lastName: fakerTH.person.lastName(),
      address: fakerTH.location.streetAddress(),
      districtId: 'CM-1',
      role,
    };
  }

  inDistrict(districtId: string): this { this.spec.districtId = districtId; return this; }
  build(): UserSpec { return { ...this.spec }; }
}
```

```ts
const voter = await given.user(aVoter().inDistrict('CM-2'));   // ✅ บอกเฉพาะสิ่งที่สำคัญกับ test นี้
```

---

## faker ต้อง deterministic

ข้อมูลสุ่มทำให้ test แดงแบบ **ทำซ้ำไม่ได้** → seed ก่อนทุก test

```ts
// test/support/seedFaker.ts  (setupFilesAfterEnv)
beforeEach(() => {
  faker.seed(20261003);
  fakerTH.seed(20261003);
});
```

ข้อมูลสุ่มต้อง **valid ตามกฎของ domain** — ไม่งั้นแดงเพราะข้อมูลไม่ใช่เพราะโค้ด

```ts
export function aValidNationalId(): string {
  const base = faker.string.numeric({ length: 12, allowLeadingZeros: false });
  const sum = [...base].reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
  return base + ((11 - (sum % 11)) % 10);
}
```

<p class="small muted">หมายเหตุ: ใช้ <code>@faker-js/faker@9</code> — v10 เป็น ESM-only ใช้กับ Jest (CommonJS) ไม่ได้</p>

---

<!-- _class: dense -->

## Creation Method: `given`

```ts
export function givenFor(pool: Pool) {           // insert builder output ผ่าน repository จริง
  return {
    async user(builder: UserBuilder = aVoter()): Promise<User> { ... },
    async party(builder: PartyBuilder = aParty()): Promise<Party> { ... },
    async candidate(builder: CandidateBuilder): Promise<Candidate> { ... },
    async electionOpenedAt(opensAt: Date): Promise<void> { ... },
  };
}
export function authHeaderFor(tokens: TokenService, user: User) { ... }   // ข้ามการ login
```

```ts
it('shows a voter only the candidates of their own district', async () => {
  const party = await given.party();
  await given.candidate(aCandidate().inDistrict('CM-1').forParty(party.id).numbered(1));
  await given.candidate(aCandidate().inDistrict('CM-2').forParty(party.id).numbered(7));
  const voter = await given.user(aVoter().inDistrict('CM-2'));

  const res = await request(app).get('/me/candidates').set(as(voter));

  expect(res.body).toHaveLength(1);
```

---

<!-- _class: divider -->

# Isolation

Test ไม่กวนกัน

---

## Fresh database ทุก test

```ts
beforeEach(async () => {
  await truncateAll(pool);
});

// Reference data (districts) and Liquibase's own tables stay — they come from the migrations.
export async function truncateAll(pool: Pool) {
  await pool.query('TRUNCATE votes, candidates, parties, users, election RESTART IDENTITY CASCADE');
}
```

```js
// jest.config.js — two projects = two boundaries
{ displayName: 'unit',        testMatch: ['<rootDir>/test/unit/**/*.test.ts'] },          // parallel
{ displayName: 'integration', testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
  setupFiles: ['<rootDir>/test/integration/env.ts'] },                                    // --runInBand
```

ตรวจ isolation: `npx jest --selectProjects integration --runInBand --randomize`

---

## ทางเลือกอื่นของ isolation

| วิธี | ข้อดี | ข้อเสีย |
|---|---|---|
| **truncate + runInBand** (ที่เราใช้) | ง่าย, เห็นข้อมูลจริงใน DB ได้ | test ไฟล์ integration รันทีละไฟล์ |
| transaction ต่อ test แล้ว rollback | เร็วมาก | ใช้ยากเมื่อ request ผ่าน HTTP / pool หลาย connection |
| database / schema ต่อ Jest worker | ขนานได้ | setup ซับซ้อนขึ้น |
| **Testcontainers** — container ต่อ test run | ไม่ต้องมี compose, ใช้ได้ทุกเครื่องที่มี Docker | เปิดช้ากว่า, ต้องตั้ง `DOCKER_HOST` บน OrbStack/Colima |

⚠️ **reference data ที่ถูกแก้ก็รั่วได้** — Lab 06 เพิ่ม `districts.closed_at`
→ `truncateAll` ต้อง `UPDATE districts SET closed_at = NULL` ด้วย

<!--
Demo Testcontainers ตรงนี้ (~10 นาที): git switch demo/testcontainers → labs/demo-testcontainers.md
-->

---

## Contract test สำหรับ fake

fake ใน Lab 03 ต้องทำงานเหมือนของจริง — พิสูจน์ด้วย **test ชุดเดียว รันกับทั้งสองตัว**

```ts
describe.each([
  ['InMemoryPartyRepository', async () => new InMemoryPartyRepository()],
  ['PgPartyRepository', async () => { await truncateAll(pool); return new PgPartyRepository(pool); }],
])('%s', (_name, makeRepository) => {
  let parties: PartyRepository;
  beforeEach(async () => { parties = await makeRepository(); });

  it('finds a created party by id and by name', async () => {
    const created = await parties.create({ name: 'พรรคแม่ปิง', logoUrl: null, policy: 'แก้ฝุ่น' });

    expect(await parties.findById(created.id)).toEqual(created);
    expect(await parties.findByName('พรรคแม่ปิง')).toEqual(created);
  });
});
```

fake drift จากของจริงเมื่อไหร่ → แดงทันที

---

<!-- _class: lab -->

## Lab 04 — Test Data (~75 นาที)

```bash
git switch jest/lab/04-test-data       # labs/04-test-data/README.md
cd app && npm run db:up:test && npm run db:migrate:test
```

| Part | ทำอะไร | เวลา |
|---|---|---|
| **A** | Liquibase: A1 tag → changeset 005 → rollback · A2 แก้ changeset เก่า · A3 contexts | 20 นาที |
| **B** | `test/support/builders.ts` + `nationalIds.ts` + `seedFaker.ts` | 25 นาที |
| **C** | `test/integration/support/given.ts` → เติม `elections.test.ts` ให้ครบ · `--randomize` | 30 นาที |
| Stretch | contract test: `describe.each` กับ fake และ Pg | — |

<!--
เฉลย: jest/solution/04-test-data
จุดที่คนติด: ลืมใส่ setupFilesAfterEnv, builder ที่ hash password ทุกครั้ง (ช้า), ลืม RESTART IDENTITY
-->
