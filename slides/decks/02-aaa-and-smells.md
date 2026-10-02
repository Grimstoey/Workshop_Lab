---
marp: true
theme: camt
paginate: true
header: 'Software Testing in Real Industry · CMU CAMT · 3–4 ต.ค. 2026'
footer: '02 · Arrange / Act / Assert'
---

<!-- _class: title -->
<!-- _paginate: false -->
<!-- _header: '' -->
<!-- _footer: '' -->

# Arrange / Act / Assert

### เขียน unit test ให้อ่านแล้วเป็น spec

Gerard Meszaros — *xUnit Test Patterns*: Four-Phase Test, Test Smells

<span class="tag">Day 1 · บ่าย</span>

---

## Four-Phase Test ≈ AAA

<div class="cols">
<div>

| xUnit Patterns | AAA | ทำอะไร |
|---|---|---|
| Setup | **Arrange** | เตรียม SUT และ input |
| Exercise | **Act** | เรียกสิ่งที่ทดสอบ *ครั้งเดียว* |
| Verify | **Assert** | ตรวจผลของ Act นั้น |
| Teardown | — | คืนสภาพ (มักเป็น `afterEach`) |

**SUT** = *System Under Test* — สิ่งที่ test นี้ตั้งใจทดสอบ

</div>
<div>

```ts
it('rejects an id whose checksum digit is wrong', () => {
  // Arrange
  const id = '1509900000018';

  // Act
  const valid = isValidThaiNationalId(id);

  // Assert
  expect(valid).toBe(false);
});
```

</div>
</div>

---

## 4 กติกา

1. **1 test = 1 พฤติกรรม**
   ชื่อ test บอกว่าระบบ *ควรทำอะไร* — ไม่ใช่ชื่อ function (`'works'`, `'hash'` ❌)
2. **Act ครั้งเดียว**
   Act หลายครั้ง = มีหลาย test ซ่อนอยู่ในตัวเดียว
3. **ไม่มี logic ใน test** — ไม่มี `for`, `if`, `try`
   ถ้า test มี logic แล้วใครจะ test ตัว test?
4. **แดงแล้วรู้เลยว่าอะไรพัง โดยไม่ต้องเปิดไฟล์**
   ชื่อ test + ข้อความ error ต้องพอ

---

## ชื่อ test คือ spec

```text
$ npx jest --selectProjects unit --verbose

 PASS  unit  test/unit/passwords.test.ts
  hashPassword
    ✓ never returns the plain-text password
    ✓ gives a different hash each time for the same password (random salt)
  verifyPassword
    ✓ accepts the password that was hashed
    ✓ rejects a different password
    ✓ rejects a malformed stored hash "garbage" without throwing
    ✓ rejects a malformed stored hash "" without throwing
```

อ่าน output แล้วได้เอกสารของ `passwords.ts` ที่สอดคล้องกับ **พฤติกรรม** — ถ้าไม่สอดคล้อง test จะแดง

<!--
ให้ดูเทียบกับ output ของ lab02-smelly: "stuff › works", "stuff › hash" — ไม่บอกอะไรเลย
-->

---

<!-- _class: dense -->

## Test นี้ผ่าน... แต่มีปัญหาอะไร?

```ts
describe('stuff', () => {
  it('works', () => {
    const ids = ['1509900000017', '1509900000018', '150990000001', 'abcdefghijklm', '1100000000016'];
    const results: boolean[] = [];
    for (const id of ids) {
      results.push(isValidThaiNationalId(id));
    }
    expect(results[0]).toBe(true);
    expect(results[1]).toBe(false);   // ... อีก 3 บรรทัด
    const h = hashPassword('voter1234');
    const h2 = hashPassword('voter1234');
    if (h === h2) {
      throw new Error('same hash');
    }
    ...
  });

  it('hash', () => {
    hashPassword('x');
  });
});
```

<!-- ให้เวลาห้อง 1 นาทีชี้ปัญหาก่อนเปิดสไลด์ถัดไป -->

---

## Test Smells (xUnit Test Patterns)

| Smell | อาการ | เจ็บตอนไหน |
|---|---|---|
| **Obscure Test** | อ่านแล้วไม่รู้ว่าทดสอบอะไร (`'works'`) | ต้องอ่านทั้งไฟล์เพื่อเข้าใจว่าแดงเพราะอะไร |
| **Eager Test** | ทดสอบหลายพฤติกรรมใน test เดียว | ข้อแรกพัง → ข้อหลังไม่ถูกรันเลย |
| **Assertion Roulette** | `expect(results[1]).toBe(false)` หลายบรรทัด | *"expected false, received true"* — ข้อไหน? |
| **Conditional Test Logic** | `for`, `if` ใน test | test มี bug เองได้ และซ่อนเคสที่ไม่ถูกรัน |
| **No assertion** | `it('hash', () => { hashPassword('x') })` | ผ่านเสมอ = ให้ความมั่นใจปลอม + coverage ปลอม |

ที่จะเจอต่อ: **Mystery Guest** (Lab 04) · **Fragile Test** (Lab 03) · **Slow Tests** (Lab 04–05)

---

## Refactor: `it.each` แทน loop

```ts
describe('isValidThaiNationalId', () => {
  it('rejects an id with a wrong checksum digit', () => {
    expect(isValidThaiNationalId('1509900000018')).toBe(false);
  });

  it.each([
    ['empty', ''],
    ['12 digits', '150990000001'],
    ['a letter', '150990000001x'],
    ['all letters', 'abcdefghijklm'],
  ])('rejects a malformed id (%s)', (_case, id) => {
    expect(isValidThaiNationalId(id)).toBe(false);
  });
});
```

- แต่ละเคส **เป็น test ของตัวเอง** — พังตัวไหนเห็นชื่อตัวนั้น
- เพิ่มเคสใหม่ = เพิ่ม 1 บรรทัด

---

## Design for testability — seam แรกของเรา

<div class="cols">
<div>

```ts
// ❌ อ่าน global โดยตรง
export function loadConfig() {
  return {
    port: Number(process.env.PORT ?? 3000),
    ...
  };
}
```

test ต้องแก้ `process.env` แล้วคืนค่า — ลืมคืน = test อื่นพัง

</div>
<div>

```ts
// ✅ รับ env เป็น parameter
export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT ?? 3000),
    ...
  };
}
```

```ts
const config = loadConfig({ PORT: '8080' });
expect(config.port).toBe(8080);
```

</div>
</div>

**Seam** = จุดที่เราเปลี่ยนพฤติกรรมได้ *โดยไม่แก้โค้ดตรงนั้น* — วันนี้เห็นแบบง่ายที่สุด, Day 2 จะเจอแบบยาก

<!--
"ลืมคืน = test อื่นพัง" — ตัวอย่าง:

  it('reads PORT from the environment', () => {
    process.env.PORT = '8080';
    expect(loadConfig().port).toBe(8080);
  });                                       // ลืมคืนค่า
  it('defaults to port 3000', () => {
    expect(loadConfig().port).toBe(3000);   // ❌ ได้ 8080
  });

- process.env เป็น global — ค่าค้างไปถึง test ถัดไปในไฟล์ (Jest แยกให้แค่ระดับไฟล์)
- test ที่แดงไม่ใช่ test ที่ผิด · รัน -t 'defaults' ตัวเดียวผ่าน รันทั้งไฟล์พัง = Interacting Tests
- PORT ใน shell ของเครื่องคนรันก็รั่วเข้ามาได้ → แดงแค่บางเครื่อง
- คืนค่าต้องทำใน afterEach (expect fail ก่อน = บรรทัดคืนค่าไม่ถูกรัน) และต้อง delete
  ห้าม process.env.PORT = undefined → Node เก็บเป็น string 'undefined' → NaN
- ฝั่ง ✅ ไม่มี global ให้แก้ → ไม่มีอะไรต้องคืน
-->

---

<!-- _class: dense -->

## Jest cheat sheet

<div class="cols">
<div>

```ts
expect(x).toBe(3)                 // ===
expect(obj).toEqual({ a: 1 })     // เท่ากันทุก field
expect(obj).toMatchObject({ a: 1 }) // มีอย่างน้อย field นี้
expect(list).toHaveLength(2)
expect(s).toMatch(/ปิดหีบ/)
expect(fn).toThrow(ValidationError)
await expect(p).rejects.toThrow(...)
expect.any(String) · expect.objectContaining({...})
```

</div>
<div>

```ts
describe('when the password is wrong', () => { ... })
it.each([...])('rejects %s', ...)
it.todo('forbids a voter (403)')
beforeEach / afterEach / beforeAll / afterAll
```

```bash
npm run test:unit
npx jest --watch                   # รันใหม่ทุก save
npx jest -t 'checksum'             # เฉพาะชื่อที่ตรง
npx jest test/unit/passwords.test.ts
```

</div>
</div>

⚠️ `it.only` / `describe.only` — ห้าม commit

---

<!-- _class: dense -->

## ไม่ได้ใช้ Jest? — Vitest ใช้ได้เหมือนกัน

<div class="cols">
<div>

**เหมือนเดิม** — cheat sheet หน้าที่แล้วใช้ได้ทั้งหน้า
`describe` · `it.each` · `it.todo` · hooks · `expect` ทุก matcher

**เปลี่ยนแค่นี้**

```ts
import { describe, expect, it, vi } from 'vitest';

vi.fn() · vi.spyOn() · vi.useFakeTimers()   // jest.* → vi.*
```

```bash
npx vitest                      # watch เป็นค่าเริ่มต้น
npx vitest run --project unit   # = jest --selectProjects unit
```

</div>
<div>

**ต่างกันจริง ๆ**

- Vitest **ไม่ตรวจ type** → รัน `tsc --noEmit` ก่อน
  (TypeScript 7 ทั้ง project < 1 วินาที)
- ts-jest ใช้กับ **TypeScript 7** ไม่ได้ — Vitest ได้
- รัน ESM ได้เลย (เช่น faker v10)

**Lab ชุดเดียวกันบน Vitest + TS 7**

```text
vitest/lab/NN-*
vitest/solution/NN-*
labs/jest-vs-vitest.md   ← ตารางแปลงครบ
```

</div>
</div>

<!--
~1 นาที สำหรับคนที่โปรเจกต์ใช้ Vitest อยู่แล้ว หรือจะเริ่มใหม่ — ในห้องยังใช้ branch jest/* ทั้งหมด
ถ้ามีคนถาม "ควรใช้ตัวไหน": หลักการทุกอย่างใน workshop เหมือนกัน เลือกตามที่ทีม/โปรเจกต์ใช้อยู่
-->

---

<!-- _class: lab -->

## Lab 02 — AAA & Test Smells (~45 นาที)

```bash
git switch jest/lab/02-aaa-unit        # labs/02-aaa-unit/README.md
cd app && npm run test:unit
```

| Part | ทำอะไร | เวลา |
|---|---|---|
| **A** | `test/unit/lab02-smelly.test.ts` — หา smell ≥ 4 อย่าง<br>ลองให้ `hashPassword` คืน plain text → error ช่วยได้แค่ไหน? | 10 นาที |
| **B** | ลบไฟล์ smelly → เขียนใหม่: `thaiNationalId`, `passwords`, `config` | 25 นาที |
| **C** | Stretch: `toPublicUser` ไม่หลุด `passwordHash`, `describe` ซ้อน | ที่เหลือ |

เสร็จแล้ว: `npx jest --selectProjects unit --verbose` — อ่านแล้วเป็น spec ไหม?

<!--
เฉลย: jest/solution/02-aaa-unit
จุดที่คนติด: hashPassword ต่างกันทุกครั้ง (salt) → test ว่า "hash 2 ครั้งไม่เท่ากัน" แทน if/throw
-->
