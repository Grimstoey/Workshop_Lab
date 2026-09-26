---
marp: true
theme: camt
paginate: true
header: 'Software Testing in Real Industry · CMU CAMT · 3–4 ต.ค. 2026'
footer: '07 · Legacy Code'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Legacy Code

### แก้โค้ดที่ไม่มี test อย่างปลอดภัย

Michael Feathers — *Working Effectively with Legacy Code* (Ch. 2, 4, 6, 13, 25)

<span class="tag">Day 2 · บ่าย</span>

---

<!-- _class: divider -->

# *"Legacy code is simply code without tests."*

— Michael Feathers

<!--
ไม่เกี่ยวกับอายุของโค้ด: โค้ดที่เขียนเมื่อวานโดยไม่มี test ก็เป็น legacy
ถามห้อง: โปรเจกต์ระบบเลือกตั้งของเรา ตอนนี้เป็น legacy code ไหม? (ส่วนใหญ่ใช่ — และไม่ผิด)
-->

---

## Edit and Pray vs Cover and Modify

<div class="cols">
<div class="card">

### 🙏 Edit and Pray

1. อ่านโค้ดให้เข้าใจ (หวังว่าจะเข้าใจ)
2. แก้
3. ลองกดดูในเครื่อง
4. deploy แล้วภาวนา

ยิ่งโค้ดใหญ่ ยิ่งกลัวแก้ → เลยเพิ่ม `if` ซ้อนเข้าไปอีก

</div>
<div class="card">

### 🛡️ Cover and Modify

1. ห่อพฤติกรรมเดิมด้วย test ก่อน
2. แก้ทีละนิด
3. test บอกทันทีถ้าพฤติกรรมเดิมเปลี่ยน
4. ทำซ้ำ

test = **safety net** ที่ทำให้กล้าเปลี่ยนโค้ด

</div>
</div>

---

## Requirement ใหม่

> หลัง กกต. ปิดหีบเขตใดแล้ว ผู้มีสิทธิในเขตนั้น **ลงคะแนนหรือเปลี่ยนคะแนนไม่ได้อีก**
> → `409 { error: 'poll is closed' }`

ต้องแก้ `app/src/routes/voteRoutes.ts` — เขียนรีบ ๆ ก่อน demo และไม่เคยมีใครแตะอีกเลย

```ts
// Voting — written in a hurry before the demo, never refactored.
import jwt from 'jsonwebtoken';
import { pool } from '../db';

router.put('/me/vote', async (req, res) => {
  let user: any;
  try {
    user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET || 'dev-secret');
  } catch (e) {
    return res.status(401).json({ error: 'authentication required' });
  }
  ...
  const election = await pool.query('SELECT opens_at FROM election WHERE id = 1');
  if (election.rows.length == 0 || new Date() < new Date(election.rows[0].opens_at)) {
```

---

## ทำไมมัน test ยาก?

| ปัญหา | ผลต่อ test |
|---|---|
| `import { pool } from '../db'` — **global** | ใส่ test DB ไม่ได้ถ้าไม่แตะ env · pool ไม่ถูกปิด → *"Jest did not exit"* |
| `process.env.JWT_SECRET` อ่านเอง | test ต้องรู้และตั้ง env ให้ตรง |
| `new Date()` ตรง ๆ | ควบคุมเวลาไม่ได้ → ทดสอบ "ก่อนเปิด / หลังปิด" ได้แค่เทียบเวลาจริง |
| logic, SQL, HTTP อยู่ใน handler เดียว | unit test กฎการลงคะแนนแยกไม่ได้ |
| `any`, `==`, truthiness check | พฤติกรรมแปลกที่ไม่มีใครรู้ว่ามี |

**ไม่มี seam เลย** — แต่เราต้องแก้มัน

---

## The Legacy Code Change Algorithm

1. **Identify change points** — ต้องแก้ตรงไหน?
   → `PUT /me/vote` ตรงที่เช็คว่า election เปิดหรือยัง
2. **Find test points** — สังเกตพฤติกรรมได้จากตรงไหน?
   → HTTP response (supertest) + ตาราง `votes` + `console.log`
3. **Break dependencies** — ทำให้โค้ดเข้า test harness ได้
4. **Write tests** — *characterization tests*
5. **Make changes and refactor**

<p class="muted">ข้อ 3 กับ 4 สลับกันได้: บางครั้งต้อง break dependency นิดเดียวก่อนถึงจะเขียน test ได้</p>

---

<!-- _class: dense -->

## Characterization Test

> test ที่บันทึก **พฤติกรรมจริงของระบบตอนนี้** — ไม่ใช่พฤติกรรมที่ *ควรจะเป็น*

วิธีเขียน

1. เขียน test ที่ assert ค่าที่ **ผิดแน่ ๆ**
2. รัน → error message บอกว่า **ระบบตอบอะไรจริง ๆ**
3. แก้ assertion ให้ตรงกับของจริง — แม้จะดูแปลก (จดไว้ ยังไม่แก้)

```ts
it('records a first vote (201, changed: false) and writes an audit log line', async () => {
  await openElection();
  const candidate = await candidateIn('CM-1');
  const voter = await given.user(aVoter().inDistrict('CM-1'));

  const res = await request(app).put('/me/vote').set(as(voter)).send({ candidateId: candidate.id });

  expect(res.status).toBe(201);
  expect(res.body).toEqual({ candidateId: candidate.id, changed: false, votedAt: expect.any(String) });
  expect(log).toHaveBeenCalledWith(expect.stringMatching(`voter ${voter.id} voted for ${candidate.id}`));
});
```

---

## พฤติกรรมแปลก: บันทึกไว้ ยังไม่แก้

```ts
// --- surprising behaviour, recorded as-is (not fixed in this change) ---

it('treats candidateId 0 as missing (400) because of a truthiness check', async () => {
  const res = await request(app).put('/me/vote').set(as(voter)).send({ candidateId: 0 });

  expect(res.status).toBe(400);
});

it('answers 500 for a non-numeric candidateId (the database rejects it)', async () => {
  const res = await request(app).put('/me/vote').set(as(voter)).send({ candidateId: 'abc' });

  expect(res.status).toBe(500);
});
```

- ทำไมไม่แก้เลย? — **อาจมีคนพึ่งพาอยู่** (frontend, mobile, script ของ กกต.)
- แยก PR: *"เปลี่ยนพฤติกรรม"* ≠ *"refactor"* — review ง่ายกว่า, rollback ง่ายกว่า
- test ชื่อชัด = **เอกสาร** ของหนี้ทางเทคนิค

---

## Seam

> *"A seam is a place where you can alter behavior in your program without editing in that place."* — Feathers

ทุก seam มี **enabling point** — จุดที่เราตัดสินใจว่าจะใช้พฤติกรรมไหน

| ชนิด | enabling point | ตัวอย่าง |
|---|---|---|
| **Object seam** | constructor / parameter | `voteRoutes({ pool, tokens, clock })` ← ที่เราจะทำ |
| **Module (link) seam** | module loader | `jest.mock('../../src/db')` |
| **Preprocessing seam** | build / env | `process.env.JWT_SECRET` ← ที่มีอยู่ตอนนี้ |

`jest.mock` ใช้ได้ทันทีไม่ต้องแก้โค้ด — แต่ test จะผูกกับ **โครงสร้างไฟล์** แทนพฤติกรรม
→ ใช้เป็นทางผ่านชั่วคราว, object seam เป็นเป้าหมาย

---

<!-- _class: dense -->

## Parameterize Constructor

<div class="cols">
<div>

**ก่อน**

```ts
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const router = Router();

router.put('/me/vote', async (req, res) => {
  let user: any;
  try {
    user = jwt.verify(...,
      process.env.JWT_SECRET ...);
  } catch (e) { ... }
  ...
  const now = new Date();

export default router;
```

</div>
<div>

**หลัง**

```ts
export interface VoteRouteDeps {
  pool: Pool;
  tokens: TokenService;
  clock: Clock;
}
export function voteRoutes(
  { pool, tokens, clock }: VoteRouteDeps,
) {
  const router = Router();
  router.put('/me/vote',
    authenticate(tokens),
    async (req, res) => {
      const user = principalOf(res);
      ...
      const now = clock.now();
```

</div>
</div>

ทำ **ทีละขั้น** และรัน characterization tests **หลังทุกขั้น**: factory → `authenticate` → `clock` — error message เดิมต้องเหมือนเดิม

---

## Sprout Method / Sprout Class

อย่ายัด logic ใหม่ลงกลาง handler ยาว ๆ — **เขียนโค้ดใหม่เป็นชิ้นแยกที่ test ได้** แล้วเรียกจากโค้ดเก่า **จุดเดียว**

<div class="cols">
<div>

```ts
// src/domain/ballotRules.ts — ใหม่, unit tested
export function whyBallotIsClosed({
  now, electionOpensAt, districtClosedAt,
}: BallotState): string | null {
  if (!electionOpensAt || now < electionOpensAt)
    return 'election is not open';
  if (districtClosedAt) return 'poll is closed';
  return null;
}
```

</div>
<div>

```ts
// voteRoutes.ts — โค้ดเก่า แก้จุดเดียว
const closedReason = whyBallotIsClosed({
  now: clock.now(),
  electionOpensAt: election.rows[0]?.opens_at ?? null,
  districtClosedAt: district.rows[0]?.closed_at ?? null,
});
if (closedReason) {
  return res.status(409).json({ error: closedReason });
}
```

</div>
</div>

กฎทั้งเก่าและใหม่มี unit test เร็ว ๆ แล้ว · handler ยังเป็น legacy — **แต่ไม่แย่ลง**

---

## Wrap และเทคนิคอื่นจากหนังสือ

| เทคนิค | ใช้เมื่อ |
|---|---|
| **Sprout Method / Class** | เพิ่ม logic ใหม่ *ระหว่าง* โค้ดเดิม |
| **Wrap Method / Class** | เพิ่มพฤติกรรม *ก่อน/หลัง* โค้ดเดิม (log, audit, notify) — decorator |
| **Extract Interface** | อยาก inject double แทน class จริง |
| **Parameterize Method** | dependency ถูกสร้างใน method (`new Date()`, `new Pool()`) |
| **Extract and Override Call** | ทางออกชั่วคราวใน class ที่แตะ constructor ไม่ได้ |

> Ch. 25 *Dependency-Breaking Techniques* — มีอีก 20+ แบบ ใช้เป็น catalog

---

<!-- _class: lab -->

## Lab 07 — Legacy Code (~120 นาที)

```bash
git switch jest/lab/07-legacy          # labs/07-legacy/README.md
cd app && npm run test:integration     # ⚠️ รันทั้ง suite — ดู ❓ ในไฟล์ test
```

| Part | ทำอะไร | เวลา |
|---|---|---|
| **A** | `vote.characterization.test.ts` — ตอบ ❓ แล้วเติม `it.todo`<br>ลอง `"abc"`, `0`, `"1"` · `jest.spyOn(console, 'log')` | 35 นาที |
| **B** | Break dependencies: factory `voteRoutes(deps)` → `authenticate(tokens)` → `clock.now()` | 30 นาที |
| **C** | Sprout `ballotRules.ts` + unit test → เรียกจาก handler → test ใหม่: ปิดหีบแล้ว 409 | 25 นาที |

ตอบได้ไหม: ทำไม `legacyPool.end()` ใน `afterAll` ไม่จำเป็นอีกต่อไปหลัง Part B?

<!--
เฉลย: jest/solution/07-legacy (3 commits: characterize → break deps → sprout — ใช้ git log ดูทีละขั้นได้)
คำถามชวนคิดหลัง Part B: โค้ดเดิมใช้ .replace('Bearer ', '') → token ที่ "ไม่มี" คำว่า Bearer นำหน้าก็ผ่าน
แต่ authenticate() บังคับ "Bearer <token>" → พฤติกรรมเปลี่ยนแล้ว แต่ไม่มี characterization test ไหนแดง
บทเรียน: characterization test คุ้มครองได้เฉพาะพฤติกรรมที่เรา "คิดจะสำรวจ" — ถามห้องว่าควรเพิ่ม test นี้ไหม หรือถือเป็น bug fix
-->
