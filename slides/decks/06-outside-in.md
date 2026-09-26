---
marp: true
theme: camt
paginate: true
header: 'Automated Testing Workshop · CMU CAMT · 3–4 ต.ค. 2026'
footer: '06 · Outside-In'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Outside-In

### เริ่มจาก acceptance test แล้วไล่เข้าไปข้างใน

Freeman & Pryce — *Growing Object-Oriented Software, Guided by Tests* (Ch. 1, 4, 5)

<span class="tag">Day 2 · เช้า</span>

---

## ทบทวน Day 1 ใน 1 สไลด์

| เรื่อง | จำไว้ 1 ประโยค |
|---|---|
| Boundaries | เลือก boundary **ต่ำที่สุดที่ยังให้ความมั่นใจพอ** |
| AAA | 1 test = 1 พฤติกรรม · Act ครั้งเดียว · ชื่อ test คือ spec |
| Test doubles | ชื่อขึ้นกับ **หน้าที่** · mock ที่ interface ของเราเอง |
| Test data | schema จาก migration · builder บอกเฉพาะค่าที่สำคัญ · fresh fixture |
| CI | CI เรียก script เดียวกับในเครื่อง · cheap & fast first |

วันนี้: **ใช้ทั้งหมดนี้สร้าง feature ใหม่** และ **แก้โค้ดเก่าที่ไม่มี test**

---

## Inside-out vs Outside-in

<div class="cols">
<div class="card">

### Inside-out

table → repository → service → route → UI

- แต่ละชั้นสร้าง "เผื่อ" ชั้นบน
- รู้ว่า **ต่อสายผิด** ตอนท้ายสุด
- มี method ที่ไม่มีใครเรียก (YAGNI)
- ✅ เหมาะเมื่อรู้ design ชัดแล้ว

</div>
<div class="card">

### Outside-in

acceptance test → route → service → repository → table

- เริ่มจาก **สิ่งที่ผู้ใช้ต้องการ**
- แต่ละชั้นออกแบบจาก **มุมคนเรียก**
- ต่อสายครบตั้งแต่วันแรก (walking skeleton)
- ✅ เหมาะเมื่อ design ยังไม่ชัด

</div>
</div>

---

## วงจรสองชั้น (double loop)

<svg viewBox="0 0 1100 380" width="100%">
  <defs><marker id="a6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1d2433"/></marker></defs>
  <!-- outer loop -->
  <rect x="10" y="10" width="1080" height="360" rx="18" fill="#fdf3f2" stroke="#b3261e" stroke-width="4"/>
  <text x="30" y="45" font-size="19" font-weight="700" fill="#b3261e">outer loop · acceptance test (Playwright → container) · 1 feature = ชั่วโมง – วัน</text>
  <rect x="40" y="90" width="250" height="80" rx="10" fill="#fff" stroke="#b3261e" stroke-width="2"/>
  <text x="165" y="125" font-size="20" font-weight="700" text-anchor="middle" fill="#b3261e">1. acceptance test</text>
  <text x="165" y="155" font-size="19" text-anchor="middle">แดง ❌</text>
  <rect x="40" y="260" width="250" height="80" rx="10" fill="#fff" stroke="#b3261e" stroke-width="2"/>
  <text x="165" y="295" font-size="20" font-weight="700" text-anchor="middle" fill="#b3261e">5. acceptance test</text>
  <text x="165" y="325" font-size="19" text-anchor="middle">เขียว ✅</text>
  <!-- inner loop -->
  <rect x="350" y="70" width="710" height="280" rx="14" fill="#eef7f1" stroke="#1f7a4d" stroke-width="4"/>
  <text x="370" y="103" font-size="19" font-weight="700" fill="#1f7a4d">inner loop · component / unit (Jest) · วนหลายรอบ รอบละไม่กี่นาที</text>
  <g font-size="19" text-anchor="middle">
    <rect x="380" y="140" width="190" height="80" rx="10" fill="#fff" stroke="#1f7a4d" stroke-width="2"/>
    <text x="475" y="175" font-weight="700" fill="#1f7a4d">2. test ที่เล็กกว่า</text><text x="475" y="203">แดง ❌</text>
    <rect x="620" y="140" width="190" height="80" rx="10" fill="#fff" stroke="#1f7a4d" stroke-width="2"/>
    <text x="715" y="175" font-weight="700" fill="#1f7a4d">3. โค้ดให้ผ่าน</text><text x="715" y="203">เขียว ✅</text>
    <rect x="860" y="140" width="170" height="80" rx="10" fill="#fff" stroke="#1f7a4d" stroke-width="2"/>
    <text x="945" y="175" font-weight="700" fill="#1f7a4d">4. refactor</text><text x="945" y="203">ยังเขียว ✅</text>
  </g>
  <g stroke="#1d2433" stroke-width="2.5" fill="none" marker-end="url(#a6)">
    <line x1="570" y1="180" x2="616" y2="180"/>
    <line x1="810" y1="180" x2="856" y2="180"/>
    <path d="M945,220 L945,290 L475,290 L475,224"/>
    <line x1="290" y1="130" x2="376" y2="170"/>
    <line x1="380" y1="320" x2="294" y2="305"/>
  </g>
  <text x="710" y="318" font-size="17" text-anchor="middle" fill="#5b6475">test เล็กตัวถัดไป — วนจนกว่า acceptance test จะเขียว</text>
</svg>

---

## Walking Skeleton

> *"A walking skeleton is an implementation of the thinnest possible slice of real functionality that we can automatically build, deploy, and test end-to-end."* — GOOS Ch. 4

ใน repo นี้ skeleton มีแล้วตั้งแต่ `main`:

```text
Playwright ──HTTP──▶ app container ──▶ Postgres (db-e2e)
                     (Dockerfile)       ▲
                                        └── Liquibase (context: e2e)
```

`e2e/voter-registration.spec.ts` วิ่งผ่านทุกชั้นจริง → acceptance test ตัวใหม่ **ไม่ต้องต่อสายเอง**

**สิ่งที่ skeleton จับได้**: Dockerfile ลืม copy ไฟล์, env ไม่ครบ, migration ไม่รัน, port ผิด — ปัญหาที่ unit test ไม่มีวันเห็น

---

## Feature วันนี้: ปิดหีบและประกาศผล

> **ในฐานะ** กกต. **ฉันต้องการ** ปิดหีบเลือกตั้งของแต่ละเขต
> **เพื่อให้** ประชาชนเห็นผลคะแนนของเขตนั้น

Acceptance criteria

1. `POST /districts/:id/close` (กกต.) → `200 { districtId, closedAt }`
2. ก่อนปิด `GET /districts/:id/results` → `closed: false` และ **ไม่มี** `votes`
3. หลังปิด → `closed: true`, `closedAt`, ทุกคนมี `votes` (ไม่มีใครเลือก = `0`)
4. ปิดซ้ำ → `409` · voter ปิด → `403` · เขตไม่มีจริง → `404`

(ห้ามลงคะแนน *หลัง* ปิดหีบ → บ่ายนี้ ในโค้ด legacy)

---

<!-- _class: dense -->

## Step 1 — Acceptance test (outer loop)

```ts
test('the commission closes a district poll and its results become public', async ({ request }) => {
  const api = new ElectionApi(request);              // ภาษาของ domain ไม่ใช่ HTTP call
  const commissioner = await api.login(COMMISSIONER);
  const one = await api.addCandidate(commissioner, 'CM-3', doiSuthep.id, 1);  // + อีก 3 บรรทัด
  for (const candidateId of [one.id, one.id, two.id]) {
    expect((await api.vote(await api.newVoterIn('CM-3'), candidateId)).status()).toBe(201);
  }
  expect((await (await api.results('CM-3')).json()).closed).toBe(false);

  const close = await request.post('/districts/CM-3/close', {
    headers: { Authorization: `Bearer ${commissioner}` },
  });
  expect(close.status()).toBe(200);
  expect(await (await api.results('CM-3')).json()).toMatchObject({
    closed: true,
    candidates: [{ number: 1, votes: 2 }, { number: 2, votes: 1 }],
  });
});
```

<!-- ย่อจาก e2e/close-poll.spec.ts ใน jest/solution/06-outside-in — เปิดไฟล์จริงให้ดูตอนเฉลย -->


---

## แดงด้วยเหตุผลที่ "ถูก"

```text
$ npm run test:e2e

  ✘  close-poll.spec.ts › the commission closes a district poll and its results become public

    Expected: 200
    Received: 404          ← POST /districts/CM-3/close ยังไม่มี route  ✅ ถูกต้อง
```

แดงแบบ **ผิด** ที่ต้องแก้ก่อนไปต่อ

- `401` ตอน login → seed ของ e2e ไม่ถูก
- `409` ตอนลงคะแนน → election ยังไม่เปิด
- timeout → container ไม่ขึ้น

> test ที่ไม่เคยเห็นแดง — ไม่รู้ว่ามันตรวจอะไรได้จริงไหม

---

## ทำไม acceptance test ใช้ Playwright ไม่ใช่ supertest?

| | supertest (component) | Playwright `request` (e2e) |
|---|---|---|
| app อยู่ที่ | **ใน process** ของ Jest | **container** แยก |
| สร้าง app จาก | `createApp(deps)` — inject ได้ | `Dockerfile` — เหมือน production |
| clock / token | ใส่ fake ได้ | ของจริงทั้งหมด |
| ข้อมูล | `given` + truncate | ผ่าน API เท่านั้น (ไม่แตะ DB) |
| จับได้ | logic + SQL + routing | + Dockerfile, env, migration, wiring |

e2e ไม่แตะ database โดยตรง → ใช้ **เลขบัตรไม่ซ้ำ** ทุก run แทนการ truncate

---

## Step 2–3 — ไล่เข้าไปข้างใน

**Component test** (`test/integration/poll.test.ts`) → แดง → เพิ่ม route ที่เรียก service **ที่ยังไม่มี**

```ts
router.post('/districts/:id/close', ...commissionerOnly, async (req, res) => {
  res.json(await polls.close(req.params.id));
});
```

ออกแบบ interface **จากมุมคนเรียก** — ยังไม่สนว่าข้างในทำอย่างไร

```ts
interface PollService {
  close(districtId: string): Promise<{ districtId: string; closedAt: Date }>;
  resultsFor(districtId: string): Promise<DistrictResults>;
}
```

**Unit test** ของ `PollService` → ค้นพบว่ามันต้องการอะไรจากโลกภายนอก

---

<!-- _class: dense -->

## Listen to the tests

```ts
describe('PollService', () => {
  const FIVE_PM = new Date('2026-10-04T17:00:00+07:00');
  const clock: Clock = { now: () => FIVE_PM };          // ต้องการ "เวลา" → Clock

  beforeEach(() => {
    districts = new InMemoryDistrictRepository([{ id: 'CM-1', ..., closedAt: null }]);
    votes = new InMemoryVoteRepository();               // ต้อง "นับคะแนน" → VoteRepository ใหม่
    polls = new PollService(districts, candidates, votes, clock);
  });

  it('closes the poll at the time given by the clock', async () => {
    const closed = await polls.close('CM-1');

    expect(closed).toEqual({ districtId: 'CM-1', closedAt: FIVE_PM });
    expect((await districts.findById('CM-1'))?.closedAt).toEqual(FIVE_PM);   // → markClosed()
  });
```

> ถ้า setup ของ test **ยาวและยุ่ง** — design กำลังบอกว่า class นี้ทำหลายอย่างเกินไป

---

## Step 4–5 — ลงไปถึง database แล้วไล่กลับออกมา

```sql
--changeset election:005-add-district-closed-at
-- NULL = the district's poll is still open.
ALTER TABLE districts ADD COLUMN closed_at TIMESTAMPTZ;
--rollback ALTER TABLE districts DROP COLUMN closed_at;
```

```text
unit (PollService + fakes)          ✅
integration (PgVoteRepository)      ✅   ← fake กับ Pg ต้องทำงานเหมือนกัน
component (poll.test.ts)            ✅
acceptance (close-poll.spec.ts)     ✅   🎉
```

**Step 6 — Refactor** ตอนทุก loop เขียว: ย้ายการสร้าง response ออกจาก route, ตั้งชื่อ, ลบโค้ดซ้ำ

⚠️ `truncateAll` ต้องรีเซ็ต `districts.closed_at` ด้วย — ไม่งั้น test ที่ปิดหีบ **รั่ว** ไป test อื่น

---

## แล้ว browser test ล่ะ?

Demo: `git switch demo/playwright-browser` — หน้า `results.html` + Playwright ผ่าน browser จริง

```ts
test('the results page shows scores only after the poll closes', async ({ page, request }) => {
  const api = new ElectionApi(request);                   // setup ผ่าน API → เร็ว ไม่เปราะ
  ...
  await page.goto('/results.html');
  await page.getByLabel('เขตเลือกตั้ง').selectOption('BKK-1');       // locator แบบ label / role

  await expect(page.getByRole('status')).toHaveText(/ยังไม่ปิดหีบ/);   // รอเอง ไม่ต้อง sleep
  await expect(page.getByRole('columnheader', { name: 'คะแนน' })).toHaveCount(0);
```

- ใช้ browser **เฉพาะส่วนที่ผู้ใช้เห็น** — setup ทุกอย่างผ่าน API
- ช้ากว่า, ต้องติดตั้ง browser, แดงได้จากหลายเหตุผล → มีเฉพาะ **journey ที่ UI สำคัญจริง**

---

<!-- _class: lab -->

## Lab 06 — Outside-In (~150 นาที · ทั้งเช้า)

```bash
git switch jest/lab/06-outside-in      # labs/06-outside-in/README.md
```

| Step | ทำอะไร | เวลา |
|---|---|---|
| 1 | `e2e/close-poll.spec.ts` → **แดงที่ 404** | 25 นาที |
| 2 | `test/integration/poll.test.ts` + route + interface `PollService` | 20 นาที |
| 3 | `test/unit/pollService.test.ts` → ค้นพบ `Clock`, `markClosed`, `VoteRepository` | 40 นาที |
| 4 | Liquibase `005-district-poll-closing.sql` + `--rollback` · `db:test-rollback` | 15 นาที |
| 5 | `PgDistrictRepository.markClosed`, `PgVoteRepository` → ทุกอย่างเขียว | 30 นาที |
| 6 | Refactor | ที่เหลือ |

<!--
เฉลย: jest/solution/06-outside-in
Checkpoint ทุก ~45 นาที: ถามว่าแต่ละคู่อยู่ step ไหน ถ้าส่วนใหญ่ช้ากว่า 1 step ให้ดูเฉลย step นั้นด้วยกันบนจอ
Demo browser test (~10 นาที) หลัง lab: labs/demo-playwright-browser.md
-->
