---
marp: true
theme: camt
paginate: true
header: 'Software Testing in Real Industry · CMU CAMT · 3–4 ต.ค. 2026'
footer: '08 · Your Project & Wrap-up'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# โปรเจกต์ของตัวเอง

### นำทุกอย่างไปใช้กับระบบเลือกตั้งที่เราเขียนเอง

Lab 08 · Readiness Checklist รอบ 2 · ปิด workshop

<span class="tag">Day 2 · ท้ายวัน</span>

---

## เป้าหมาย 60 นาทีนี้

ไม่ใช่ "ครบทุกอย่าง" แต่คือ

1. **test ของจริง 2–3 ตัว** ในโปรเจกต์ของตัวเอง
2. รันได้ด้วย **คำสั่งเดียว** (`npm test` / `npm run test:integration`)
3. รู้ว่า **ขั้นต่อไป** คืออะไร

```bash
git switch -c testing-workshop          # ในโปรเจกต์ของตัวเอง
npm i -D jest ts-jest @types/jest supertest @types/supertest @faker-js/faker@9
```

templates อยู่ที่ `labs/08-own-project/templates/` (branch `jest/lab/08-own-project`)

---

## Templates

| ไฟล์ | ทำอะไร | มาจาก lab |
|---|---|---|
| `jest.config.js` | แยก `unit` / `integration` projects | 01, 04 |
| `docker-compose.test.yml` | Postgres (tmpfs) + Liquibase | 04 |
| `db/Dockerfile`, `db/changelog/…` | migration แบบ versioned | 04 |
| `test/integration/env.ts`, `database.ts` | ชี้ไป test DB + `truncateAll` | 04 |
| `package-scripts.json` | script ที่ต้องเพิ่มใน `package.json` | 05 |

---

## Stack ไม่เหมือน repo อ้างอิง? หลักการเดิม เปลี่ยนแค่เครื่องมือ

| ถ้าโปรเจกต์... | ทำแบบนี้ |
|---|---|
| เป็น **JavaScript** (ไม่ใช่ TS) | ไม่ต้องใช้ `ts-jest` — ลบ `transform` ออก |
| มี **migration อยู่แล้ว** (Prisma, Sequelize, TypeORM, Knex) | ใช้ของเดิม — สำคัญแค่ test DB ต้อง **สร้างจาก migration อัตโนมัติ** |
| ใช้ **MongoDB** | `mongo:7` ใน compose · ล้างด้วย `deleteMany({})` ต่อ collection |
| ใช้ **Vitest** (หรืออยากใช้ TypeScript 7) | templates จาก branch `vitest/lab/08-own-project` |
| **สร้าง app และ `listen()` ในไฟล์เดียว** | seam แรกที่ต้องสร้าง ↓ |

```ts
// app.ts — สร้างและ export app (supertest ต้องการแค่นี้)
export function createApp(deps: AppDeps) { const app = express(); ...; return app; }

// server.ts — listen อย่างเดียว
createApp(pgDeps(pool, tokens)).listen(config.port);
```

---

<!-- _class: lab -->

## Lab 08 — โปรเจกต์ของตัวเอง (~60 นาที)

| Step | ทำอะไร | เวลา |
|---|---|---|
| 1 | Test harness: templates → `npm run test:unit` และ `test:integration` รันได้ | 15 นาที |
| 2 | **Characterize** endpoint ที่สำคัญที่สุด (มักเป็นการลงคะแนน) 3–4 test | 20 นาที |
| 3 | Automate test cases จาก Lab 01: **1 unit** (sprout ออกมาก่อนถ้าจำเป็น) + **1 component** | 20 นาที |
| 4 | **Readiness Checklist รอบ 2** | 5 นาที |

ติดตรงไหน ถามตัวเอง

- สิ่งนี้อยู่ใน **SUT / scope** ที่เขียนไว้ตอน Lab 01 ไหม?
- ถ้าจะ test สิ่งนี้ ต้อง **ควบคุม** อะไรบ้าง? (เวลา, DB, token, service ภายนอก) → แต่ละอย่างคือ seam
- test นี้ต้องการ database จริงไหม หรือ logic แยกออกมาได้?
- ถ้า test นี้แดง ฉันจะรู้ไหมว่าอะไรพัง?

---

## Readiness Checklist รอบ 2

| หมวด | ข้อ |
|---|---|
| **Structure** | 1 boundary ชัดเจน · 2 unit ไม่ต้องใช้ Docker · 3 คำสั่งเดียวรันทั้งหมด |
| **Environment** | 4 test DB จาก migration · 5 ไม่มีขั้นตอน DB ด้วยมือ · 6 เหมือนกันทั้งเครื่องและ CI |
| **Data** | 7 builder ไม่ใช่ shared fixture · 8 test ไม่ขึ้นกับกัน · 9 ควบคุมเวลาและค่าสุ่มได้ |
| **Design** | 10 มี seam · 11 double ถูกระดับ · 12 legacy ที่เสี่ยงมี characterization test |

0 = ยังไม่มี · 1 = บางส่วน / ด้วยมือ · 2 = ครบและอัตโนมัติ · **เต็ม 24**

- คะแนนเปลี่ยนจากเช้า Day 1 เท่าไหร่?
- ข้อไหนได้ 0 ที่ **แก้ได้ภายใน 1 วัน**? → งานแรกหลัง workshop

---

<!-- _class: divider -->

# คุยกัน: AI-written tests

2 วันนี้เราไม่ใช้ AI ใน lab — ทีนี้มาคุยกันว่าในงานจริงควรใช้อย่างไร

---

## AI เขียน test ให้ได้ — แต่ใครตรวจ test?

**สิ่งที่ AI มักทำ** (และตอนนี้เรามีชื่อเรียกมันแล้ว)

- อ่านโค้ดแล้วเขียน test ที่ assert **สิ่งที่โค้ดทำอยู่** → เป็น *characterization test* โดยไม่ตั้งใจ — bug ก็ถูกล็อกไว้เป็น "ถูกต้อง"
- mock ทุกอย่างรวมถึง `pg.Pool` → **fragile** และไม่ได้ทดสอบ SQL
- test ยาว, assert หลายอย่าง, ชื่อกว้าง ๆ → **Eager Test, Assertion Roulette**
- เพิ่ม coverage ด้วย test ที่ **ไม่มี assertion ที่มีความหมาย**

**วิธีใช้ให้ได้ประโยชน์**

- เราตัดสินใจ **boundary และพฤติกรรม** เอง — ให้ AI ช่วยพิมพ์
- **เห็น test แดงก่อนเขียว** ทุกตัว (ลองทำโค้ดให้พังแล้วดูว่า test จับได้ไหม)
- review test เหมือน review production code: ชื่อ, AAA, double, data

<!--
ให้ห้องคุย 10 นาที: ใครเคยใช้ AI เขียน test แล้วเจออะไรบ้าง? ใช้ Readiness Checklist เป็นเกณฑ์ review ได้ไหม?
-->

---

## 2 วันที่ผ่านมา

| Reference | แนวคิด | เราทำอะไรกับมัน |
|---|---|---|
| **Clemson / Fowler** | Test boundaries | จัด test case ของตัวเองเป็น unit / integration / component / e2e |
| **xUnit Test Patterns** | Four-phase test, smells, doubles, fixtures | AAA, dummy→fake, builders + faker, fresh fixture, contract test |
| **GOOS** | Outside-in, double loop, walking skeleton | ปิดหีบ: Playwright → supertest → unit → Liquibase → Pg |
| **Feathers** | Characterization, seams, sprout | ห้ามลงคะแนนหลังปิดหีบ ใน `voteRoutes.ts` |

และเครื่องมือที่ทำให้มันเกิดขึ้นได้ทุกวัน: **Liquibase · docker compose · Jest projects · CI**

---

## หลัง workshop

- **Vitest + TypeScript 7** — lab ชุดเดียวกันที่ branch `vitest/*` + `labs/jest-vs-vitest.md`
- ทำข้อที่ได้ 0 ใน checklist ที่แก้ได้ใน 1 วัน
- เพิ่ม characterization test **ก่อน** แก้โค้ดเก่าทุกครั้ง
- ให้ CI รัน test ของโปรเจกต์ตัวเองทุก push

**อ่านต่อ**

1. martinfowler.com/articles/microservice-testing — อ่านซ้ำหลังลงมือทำ จะเห็นอีกแบบ
2. *xUnit Test Patterns* — ใช้เป็น catalog: Test Smells (Part II), Test Double (Ch. 11)
3. *GOOS* — Part I–III, ตัวอย่าง Auction Sniper ทำตามทีละบท
4. *Working Effectively with Legacy Code* — Part II เป็น FAQ: *"I need to change a monster method..."*

---

<!-- _class: title -->
<!-- _paginate: false -->

# ขอบคุณ 🙏

### คำถาม · Feedback

Repo: `github.com/boyone/camt-software-testing`

