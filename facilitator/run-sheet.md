# Run Sheet — 3–4 ตุลาคม 2026 (09:00–16:30)

เวลาใน lab README รวมกันได้ ~610 นาที แต่เวลาจริงที่ใช้ได้ (หักกลางวันและพัก) มี 720 นาทีต่อ 2 วัน รวม lecture ~110 นาทีแล้ว **เกิน** — run sheet นี้จึงตัดบางส่วนไว้แล้ว และแต่ละ block บอกว่า **ถ้าช้าตัดอะไรก่อน**

สัญลักษณ์: 🎤 พูด / สไลด์ · 🛠️ lab · 🎬 demo · ☕ พัก · ✂️ ตัดได้ถ้าช้า · 🏁 checkpoint

---

## Day 1 — เสาร์ 3 ต.ค.

| เวลา | นาที | อะไร | Branch / สไลด์ |
|---|---|---|---|
| 08:30–09:00 | — | เปิดห้อง · ตรวจ projector · ให้คนที่ doctor ยังไม่ผ่านมาหาก่อน | [prep-checklist](prep-checklist.md) |
| 09:00–09:10 | 10 | 🎤 เปิด: เป้าหมาย, agenda, กติกา, repo map | deck 01 → จนถึง "Repo ของ workshop" |
| 09:10–09:55 | 45 | 🎤 Why + SUT & scope + Test Boundaries | deck 01 → "Why" ถึง "ตัวอย่าง: เลือก boundary" |
| 09:55–10:30 | 35 | 🛠️ Lab 01 Part A (20) + Part B เริ่ม (15) | `jest/lab/01-boundaries` |
| 10:30–10:45 | 15 | ☕ | |
| 10:45–11:15 | 30 | 🛠️ Lab 01 Part B ต่อ (10) · **Checklist รอบ 1** (10) · แต่ละคู่เล่า 1 ข้อ (10) | `checklist/README.md` |
| 11:15–11:30 | 15 | 🎤 AAA & Test Smells | deck 02 |
| 11:30–12:00 | 30 | 🛠️ Lab 02 Part A (10) + Part B เริ่ม (20) | `jest/lab/02-aaa-unit` |
| 12:00–13:00 | 60 | ☕ กลางวัน | |
| 13:00–13:15 | 15 | 🛠️ Lab 02 Part B จบ (5) · 🏁 เฉลยบนจอ + `--verbose` (10) | `jest/solution/02-aaa-unit` |
| 13:15–13:30 | 15 | 🎤 Test Doubles | deck 03 |
| 13:30–14:30 | 60 | 🛠️ Lab 03 A (25) · B (20) · C (15) | `jest/lab/03-test-doubles` |
| 14:30–14:45 | 15 | ☕ | |
| 14:45–15:05 | 20 | 🎤 Test Data Management | deck 04 |
| 15:05–15:55 | 50 | 🛠️ Lab 04 A1+A2 (15) · B (20) · C (15) | `jest/lab/04-test-data` |
| 15:55–16:05 | 10 | 🎤 CI | deck 05 |
| 16:05–16:25 | 20 | 🛠️ Lab 05 Part A (10) · C1 coverage gate (10) | `jest/lab/05-ci` |
| 16:25–16:30 | 5 | ปิดวัน + **การบ้านคืนนี้** (ด้านล่าง) | |

### รายละเอียดแต่ละ block

**09:00 เปิด**
- ถามยกมือ: เคยเขียน automated test ในงานจริง / ในวิชา / ไม่เคย → ปรับความลึกของ deck 01
- ย้ำกติกา **ไม่ใช้ AI ใน lab** และบอกว่าท้าย Day 2 มีช่วงคุยเรื่องนี้โดยเฉพาะ
- ให้ทุกคน `git fetch --all` และดูว่า `git branch -r` เห็น `jest/lab/*`

**09:10 Why + SUT & scope + Boundaries**
- สไลด์ "คืนก่อนประกาศผล" → ถามห้อง 1–2 คนว่าโปรเจกต์ตัวเองทดสอบก่อนส่งงานอย่างไร
- "ราคาของการรู้ว่ามี bug" และ "Test ที่ดีหน้าตาเป็นอย่างไร" ไปเร็ว (รวมเร็วขึ้น ~2–3 นาที) เพื่อเผื่อเวลาให้ SUT & scope
- 2 สไลด์ SUT (~5 นาที): "SUT ของ workshop" = แผนที่ 2 วัน — ชี้กรอบประเหลือง (Lab 06 สร้างใหม่) และสีแดง (Lab 07 legacy) · "ขอบเขต" = สิ่งที่ **ไม่** ทดสอบและเหตุผล — ไม่ต้องสอนกฎ ทุกคนเขียนระบบนี้มาแล้ว
- สไลด์ "ระบบอ้างอิง: ชั้นต่าง ๆ" คือแผนที่ที่จะกลับมาใช้ทั้ง 2 วัน — ใช้เวลาตรงนี้ · แต่ละแถบ = SUT ของ boundary นั้น (SUT หดลงจาก e2e → unit)

**09:55 Lab 01** (ทำเป็นคู่)
- ข้อที่มักเถียงกัน: *"voter เปลี่ยนคะแนนได้จนกว่าจะปิดหีบ"* (component หรือ e2e?) และข้อที่ **ไม่ใช่** functional test (load, usability)
- เฉลย: `jest/solution/01-boundaries` → `labs/01-boundaries/answer-key.md` — เปิดเฉพาะหลังทุกคู่ส่งคำตอบ
- ✂️ Part B ให้ทำ 5 ข้อแทนทั้งหมด

**11:15 AAA & Test Smells**
- สไลด์ "ไม่ได้ใช้ Jest?" หลัง cheat sheet ~1 นาที: ถามว่าโปรเจกต์ใครใช้ Vitest อยู่ ชี้ `vitest/*` + `labs/jest-vs-vitest.md` แล้วไปต่อ — ในห้องใช้ `jest/*` ทุกคน

**11:30 Lab 02**
- ชี้ให้เห็นว่า `lab02-smelly.test.ts` **ผ่าน** — test ที่ผ่านไม่ได้แปลว่าดี
- ตอนให้ `hashPassword` คืน plain text: error ที่ได้คือ `expected ... not to be ...` ที่ไม่บอกว่าข้อไหน → Assertion Roulette
- ✂️ Part C (stretch) ทั้งหมด

**13:30 Lab 03**
- เดินดู comment ที่ระบุชนิด double — คนมักเรียกทุกอย่างว่า "mock"
- จุดที่คนติด: `await expect(promise).rejects.toThrow(...)` ลืม `await` → test ผ่านเสมอ (ให้ลองลบ `await` ดูเป็นตัวอย่าง)
- ✂️ Part C → ดูเฉลย `jwtTokenService.test.ts` ด้วยกันบนจอ 5 นาที

**14:45 Test Data** — สไลด์ Liquibase เร็ว ๆ แล้วให้ลงมือใน Part A จะเข้าใจกว่า

**15:05 Lab 04**
- Part A: A1 (tag → 005 → rollback) + A2 (แก้ changeset เก่า → checksum error) · A3 เป็นคำถามปากเปล่า
- หลัง A2 ต้อง `git checkout -- db/` **และ** `npm run db:reset:test && npm run db:migrate:test` ถ้าเผลอ migrate ไปแล้ว
- Part C ในห้อง: `given.ts` + 2–3 `it.todo` แรก ที่เหลือดูจากเฉลย
- 🎬 ✂️ Testcontainers demo — ทำเฉพาะถ้า Lab 04 จบก่อน 15:50 ไม่งั้นชี้ไปที่ `labs/demo-testcontainers.md` (branch `demo/testcontainers`)

**16:05 Lab 05**
- Part A ใช้ pipeline ที่ตรงกับที่ทำงาน/คณะใช้ (GitHub / GitLab / Jenkins)
- ✂️ Part B (push ขึ้น GitHub) และ C2 (`db:test-rollback`) เป็นการบ้าน — Wi-Fi ห้องอาจไม่พอ

### 🏠 การบ้านคืน Day 1 (สำคัญ)

```bash
cd app
git switch jest/lab/06-outside-in
npm run test:e2e     # build app image ครั้งแรก — ต้องใช้อินเทอร์เน็ต ~2–3 นาที
```

`package.json` เปลี่ยนตั้งแต่ Lab 05 → Docker ต้อง `npm ci` ใน image ใหม่ ถ้าทุกคนทำพร้อมกันเช้า Day 2 Wi-Fi ห้องจะไม่ไหว

ไม่บังคับ: Lab 05 Part B + C2, และจดข้อที่ได้ 0 ใน Checklist ที่อยากแก้

---

## Day 2 — อาทิตย์ 4 ต.ค.

| เวลา | นาที | อะไร | Branch / สไลด์ |
|---|---|---|---|
| 08:30–09:00 | — | ใครยังไม่ได้ทำการบ้าน `test:e2e` → ให้ทำตอนนี้ | |
| 09:00–09:10 | 10 | 🎤 ทบทวน Day 1 + คำถามจากการบ้าน | deck 06 → "ทบทวน Day 1" |
| 09:10–09:30 | 20 | 🎤 Outside-In, double loop, walking skeleton, feature | deck 06 → ถึง "Listen to the tests" |
| 09:30–10:30 | 60 | 🛠️ Lab 06 Step 1 (25) · Step 2 (20) · Step 3 เริ่ม (15) | `jest/lab/06-outside-in` |
| 10:30–10:45 | 15 | ☕ | |
| 10:45–11:40 | 55 | 🛠️ Step 3 จบ (20) · Step 4 (15) · Step 5 (20) | |
| 11:40–11:50 | 10 | 🏁 เฉลย + คำถามปิด lab | `jest/solution/06-outside-in` |
| 11:50–12:00 | 10 | 🎬 Playwright browser demo | `demo/playwright-browser` · deck 06 "แล้ว browser test ล่ะ?" |
| 12:00–13:00 | 60 | ☕ กลางวัน | |
| 13:00–13:20 | 20 | 🎤 Legacy Code | deck 07 |
| 13:20–14:30 | 70 | 🛠️ Lab 07 Part A (35) · Part B (35) | `jest/lab/07-legacy` |
| 14:30–14:45 | 15 | ☕ | |
| 14:45–15:10 | 25 | 🛠️ Lab 07 Part C (20) · คุยกัน (5) | `jest/solution/07-legacy` |
| 15:10–15:15 | 5 | 🎤 Lab 08 intro | deck 08 → ถึง "Lab 08" |
| 15:15–16:00 | 45 | 🛠️ Lab 08 Step 1 (15) · 2 (15) · 3 (10) · **Checklist รอบ 2** (5) | โปรเจกต์ของตัวเอง + `jest/lab/08-own-project` templates |
| 16:00–16:15 | 15 | 🎤 คุยกัน: AI-written tests | deck 08 |
| 16:15–16:30 | 15 | 🎤 สรุป 2 วัน · หลัง workshop · feedback | deck 08 |

### รายละเอียดแต่ละ block

**09:30 Lab 06** — lab ยาวที่สุด ต้องคุมจังหวะ
- 🏁 **10:00** ทุกคู่ต้องเห็น acceptance test **แดงที่ 404** — ถ้าแดงเพราะอย่างอื่น (401, 409, timeout) แก้ก่อน ดู [troubleshooting](troubleshooting.md#e2e)
- 🏁 **10:30** ก่อนพัก: ควรมี `poll.test.ts` แดง + interface `PollService` แล้ว
- 🏁 **11:15** ถ้าคู่ส่วนใหญ่ยังไม่ถึง Step 4 → ทำ Step 4 (Liquibase 005) **ด้วยกันบนจอ** 10 นาที
- ✂️ Step 6 (refactor) เป็นการบ้าน
- ตามไม่ทันเกิน 1 step: `git stash -u` แล้วดูไฟล์ของ step นั้นใน `jest/solution/06-outside-in` ได้ (`git show jest/solution/06-outside-in:app/<path>`)

**11:50 Browser demo** — เตรียม `npx playwright install chromium` ไว้ในเครื่อง facilitator แล้ว · รัน `--headed --slow-mo=500` ให้ห้องเห็น

**13:20 Lab 07**
- ❓ ในไฟล์ test ต้องตอบก่อนเริ่ม — ให้รัน `npm run test:integration` **ทั้ง suite** จะเห็น "Jest did not exit" (legacy pool) → นี่คือ hook ของ Part B
- ช่วงเขียน characterization: เดินดูว่ามีคน "แก้" พฤติกรรมแปลกไหม — ย้ำว่า **บันทึก ไม่แก้**
- คำถามชวนคิดหลัง Part B (อยู่ใน speaker notes ของสไลด์ Lab 07): token ที่ไม่มี `Bearer ` นำหน้า
- เฉลยมี 3 commits (characterize → break deps → sprout): `git log --oneline jest/lab/07-legacy..jest/solution/07-legacy`

**15:15 Lab 08**
- คนที่ stack ต่างจาก repo อ้างอิง (JS, Prisma, MongoDB, ไม่มี `createApp`) → จับกลุ่มกันตามสไลด์ "Stack ไม่เหมือน repo อ้างอิง?"
- เป้าหมายขั้นต่ำ: **test จริง 1 ตัวที่รันด้วยคำสั่งเดียว** — ได้แค่นี้ก็ถือว่าสำเร็จ
- ✂️ Step 3 เหลือแค่ 1 test (unit หรือ component)

**16:00 AI-written tests** — ให้คนในห้องเล่าประสบการณ์ก่อน แล้วค่อยเปิดสไลด์ · ใช้ Readiness Checklist + test smells เป็นเกณฑ์ review test ที่ AI เขียน

**16:15 ปิด**
- ให้แต่ละคนบอก **คะแนน Checklist รอบ 1 → รอบ 2** และ 1 ข้อที่จะทำก่อน
- ส่ง feedback form (ตุ้ยเตรียม) · ย้ำว่ามีชุด Vitest + TypeScript 7 (`vitest/*`) สำหรับโปรเจกต์ที่ใช้ Vitest

---

## ถ้าเวลาเหลือ

| ที่ | ใช้ทำอะไร |
|---|---|
| Day 1 ท้าย Lab 04 | 🎬 Testcontainers demo |
| Day 1 ท้ายวัน | Lab 05 Part B บนจอ: push แล้วดู pipeline แดง → เขียว |
| Day 2 Lab 06 | Step 6 refactor ด้วยกัน |
| Day 2 Lab 07 | Stretch: เพิ่มขั้นใน `close-poll.spec.ts` ว่าลงคะแนนหลังปิดหีบได้ 409 |
