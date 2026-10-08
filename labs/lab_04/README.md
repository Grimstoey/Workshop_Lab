# Lab 04 — Test Data Management

Branch: `jest/lab/04-test-data`

Lab นี้เน้นการจัดการ **Test Data** สำหรับ Test ที่ต้องใช้ Database จริง โดยยึด 3 คำถามหลักจาก Workshop:

1. **Schema มาจากไหน?** → Database Versioning ด้วย Liquibase
2. **ข้อมูลที่ Test ต้องใช้มาจากไหน?** → Test Data Builder + Faker + Creation Method
3. **Test ไม่กวนกันได้อย่างไร?** → Fresh Fixture + Truncate + `runInBand`

เป้าหมายคือทำให้ Integration Test สามารถรันซ้ำได้บนเครื่องใครก็ได้และใน CI โดยไม่ต้องพึ่งข้อมูลที่มีอยู่ใน Database มาก่อน

---

## Part A — Database Versioning ด้วย Liquibase

ระบบใช้ Liquibase เพื่อเก็บ Schema ไว้ใน Git และ Apply การเปลี่ยนแปลงเป็นลำดับผ่าน Changeset

โครงสร้างหลัก:

```text
app/db/changelog/
├── db.changelog-master.yaml
└── changes/
    ├── 001-districts.sql
    ├── 002-users.sql
    ├── 003-parties-candidates.sql
    ├── 004-election-votes.sql
    ├── 900-dev-seed.sql
    └── 901-e2e-seed.sql
```

### หลักที่ใช้

- Schema เปรียบเสมือน Code และต้อง Version Control
- Changeset ที่รันไปแล้วไม่ควรถูกแก้ย้อนหลัง
- ถ้าต้องการเปลี่ยน Schema ให้เพิ่ม Changeset ใหม่
- Liquibase ใช้ `databasechangelog` เก็บประวัติ Changeset
- Checksum ช่วยตรวจจับกรณีแก้ Changeset เก่าที่เคย Apply ไปแล้ว
- `databasechangeloglock` ป้องกัน Migration พร้อมกันหลาย Process

### A1 — Tag → Changeset → Rollback

เริ่ม Test Database:

```bash
cd app
npm run db:up:test
npm run db:migrate:test
```

ตรวจ Changeset:

```bash
docker compose run --rm liquibase status --verbose
```

สร้าง Tag ก่อนทดลอง Schema Change:

```bash
docker compose run --rm liquibase tag --tag=lab04-start
```

จากนั้นทดลองเพิ่ม Changeset ใหม่ตามขั้นตอนของ Workshop แล้ว Apply ด้วย:

```bash
npm run db:migrate:test
```

หลังตรวจผลแล้วสามารถย้อนกลับไปยัง Tag ได้:

```bash
docker compose run --rm liquibase rollback --tag=lab04-start
```

จุดสำคัญของ Exercise นี้คือการเห็นว่า Schema สามารถเดินหน้าและย้อนกลับด้วย Migration ที่อยู่ใน Git ได้ ไม่ต้องแก้ Database ด้วยมือ

### A2 — ทดลองแก้ Changeset เก่า

Workshop ให้ทดลองแก้ Changeset ที่เคย Apply ไปแล้วเพื่อดูพฤติกรรม Checksum ของ Liquibase

ผลที่ต้องสังเกตคือ Liquibase จะไม่ยอม Apply Changeset ที่เนื้อหาถูกแก้ย้อนหลัง เพราะ Checksum ไม่ตรงกับค่าที่บันทึกไว้ใน `databasechangelog`

หลังทดลองต้องคืนไฟล์เดิม ไม่เก็บ Changeset ที่ถูกแก้ผิดไว้ใน Branch

หลักที่นำไปใช้จริงคือ:

> ต้องการเปลี่ยน Schema → เพิ่ม Changeset ใหม่ ไม่แก้ Changeset เก่าที่เคยรันแล้ว

### A3 — Contexts

Seed Data ถูกแยกตาม Environment:

| Environment | Context | ข้อมูล |
|---|---|---|
| Development | `dev` | Schema + Reference Data + Dev Seed |
| Test | `test` | Schema + Reference Data เท่านั้น |
| E2E | `e2e` | Schema + Reference Data + Account สำหรับ E2E |

Integration Test จึงไม่ใช้ `900-dev-seed.sql` เป็น Test Fixture เพราะจะทำให้ Test ผูกกับข้อมูล Shared Fixture และเกิด Mystery Guest

---

# Part B — Test Data Builder + Faker

เพิ่มไฟล์:

```text
app/test/support/
├── builders.ts
├── nationalIds.ts
└── seedFaker.ts
```

## ทำไมไม่เขียนข้อมูล Test แบบเต็มทุกครั้ง

การสร้าง Object เต็มทุก Test ทำให้มองไม่ออกว่าค่าใดสำคัญกับ Scenario เช่น:

```ts
await users.create({
  nationalId: '...',
  passwordHash: '...',
  firstName: '...',
  lastName: '...',
  address: '...',
  districtId: 'CM-2',
});
```

ใน Scenario ที่ต้องการตรวจเพียง District ค่าอื่นเป็น Noise

Builder ทำให้ Test สามารถเขียนเป็น:

```ts
aVoter().inDistrict('CM-2')
```

จึงเห็นทันทีว่า **District คือข้อมูลที่สำคัญต่อ Test นี้**

---

## UserBuilder

`UserBuilder` สร้าง User ที่ Valid โดย Default และเปิดให้ Override เฉพาะข้อมูลที่ Scenario สนใจ

ตัวอย่าง:

```ts
aVoter()
aVoter().inDistrict('CM-2')
aCommissioner()
anAdmin()
```

ข้อมูลที่ไม่สำคัญกับ Test เช่นชื่อ นามสกุล และที่อยู่ จะถูกสร้างด้วย Faker

---

## PartyBuilder และ CandidateBuilder

ตัวอย่าง:

```ts
aParty().named('พรรคแม่ปิง')

aCandidate()
  .inDistrict('CM-2')
  .forParty(party.id)
  .numbered(7)
```

Builder ช่วยลด Duplicate Setup และทำให้ Test อ่านในระดับ Domain มากขึ้น

---

## Faker ต้อง Deterministic

เพิ่ม:

```text
app/test/support/seedFaker.ts
```

ก่อนทุก Test จะกำหนด Seed:

```ts
beforeEach(() => {
  faker.seed(20261003);
  fakerTH.seed(20261003);
});
```

และตั้งใน `jest.config.js` ผ่าน `setupFilesAfterEnv`

เหตุผลคือถ้า Faker สุ่มข้อมูลใหม่ทุกครั้ง เมื่อ Test Fail อาจไม่สามารถสร้างข้อมูลชุดเดิมเพื่อ Debug ได้

เมื่อ Seed คงที่:

```text
Input เดิม + Seed เดิม
        ↓
Faker Data เดิม
        ↓
Reproduce Failure ได้
```

Branch นี้ใช้ `@faker-js/faker@9` ตาม Workshop เนื่องจาก Jest configuration ของโปรเจกต์ทำงานแบบ CommonJS

---

## ข้อมูลสุ่มต้อง Valid ตาม Domain

เลขบัตรประชาชนไม่ได้ใช้เลขสุ่ม 13 หลักตรง ๆ

ไฟล์:

```text
app/test/support/nationalIds.ts
```

สร้าง 12 หลักแรกด้วย Faker แล้วคำนวณหลัก Checksum สุดท้ายตามกฎของระบบ

จึงได้ข้อมูลที่:

- สุ่มจาก Faker
- ทำซ้ำได้จาก Seed
- ผ่าน Validation ของ Domain

มี Unit Test ใน:

```text
app/test/unit/builders.test.ts
```

เพื่อตรวจว่าข้อมูลที่ Builder สร้างมีรูปแบบ Valid

---

# Part C — Creation Method และ Fresh Fixture

เพิ่ม:

```text
app/test/integration/support/given.ts
app/test/integration/elections.test.ts
```

## Creation Method: `givenFor`

Creation Method ซ่อนรายละเอียดการ Insert ผ่าน Repository จริง

ตัวอย่าง:

```ts
const given = givenFor(pool);

const party = await given.party();
const voter = await given.user(
  aVoter().inDistrict('CM-2'),
);
```

แทนที่ Test จะต้องรู้ว่า Repository แต่ละตัวถูก Construct อย่างไร หรือ Field ใดต้องส่งเข้า Database

`givenFor(pool)` รองรับ:

```text
given.user(...)
given.party(...)
given.candidate(...)
given.electionOpenedAt(...)
```

และมี:

```ts
authHeaderFor(tokens, user)
```

เพื่อสร้าง Authorization Header โดยตรงโดยไม่ต้อง Login ผ่าน HTTP ในทุก Test

---

## Fresh Fixture

Integration Test ใช้:

```ts
beforeEach(async () => {
  await truncateAll(pool);
});
```

`truncateAll` ล้างข้อมูลที่ Test สามารถสร้างได้:

```text
votes
candidates
parties
users
election
```

พร้อม:

```sql
RESTART IDENTITY CASCADE
```

ดังนั้น Test แต่ละตัวไม่ต้องอาศัย State จาก Test ก่อนหน้า

Reference Data เช่น Districts และตารางภายในของ Liquibase จะไม่ถูกลบ เพราะมาจาก Migration

---

## Integration Test ที่เพิ่ม

ไฟล์:

```text
app/test/integration/elections.test.ts
```

### 1. ผู้มีสิทธิเห็นเฉพาะผู้สมัครในเขตตัวเอง

Arrange:

```text
Party
├── Candidate #1 → CM-1
└── Candidate #7 → CM-2

Voter → CM-2
```

Act:

```http
GET /me/candidates
```

Expected:

```text
เห็น Candidate #7 เพียงคนเดียว
```

Test นี้ใช้ Builder เพื่อระบุเฉพาะข้อมูลที่สำคัญ:

```ts
aCandidate().inDistrict('CM-2').forParty(party.id).numbered(7)
aVoter().inDistrict('CM-2')
```

---

### 2. ลงคะแนนครั้งแรกหลังเปิดการเลือกตั้ง

Creation Method:

```ts
await given.electionOpenedAt(...)
```

ใช้สร้าง Election State ที่ Test ต้องการโดยตรง

จากนั้น:

```http
PUT /me/vote
```

และตรวจทั้ง HTTP Response และข้อมูลที่ถูกบันทึกในตาราง `votes`

---

### 3. ยืนยัน Fresh Fixture

Test ตรวจว่าก่อนสร้าง User จำนวน User เป็น 0

หลังสร้าง User หนึ่งคน จำนวนเป็น 1

หาก Test ก่อนหน้าทิ้งข้อมูลค้างไว้ Test นี้จะ Fail ทำให้มองเห็น Isolation Problem ได้ทันที

---

# Isolation และ runInBand

Integration Test ทั้งหมดใช้ Database เดียวกัน จึงต้องไม่ให้หลาย Test File Truncate Database พร้อมกัน

Script ของโปรเจกต์ใช้:

```bash
jest --selectProjects integration --runInBand
```

ตรวจความเป็นอิสระของ Test เพิ่มเติมได้ด้วย:

```bash
npx jest --selectProjects integration --runInBand --randomize
```

ถ้า Test ยังผ่านเมื่อสุ่มลำดับ แสดงว่า Test ไม่ควรพึ่งลำดับการรัน

---

# Stretch — Contract Test ของ Fake Repository

เพิ่ม:

```text
app/test/integration/partyRepository.contract.test.ts
```

Fake จาก Lab 03 ต้องมี Behavior ตรงกับ Repository จริง

จึงใช้ Test Scenario เดียวกันกับ:

```text
InMemoryPartyRepository
PgPartyRepository
```

ผ่าน `describe.each`

Behavior ที่ตรวจคือ:

1. สร้าง Party
2. ค้นด้วย ID ได้ Party เดิม
3. ค้นด้วย Name ได้ Party เดิม

ถ้าวันหนึ่ง Fake กับ PostgreSQL Repository มี Behavior ต่างกัน Contract Test จะ Fail

---

# Test Data Smells ที่ Lab นี้ลดลง

## Shared Fixture

ไม่ใช้ Dev Seed ร่วมกันเป็นข้อมูลหลักของ Test

แต่ละ Test สร้างข้อมูลที่ตัวเองต้องใช้

## Mystery Guest

ข้อมูลสำคัญของ Test อยู่ใกล้กับ Test ผ่าน Builder และ `given`

ไม่ต้องเปิด SQL Seed File เพื่อหาว่า "Candidate #7" มาจากไหน

## Interacting Tests

`truncateAll` ทำให้ Test หนึ่งไม่ทิ้ง State ไปกระทบ Test ถัดไป

## Random / Non-reproducible Data

Faker Seed ทำให้ข้อมูล Random สามารถสร้างซ้ำได้

---

# ไฟล์สำคัญที่เพิ่มหรือแก้ใน Branch

```text
app/
├── jest.config.js
├── package.json
├── package-lock.json
└── test/
    ├── support/
    │   ├── builders.ts
    │   ├── nationalIds.ts
    │   └── seedFaker.ts
    ├── unit/
    │   └── builders.test.ts
    └── integration/
        ├── elections.test.ts
        ├── partyRepository.contract.test.ts
        └── support/
            └── given.ts

labs/
└── lab_04/
    └── README.md
```

---

# วิธีรัน

หลังเปลี่ยน Branch ให้ Sync Dependencies ก่อน เพราะ Lab นี้ใช้ Faker 9:

```bash
git switch jest/lab/04-test-data
cd app
npm install
```

## Unit Tests

```bash
npm run test:unit
```

## เตรียม Test Database

ต้องเปิด Docker ก่อน:

```bash
npm run db:up:test
npm run db:migrate:test
```

## Integration Tests

```bash
npm run test:integration
```

## ตรวจ Isolation ด้วย Random Order

```bash
npx jest --selectProjects integration --runInBand --randomize
```

---

# ผลที่คาดหวัง

Test Data ที่ใช้ใน Integration Test ควรมีคุณสมบัติ:

- Test สร้างข้อมูลที่ตัวเองต้องใช้
- ไม่พึ่ง Dev Seed
- Faker Data ทำซ้ำได้
- Faker Data ผ่าน Domain Rule
- Test แต่ละตัวเริ่มจาก Fresh Fixture
- Test สามารถรันสลับลำดับได้
- Fake Repository มี Contract สอดคล้องกับ Repository จริง

---

# สิ่งที่ได้เรียนรู้

Test Data ไม่ควรถูกมองเป็นเพียงข้อมูลประกอบ Test เพราะวิธีสร้างและจัดการข้อมูลมีผลโดยตรงต่อความน่าเชื่อถือของ Test Suite

**Database Versioning** ทำให้ทุก Environment สร้าง Schema จากแหล่งเดียวกันได้

**Test Data Builder** ทำให้ Test เน้นเฉพาะข้อมูลที่สำคัญกับ Scenario โดยซ่อนค่า Default ที่ไม่เกี่ยวข้อง

**Faker** ช่วยสร้างข้อมูลที่หลากหลาย แต่ต้องใช้ Seed เพื่อให้ Reproduce ได้ และข้อมูลที่สุ่มต้องยัง Valid ตาม Business Rule

**Creation Method** ทำให้การสร้างข้อมูลผ่าน Repository จริงถูกซ่อนไว้หลังภาษาที่อ่านเป็น Domain

สุดท้าย **Fresh Fixture + Truncate + runInBand** ทำให้ Integration Test แต่ละตัวเป็นอิสระจากกัน ลดปัญหา Test ที่ผ่านเมื่อรันเดี่ยวแต่ Fail เมื่อรันทั้ง Suite
