---
marp: true
theme: camt
paginate: true
header: 'Software Testing in Real Industry · CMU CAMT · 3–4 ต.ค. 2026'
footer: '03 · Test Doubles'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Test Doubles

### Dummy · Stub · Spy · Mock · Fake

Gerard Meszaros — *xUnit Test Patterns*: Test Double

<span class="tag">Day 1 · บ่าย</span>

---

## ปัญหา: SUT ไม่ได้อยู่คนเดียว

```ts
export class AccountService {
  constructor(
    private readonly users: UserRepository,          // → Postgres
    private readonly districts: DistrictRepository,  // → Postgres
    private readonly tokens: TokenService,           // → JWT + secret + เวลา
  ) {}
```

อยาก unit test `register()` และ `login()` แต่...

- ไม่อยากเปิด database — ช้า, ต้องล้างข้อมูล, แดงเพราะ Docker ไม่ได้เปิด
- อยากบังคับกรณียาก ๆ — *"เขตนี้ไม่มีอยู่จริง"*, *"เลขบัตรนี้สมัครไปแล้ว"*
- อยากรู้ว่า SUT **ส่งอะไรออกไป** — hash รหัสผ่านก่อนบันทึกหรือเปล่า?

---

## Seam: constructor injection

<div class="cols">
<div>

```ts
// production (src/app.ts)
new AccountService(
  new PgUserRepository(pool),
  new PgDistrictRepository(pool),
  new JwtTokenService(secret),
);
```

</div>
<div>

```ts
// unit test
new AccountService(
  new InMemoryUserRepository(),  // fake
  stubDistricts(true),           // stub
  dummyTokens,                   // dummy
);
```

</div>
</div>

SUT พึ่ง **interface** ไม่ใช่ class จริง → เราเลือกได้ว่าจะเสียบอะไรเข้าไป

**DOC** = *Depended-On Component* — สิ่งที่ SUT เรียกใช้ และเราอยากแทนด้วย double

---

## Input และ output "ทางอ้อม"

<svg viewBox="0 0 1100 280" width="100%">
  <defs><marker id="a3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d2433"/></marker></defs>
  <g font-size="20" text-anchor="middle">
    <rect x="20" y="95" width="170" height="80" rx="8" fill="#f6f7f9" stroke="#1d2433"/><text x="105" y="142">Test</text>
    <rect x="420" y="80" width="230" height="110" rx="8" fill="#f3e9f6" stroke="#7b2d8e" stroke-width="2"/><text x="535" y="130" font-weight="700">SUT</text><text x="535" y="160" font-size="16" fill="#5b6475">AccountService</text>
    <rect x="870" y="80" width="210" height="110" rx="8" fill="#f6f7f9" stroke="#1d2433"/><text x="975" y="130" font-weight="700">DOC</text><text x="975" y="160" font-size="16" fill="#5b6475">repository / tokens</text>
  </g>
  <g stroke="#1d2433" stroke-width="2" marker-end="url(#a3)">
    <line x1="190" y1="115" x2="418" y2="115"/>
    <line x1="418" y1="160" x2="192" y2="160"/>
    <line x1="650" y1="110" x2="868" y2="110"/>
    <line x1="868" y1="165" x2="652" y2="165"/>
  </g>
  <g font-size="17">
    <text x="210" y="100">input ตรง (arguments)</text>
    <text x="210" y="190">output ตรง (return / throw)</text>
    <text x="670" y="95" fill="#7b2d8e" font-weight="600">output ทางอ้อม → Spy / Mock</text>
    <text x="670" y="195" fill="#1f7a4d" font-weight="600">input ทางอ้อม ← Stub</text>
  </g>
  <text x="550" y="250" font-size="18" text-anchor="middle" fill="#5b6475">test มองเห็นแค่เส้นซ้าย — double ทำให้เห็นและควบคุมเส้นขวาได้</text>
</svg>

---

## 5 แบบ แยกตาม "ใช้ทำอะไร"

| Double | หน้าที่ | ในระบบเลือกตั้ง |
|---|---|---|
| **Dummy** | ต้องส่งให้ครบ แต่ **ไม่ถูกใช้** | `TokenService` ตอนทดสอบ `register()` |
| **Stub** | ป้อน **input ทางอ้อม** ที่เราควบคุม | `findById` คืนเขต CM-1 (หรือ `null`) |
| **Spy** | บันทึก **output ทางอ้อม** ไว้ตรวจทีหลัง | `users.create` ได้รับ `passwordHash` อะไร |
| **Mock** | ถูกตั้ง **expectation** ว่าต้องถูกเรียกอย่างไร | `tokens.issue` ต้องได้ principal ที่ถูกต้อง |
| **Fake** | implementation จริงที่ **ง่ายกว่า** (ไม่มี I/O) | `InMemoryUserRepository` |

`jest.fn()` เป็นได้ทั้ง stub, spy, mock — **ชื่อขึ้นกับว่าเราใช้มันทำอะไร** ไม่ใช่เครื่องมือ

---

## Dummy — ส่งให้ครบ แต่ต้องไม่ถูกใช้

```ts
// DUMMY: register() never touches tokens; it fails loudly if that ever changes.
const dummyTokens: TokenService = {
  issue: () => { throw new Error('dummy TokenService should not be used'); },
  verify: () => { throw new Error('dummy TokenService should not be used'); },
};
```

- `AccountService` ต้องการ `TokenService` ใน constructor แต่ `register()` ไม่ได้ใช้
- dummy ที่ดี **พังเสียงดัง** ถ้าถูกเรียก → ถ้าวันหนึ่ง `register()` เริ่มออก token เราจะรู้ทันที
- `null as any` ก็ใช้ได้ — แต่ error ที่ได้จะเป็น *"Cannot read properties of null"* ซึ่งบอกอะไรน้อยกว่า

---

## Stub — ป้อน input ทางอ้อม

```ts
// STUB: feeds the indirect input "does this district exist?"
function stubDistricts(existing: boolean): DistrictRepository {
  const cm1 = { id: 'CM-1', province: 'เชียงใหม่', number: 1 };
  return {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(existing ? cm1 : null),
  };
}

it('rejects an unknown district', async () => {
  const accounts = new AccountService(new InMemoryUserRepository(), stubDistricts(false), dummyTokens);

  const result = accounts.register(registration);

  await expect(result).rejects.toThrow(new ValidationError('unknown district'));
});
```

---

## Spy — ตรวจสิ่งที่ SUT ส่งออกไป

```ts
it('stores a hash, never the plain-text password, and trims names', async () => {
  const users = new InMemoryUserRepository();
  const create = jest.spyOn(users, 'create');        // SPY: records the indirect output
  const accounts = new AccountService(users, stubDistricts(true), dummyTokens);

  await accounts.register(registration);

  const saved = create.mock.calls[0][0];
  expect(saved.passwordHash).not.toContain('voter1234');
  expect(verifyPassword('voter1234', saved.passwordHash)).toBe(true);
  expect(saved.firstName).toBe('สมชาย');
});
```

`jest.spyOn` ห่อ method ของ object จริง — **ยังทำงานเหมือนเดิม** แต่จดทุกการเรียกไว้

---

<!-- _class: dense -->

## Mock — ตั้ง expectation กับการเรียก

```ts
it('issues a token for the user', async () => {
  // MOCK: we set an expectation on how issue() must be called
  const tokens = { issue: jest.fn().mockReturnValue('token-123'), verify: jest.fn() };
  const { accounts, voter } = await accountsWithRegisteredVoter(tokens);

  const token = await accounts.login('1509900000017', 'voter1234');

  expect(token).toBe('token-123');
  expect(tokens.issue).toHaveBeenCalledWith({ userId: voter.id, role: 'VOTER', districtId: 'CM-1' });
});

it('rejects a wrong password without issuing a token', async () => {
  const tokens = { issue: jest.fn(), verify: jest.fn() };
  ...
  expect(tokens.issue).not.toHaveBeenCalled();
});
```

ตรวจ **การสื่อสาร** ระหว่าง object — ไม่ใช่ state

---

<!-- _class: dense -->

## Fake — ของจริงฉบับย่อ

```ts
export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[] = [];
  private nextId = 1;

  async findByNationalId(nationalId: string): Promise<User | null> {
    return this.users.find((u) => u.nationalId === nationalId) ?? null;
  }

  async create(user: NewUser): Promise<User> {
    const created: User = { ...user, id: this.nextId++, role: 'VOTER' };
    this.users.push(created);
    return created;
  }
  ...
```

- เหมาะเมื่อ SUT **เรียกซ้ำหลายครั้ง** และผลต้องสอดคล้องกัน (สมัคร → สมัครซ้ำ → 409)
- stub ด้วย `jest.fn()` สำหรับกรณีนี้จะยาวและเปราะ
- ⚠️ **fake โกหกได้** — ถ้า Postgres เรียงตามหมายเลขแต่ fake ไม่เรียง → Lab 04: *contract test*

---

## เวลาเป็น dependency

<div class="cols">
<div>

**Inject `Clock`** — โค้ดของเรา

```ts
export interface Clock {
  now(): Date;
}

const FIVE_PM = new Date('2026-10-04T17:00:00+07:00');
const clock: Clock = { now: () => FIVE_PM };

new PollService(districts, candidates,
                votes, clock);
```

ชัดเจน, ไม่มีผลข้างเคียงต่อ test อื่น

</div>
<div>

**Fake timers** — library ที่เราแก้ไม่ได้

```ts
jest.useFakeTimers({
  now: new Date('2026-10-03T09:00:00+07:00'),
});
const tokens = new JwtTokenService('secret', 60);
const token = tokens.issue(voter);

jest.setSystemTime(
  new Date('2026-10-03T09:01:01+07:00'));
expect(tokens.verify(token)).toBeNull();
// afterEach → jest.useRealTimers()
```

`jsonwebtoken` อ่าน `Date.now()` เอง

</div>
</div>

---

## ใช้ double ให้ถูกระดับ

- **Fragile test** — mock ตรวจละเอียดทุกการเรียก → refactor โดยพฤติกรรมเดิมก็แดง
  → assert **ผลลัพธ์** ก่อน, ใช้ mock เฉพาะเมื่อ *การเรียก* คือพฤติกรรมที่สำคัญ
- **อย่า mock สิ่งที่เราไม่ได้เป็นเจ้าของ** (GOOS)
  mock `pg.Pool.query` = ผูก test กับ SQL string → ไม่รู้ว่า SQL ถูกไหม
  → mock ที่ **repository interface ของเรา** และทดสอบ repository กับ Postgres จริงแยก
- **Mock roles, not objects** — interface ตั้งชื่อตาม *หน้าที่ที่ SUT ต้องการ* (`TokenService`) ไม่ใช่ตาม library (`Jwt`)

> *Classical* (ใช้ของจริงเมื่อทำได้) vs *Mockist* (double ทุก collaborator) — Fowler, *Mocks Aren't Stubs*
> workshop นี้: **classical เป็นค่าเริ่มต้น** · mock ที่ boundary ที่เราออกแบบเอง

---

<!-- _class: lab -->

## Lab 03 — Test Doubles (~60 นาที)

```bash
git switch jest/lab/03-test-doubles    # labs/03-test-doubles/README.md
cd app && npx jest --selectProjects unit --watch
```

| Part | ทำอะไร | เวลา |
|---|---|---|
| **A** | `accountService.test.ts` — เปลี่ยน `it.todo` เป็น test จริง<br>comment ทุก double: **แบบไหน** และ **ทำไม** | 25 นาที |
| **B** | สร้าง `test/support/inMemoryRepositories.ts` → ใช้ใน `electionAdminService.test.ts` | 20 นาที |
| **C** | `jwtTokenService.test.ts` — token หมดอายุด้วย fake timers | 15 นาที |

เลขบัตรที่ checksum ถูก: `1509900000017` · `1100000000016` · `1100000000024`

<!--
เฉลย: jest/solution/03-test-doubles
คำถามปิด lab: mock ตัวไหนที่เปราะ? ทำไมไม่ mock pg.Pool?
-->
