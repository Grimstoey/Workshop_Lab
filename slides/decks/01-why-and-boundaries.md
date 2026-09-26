---
marp: true
theme: camt
paginate: true
header: 'Automated Testing Workshop · CMU CAMT · 3–4 ต.ค. 2026'
footer: '01 · Why & Test Boundaries'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Automated Testing ในงานจริง

### จากระบบเลือกตั้งที่เราเขียนกันมาแล้ว

Workshop 2 วัน · CMU CAMT · 3–4 ตุลาคม 2026

<span class="tag">Day 1 · เช้า</span>

<!--
แนะนำตัว + ถามเร็ว ๆ: ใครเคยเขียน automated test ในงานจริง / ในวิชา / ไม่เคยเลย (ยกมือ)
ใช้คำตอบปรับระดับการอธิบายทั้งวัน
-->

---

## หลังจบ 2 วันนี้ คุณจะ...

1. อธิบายได้ว่า test แต่ละตัวควรอยู่ **boundary** ไหน และทำไม
2. เขียน unit test ที่อ่านแล้วเป็น **spec** และใช้ **test double** ถูกแบบ
3. สร้าง **test environment** ที่รันซ้ำได้: database จาก migration, ข้อมูลจาก builder, แยก test ไม่ให้กวนกัน
4. ให้ **CI** รัน test ชุดเดียวกับที่รันในเครื่อง
5. พัฒนา feature ใหม่แบบ **outside-in** เริ่มจาก acceptance test
6. แก้ **legacy code** อย่างปลอดภัยด้วย characterization tests และ seams
7. นำทั้งหมดไปใช้กับ **โปรเจกต์ระบบเลือกตั้งของตัวเอง**

---

## Agenda

| | เช้า (09:00–12:00) | บ่าย (13:00–16:30) |
|---|---|---|
| **Day 1** | 01 Why & Test Boundaries<br>*Lab 01 · Readiness Checklist รอบ 1* | 02 Arrange / Act / Assert · 03 Test Doubles<br>04 Test Data Management · 05 CI |
| **Day 2** | 06 Outside-In (GOOS)<br>*demo: Playwright browser* | 07 Legacy Code (Feathers)<br>08 โปรเจกต์ของตัวเอง · *Checklist รอบ 2* |

<p class="small muted">พัก 10:30–10:45 · กลางวัน 12:00–13:00 · พัก 14:30–14:45</p>

References ที่ใช้ตลอด 2 วัน

- Toby Clemson (martinfowler.com) — *Testing Strategies in a Microservice Architecture*
- Gerard Meszaros — *xUnit Test Patterns*
- Freeman & Pryce — *Growing Object-Oriented Software, Guided by Tests* (GOOS)
- Michael Feathers — *Working Effectively with Legacy Code*

---

## กติกาในห้อง

<div class="cols">
<div>

### ✅ ทำ

- ทำ lab **เป็นคู่** สลับกันคุมคีย์บอร์ด
- ถามได้ตลอด — ติดเกิน 5 นาที ยกมือ
- ตามไม่ทันไม่เป็นไร → `git stash` แล้วไป lab ถัดไปได้เลย

</div>
<div>

### 🚫 ไม่ใช้ AI ระหว่าง lab

- วันนี้เราฝึก *กล้ามเนื้อ*: อ่าน error, เลือก boundary, ออกแบบ test
- ถ้า AI เขียนให้ เราจะไม่รู้ว่า test นั้น **ผิดตรงไหน**
- ท้าย Day 2 มีช่วงคุยกันเรื่อง *AI-written tests* โดยเฉพาะ

</div>
</div>

---

## Repo ของ workshop

```text
app/          ← ระบบเลือกตั้งอ้างอิง (Express + TypeScript + Postgres + Liquibase)
labs/         ← โจทย์แต่ละ lab
checklist/    ← Readiness Checklist
setup/        ← วิธีเตรียมเครื่อง (npm run doctor)
```

ทุก lab มี 2 branch — lab ถัดไปเริ่มจากเฉลยของ lab ก่อนหน้าเสมอ

```bash
git switch jest/lab/02-aaa-unit        # เริ่ม lab       · jest/solution/02-aaa-unit = เฉลย
cd app
npm run test:unit                      # ไม่ต้องใช้ Docker
npm run test:integration               # Postgres (docker compose) + Liquibase + Jest
npm run test:e2e                       # app container + Playwright
```

---

<!-- _class: divider -->

# Why

ทำไมต้อง automated test?

---

## คืนก่อนประกาศผล...

> มีคนแก้ query นับคะแนนให้เร็วขึ้น เปลี่ยน `JOIN` เป็น `LEFT JOIN`
> ทดสอบมือ: login เป็น กกต. → ปิดหีบ → เปิดหน้าผล → **ตัวเลขขึ้น ดูปกติ** ✅
> deploy

เช้าวันประกาศผล: ผู้สมัครที่ไม่มีใครเลือก **หายไปจากตาราง** — หรือได้ **1 คะแนน** แทน 0

- ต้องทดสอบกี่แบบถึงจะเจอ? เขตที่มีคะแนน 0 · เขตที่ยังไม่ปิด · voter เปลี่ยนคะแนน · 3 roles × 6 เขต × ...
- ทดสอบมือครบทุกแบบทุกครั้งที่แก้โค้ด **ไม่มีใครทำจริง**

<!--
ถามห้อง: ในโปรเจกต์ของคุณ ก่อนส่งงานทดสอบกี่ทาง? ถ้าแก้โค้ดคืนก่อนส่ง ทดสอบใหม่ทั้งหมดไหม?
-->

---

## ราคาของการรู้ว่ามี bug

<svg viewBox="0 0 1100 300" width="100%">
  <defs><marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#5b6475"/></marker></defs>
  <line x1="40" y1="200" x2="1060" y2="200" stroke="#5b6475" stroke-width="3" marker-end="url(#a1)"/>
  <g font-size="22" text-anchor="middle">
    <circle cx="110" cy="200" r="14" fill="#1f7a4d"/><text x="110" y="160" font-weight="700">unit</text><text x="110" y="245">มิลลิวินาที</text>
    <circle cx="300" cy="200" r="14" fill="#1f7a4d"/><text x="300" y="160" font-weight="700">component</text><text x="300" y="245">วินาที</text>
    <circle cx="490" cy="200" r="14" fill="#9a6700"/><text x="490" y="160" font-weight="700">end-to-end</text><text x="490" y="245">นาที</text>
    <circle cx="690" cy="200" r="14" fill="#9a6700"/><text x="690" y="160" font-weight="700">ทดสอบมือ / QA</text><text x="690" y="245">ชั่วโมง – วัน</text>
    <circle cx="900" cy="200" r="14" fill="#b3261e"/><text x="900" y="160" font-weight="700">production</text><text x="900" y="245">ผู้ใช้เจอ · ข่าว</text>
  </g>
  <text x="550" y="60" font-size="24" text-anchor="middle" fill="#7b2d8e">ยิ่งรู้ช้า → แก้แพงขึ้น และหาสาเหตุยากขึ้น</text>
</svg>

Automated test = ย้ายการค้นพบ bug **ไปทางซ้าย** และทำให้มัน **ถูกจนรันได้ทุกครั้งที่ save**

---

## Automated test ให้อะไรเรา

| ได้อะไร | หน้าตาในระบบเลือกตั้ง |
|---|---|
| **Safety net** สำหรับ refactor | แก้ `voteRoutes.ts` ที่ไม่มีใครกล้าแตะ — Day 2 บ่าย |
| **Feedback เร็ว** | รู้ใน 2 วินาทีว่า checksum เลขบัตรพัง ไม่ต้อง login ใหม่ |
| **Executable spec** | `rejects a voter who is not in the candidate's district` |
| **แรงกดดันทาง design** | test ยาก → code ผูกกันแน่นเกินไป (seam หายไป) |
| **ความมั่นใจในการ deploy** | CI เขียว = ทุก test ผ่านบน environment ที่สร้างใหม่ทั้งหมด |

---

## ...และสิ่งที่มัน *ไม่* ให้

- **ไม่พิสูจน์ว่าไม่มี bug** — พิสูจน์แค่ว่ากรณีที่เราเขียนไว้ทำงานตามที่คาด
- **Coverage 100% ≠ test ดี** — test ที่ไม่มี assertion ก็ได้ coverage
- ยังต้องมีการทดสอบแบบอื่น:
  - *Exploratory testing* — คนลองใช้แบบที่ไม่มีใครคิดไว้
  - *Usability* — ผู้สูงอายุหาปุ่มลงคะแนนเจอไหม?
  - *Security* — pentest, dependency audit
  - *Performance / load* — 8 โมงเช้าวันเลือกตั้ง คนเข้าพร้อมกัน 1 ล้านคน

> Lab 01 worksheet มีบางข้อที่ **ไม่ควร** เป็น automated functional test — หาให้เจอ

---

## Test ที่ดีหน้าตาเป็นอย่างไร

<div class="cols">
<div>

**F.I.R.S.T.**

- **F**ast — รันได้ทุกครั้งที่ save
- **I**solated — ไม่ขึ้นกับ test อื่นหรือลำดับ
- **R**epeatable — ผลเหมือนเดิมทุกเครื่อง ทุกเวลา
- **S**elf-validating — ผ่าน/ไม่ผ่าน ไม่ต้องให้คนอ่าน log
- **T**imely — เขียนพร้อมโค้ด ไม่ใช่ "ไว้ค่อยเขียน"

</div>
<div>

**คำถามเดียวที่ใช้ได้ทั้ง workshop**

> ถ้า test นี้แดง
> เรารู้ได้ **แม่นแค่ไหน** ว่าพังเพราะอะไร
> และต้อง **จ่ายเท่าไหร่** (เวลา, ความเปราะ) เพื่อจะรู้?

</div>
</div>

---

<!-- _class: divider -->

# What — Test Boundaries

Toby Clemson · *Testing Strategies in a Microservice Architecture*

---

## ระบบอ้างอิง: ชั้นต่าง ๆ

<svg viewBox="0 0 1100 330" width="100%">
  <defs><marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d2433"/></marker></defs>
  <g font-size="19" text-anchor="middle">
    <rect x="10" y="20" width="170" height="70" rx="8" fill="#f6f7f9" stroke="#1d2433"/><text x="95" y="50">client</text><text x="95" y="75" font-size="15" fill="#5b6475">Playwright / browser</text>
    <rect x="230" y="20" width="170" height="70" rx="8" fill="#f3e9f6" stroke="#7b2d8e"/><text x="315" y="50">routes</text><text x="315" y="75" font-size="15" fill="#5b6475">Express + auth</text>
    <rect x="450" y="20" width="170" height="70" rx="8" fill="#f3e9f6" stroke="#7b2d8e"/><text x="535" y="50">services</text><text x="535" y="75" font-size="15" fill="#5b6475">+ domain rules</text>
    <rect x="670" y="20" width="170" height="70" rx="8" fill="#f3e9f6" stroke="#7b2d8e"/><text x="755" y="50">repositories</text><text x="755" y="75" font-size="15" fill="#5b6475">pg (SQL)</text>
    <rect x="890" y="20" width="170" height="70" rx="8" fill="#f6f7f9" stroke="#1d2433"/><text x="975" y="50">Postgres</text><text x="975" y="75" font-size="15" fill="#5b6475">schema: Liquibase</text>
  </g>
  <g stroke="#1d2433" stroke-width="2" marker-end="url(#a2)">
    <line x1="180" y1="55" x2="228" y2="55"/><line x1="400" y1="55" x2="448" y2="55"/><line x1="620" y1="55" x2="668" y2="55"/><line x1="840" y1="55" x2="888" y2="55"/>
  </g>
  <g font-size="19" font-weight="600">
    <line x1="450" y1="130" x2="620" y2="130" stroke="#1f7a4d" stroke-width="8"/><text x="630" y="137" fill="#1f7a4d">unit</text>
    <line x1="670" y1="175" x2="1060" y2="175" stroke="#2f6fb3" stroke-width="8"/><text x="530" y="182" fill="#2f6fb3">integration</text>
    <line x1="230" y1="220" x2="1060" y2="220" stroke="#9a6700" stroke-width="8"/><text x="10" y="227" fill="#9a6700">component</text>
    <line x1="10" y1="265" x2="1060" y2="265" stroke="#b3261e" stroke-width="8"/>
    <text x="10" y="305" fill="#b3261e">end-to-end — ผ่าน container จริง นอก process ของ test</text>
  </g>
</svg>

Dependency ที่ inject ได้: `TokenService` (JWT), `Clock` (เวลา), repositories — นี่คือจุดที่เราเสียบ test double ได้

---

## Unit test

ทดสอบ logic ชิ้นเล็กที่สุด — **ไม่มี I/O** (ไม่มี DB, network, เวลาจริง)

```ts
it.each(['1509900000017', '1100000000016'])('accepts %s (valid checksum)', (id) => {
  expect(isValidThaiNationalId(id)).toBe(true);
});
```

<div class="cols">
<div class="card">

**Solitary** — collaborator ทุกตัวเป็น test double
`AccountService` + fake repository + dummy `TokenService`

</div>
<div class="card">

**Sociable** — ใช้ collaborator จริงที่ไม่มี I/O
`AccountService` ใช้ `isValidThaiNationalId()` และ `hashPassword()` ตัวจริง

</div>
</div>

แดงแล้วบอกได้ **แม่นที่สุด** · เร็วที่สุด · แต่ไม่รู้เลยว่า SQL ถูกไหม

---

## Integration test

ทดสอบว่า **โค้ดของเราคุยกับของภายนอก** ได้ถูก — เช่น repository ↔ Postgres จริง

```ts
it('finds a created party by id and by name', async () => {
  const parties = new PgPartyRepository(pool);           // Postgres จริง (docker compose)

  const created = await parties.create({ name: 'พรรคแม่ปิง', logoUrl: null, policy: 'แก้ฝุ่น' });

  expect(await parties.findByName('พรรคแม่ปิง')).toEqual(created);
});
```

- จับ bug ที่ unit test มองไม่เห็น: ชื่อ column ผิด, constraint, `NULL`, timezone
- ช้ากว่า unit (ms → สิบ ms) และต้องมี database ที่ **สร้างจาก migration**
- Clemson เรียกส่วนนี้ว่า *gateway* — ทดสอบแค่ขอบ ไม่ทดสอบ business logic ซ้ำ

---

## Component test

ทดสอบ **service ทั้งตัว** ผ่าน interface ภายนอก (HTTP) แต่อยู่ **ใน process เดียวกับ test**

```ts
it('forbids a voter from creating a party (403)', async () => {
  const voter = await given.user(aVoter());

  const res = await request(app).post('/parties').set(as(voter)).send(newParty);   // supertest

  expect(res.status).toBe(403);
});
```

- ทุกชั้นของเราทำงานจริง: routing, middleware, JSON, service, SQL
- สิ่งที่ **ไม่ใช่ของเรา** (payment gateway, SMS, ระบบ ทร. ของจริง) → เป็น double
- ใน repo นี้: `test/integration/*.test.ts` — Jest project `integration`

---

## Contract test

ผู้ใช้ API (**consumer** เช่น frontend, mobile) กับเจ้าของ API (**provider**) ตกลง *รูปร่างข้อมูล* กันไว้

```text
frontend คาดว่า   GET /districts/CM-1/results  →  { closed, candidates: [{ number, partyName, votes? }] }
backend เปลี่ยน   partyName → party_name        →  test ของ backend ยังเขียวหมด แต่หน้าเว็บพัง
```

- *Consumer-driven contract*: consumer เขียนความคาดหวัง → provider รันใน CI ของตัวเอง (เช่น Pact)
- เหมาะเมื่อ **คนละทีม / คนละ repo / deploy แยกกัน**
- workshop นี้พูดถึงเป็น concept — แต่เราจะใช้ความคิดเดียวกันกับ **fake repository** ใน Lab 04

---

## End-to-end test

ทดสอบ **ระบบทั้งหมดเหมือน production** ผ่าน user journey — test อยู่ **นอก process** ของ app

```ts
test('a new voter registers, logs in and sees the candidates of their district', async ({ request }) => {
  const registered = await request.post('/auth/register', { data: { nationalId, ... } });
  expect(registered.status()).toBe(201);                       // → app container → Postgres

  const login = await request.post('/auth/login', { data: { nationalId, password: 'voter1234' } });
  const { token } = await login.json();
  const candidates = await request.get('/me/candidates', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(candidates.ok()).toBeTruthy();
});
```

- เจอปัญหาที่ระดับอื่นไม่เจอ: config, Dockerfile, env ผิด, migration ไม่ได้รัน
- **แพง**: ช้า, setup เยอะ, แดงได้จากหลายสาเหตุ → รู้ว่า "พัง" แต่ไม่รู้ว่า "พังตรงไหน"
- API-level (ไม่มี browser) ถูกกว่า browser test มาก — Day 2 เราใช้แบบนี้เป็นหลัก

---

<!-- _class: dense -->

## เปรียบเทียบ 5 boundaries

| Boundary | ขอบเขต | ความเร็ว | แดงแล้วบอกอะไร | ใน repo นี้ |
|---|---|---|---|---|
| **Unit** | function / class | ms | ตรงจุด — บรรทัดไหน logic ไหน | `test/unit/` |
| **Integration** | โค้ดเรา ↔ DB / HTTP client | 10–100 ms | query / mapping ผิด | `Pg*Repository` + Postgres |
| **Component** | service ทั้งตัว, in-process | 10–100 ms | endpoint ไหนทำงานผิด | `test/integration/` + supertest |
| **Contract** | consumer ↔ provider | ms – s | รูปร่าง API ไม่ตรงที่ตกลง | concept |
| **End-to-end** | ระบบทั้งหมด (container) | s – นาที | journey ไหนพัง (ต้องไปหาต่อ) | `e2e/` + Playwright |

เลือก **boundary ที่ต่ำที่สุดที่ยังให้ความมั่นใจพอ** แล้วถามว่าระดับที่สูงกว่า *ยังจำเป็นไหม*

---

## รูปร่างของ test suite

<svg viewBox="0 0 1100 330" width="100%">
  <g font-size="17" text-anchor="middle" fill="#fff" font-weight="600">
    <!-- pyramid -->
    <rect x="140" y="40" width="80" height="50" fill="#b3261e"/><text x="180" y="72">e2e</text>
    <rect x="100" y="95" width="160" height="50" fill="#9a6700"/><text x="180" y="127">component</text>
    <rect x="60" y="150" width="240" height="50" fill="#2f6fb3"/><text x="180" y="182">integration</text>
    <rect x="20" y="205" width="320" height="50" fill="#1f7a4d"/><text x="180" y="237">unit</text>
    <!-- ice-cream cone -->
    <rect x="390" y="0" width="320" height="35" fill="#8a8f99"/><text x="550" y="24">ทดสอบมือ</text>
    <rect x="400" y="40" width="300" height="50" fill="#b3261e"/><text x="550" y="72">e2e</text>
    <rect x="450" y="95" width="200" height="50" fill="#9a6700"/><text x="550" y="127">component</text>
    <rect x="490" y="150" width="120" height="50" fill="#2f6fb3"/><text x="550" y="182">integ.</text>
    <rect x="520" y="205" width="60" height="50" fill="#1f7a4d"/><text x="550" y="237">unit</text>
    <!-- hourglass -->
    <rect x="780" y="40" width="280" height="50" fill="#b3261e"/><text x="920" y="72">e2e</text>
    <rect x="850" y="95" width="140" height="50" fill="#9a6700"/><text x="920" y="127">component</text>
    <rect x="880" y="150" width="80" height="50" fill="#2f6fb3"/><text x="920" y="182">integ.</text>
    <rect x="780" y="205" width="280" height="50" fill="#1f7a4d"/><text x="920" y="237">unit</text>
  </g>
  <g font-size="22" text-anchor="middle" font-weight="700">
    <text x="180" y="295" fill="#1f7a4d">Pyramid</text>
    <text x="550" y="295" fill="#b3261e">Ice-cream cone</text>
    <text x="920" y="295" fill="#9a6700">Hourglass</text>
  </g>
  <g font-size="16" text-anchor="middle" fill="#5b6475">
    <text x="180" y="320">เร็ว · แดงแล้วรู้ทันทีว่าที่ไหน</text>
    <text x="550" y="320">ช้า · เปราะ · ไม่มีใครอยากรัน</text>
    <text x="920" y="320">logic เยอะ แต่ไม่มีใครทดสอบการต่อสาย</text>
  </g>
</svg>

Pyramid ไม่ใช่กฎ — เป็น **ผลลัพธ์** ของการเลือก boundary ที่ต่ำที่สุดทีละข้อ

---

## ตัวอย่าง: เลือก boundary ทีละข้อ

> **Given** ผู้ใช้กรอกเลขบัตร 13 หลักที่ checksum ผิด **When** สมัครสมาชิก **Then** ได้ 400

| ทางเลือก | ได้อะไร | จ่ายอะไร |
|---|---|---|
| e2e ทุกเลขที่ผิด (20 เคส) | มั่นใจทั้งระบบ | 20 × วินาที, setup container ทุกครั้ง |
| **unit** ทุกเลขที่ผิด (`it.each`) | ครอบคลุม checksum ทุกกรณี | ms |
| **component 1 ตัว**: เลขผิด → 400 | รู้ว่า route เรียก validator จริง | 1 × สิบ ms |

คำตอบ: **unit หลายตัว + component 1 ตัว** — ไม่ต้องมี e2e สำหรับกฎนี้เลย

e2e ไว้สำหรับ **journey ที่สำคัญที่สุด** เช่น "สมัคร → login → ลงคะแนน → กกต. ปิดหีบ → เห็นผล"

---

<!-- _class: lab -->

## Lab 01 — Test Boundaries (~60 นาที · คู่)

```bash
git switch jest/lab/01-boundaries      # โจทย์: labs/01-boundaries/README.md
```

| Part | ทำอะไร | เวลา |
|---|---|---|
| **A** | `worksheet.md` — 16 test cases ของระบบอ้างอิง → boundary ไหน เพราะอะไร | 20 นาที |
| **B** | test cases ที่เตรียมมาของตัวเอง → เพิ่มคอลัมน์ boundary / double / data → วาดรูปร่าง suite | 25 นาที |
| **C** | **Readiness Checklist รอบ 1** (`checklist/README.md`) — เก็บไว้เทียบตอนจบ Day 2 | 15 นาที |

ส่งท้าย: แต่ละคู่เล่า **1 ข้อที่ถกกันนานที่สุด**

<!--
เดินดูตอน Part A — ข้อที่มักเถียงกัน: "voter เปลี่ยนคะแนนได้จนปิดหีบ" (component vs e2e), ข้อที่ไม่ใช่ functional test (load, usability)
เฉลย: jest/solution/01-boundaries → labs/01-boundaries/answer-key.md
-->
