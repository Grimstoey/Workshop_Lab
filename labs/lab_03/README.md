# Lab 03 — Test Doubles

Branch: `jest/lab/03-test-doubles`

Lab นี้ฝึกการทำ Unit Test เมื่อ **SUT (System Under Test)** ไม่ได้ทำงานเพียงลำพัง แต่ต้องพึ่งพาองค์ประกอบอื่น เช่น Repository, Token Service หรือเวลา ระบบจริงอาจต้องเชื่อมต่อ PostgreSQL, ใช้ JWT หรืออาศัยเวลาของเครื่อง ซึ่งทำให้ Unit Test ช้า ควบคุมสถานการณ์ยาก และเกิด Failure จากสิ่งที่อยู่นอก Unit ที่เราต้องการทดสอบ

แนวทางของ Lab คือใช้ **Test Double** แทน Depended-On Component (DOC) เพื่อควบคุมข้อมูลที่ไหลเข้าหา SUT และตรวจสอบสิ่งที่ SUT ส่งออกไป โดยยังคงรักษา Unit Test ให้ไม่มี Database, HTTP Server หรือ External I/O

## วัตถุประสงค์

หลังจากทำ Lab นี้แล้ว ควรสามารถ:

1. อธิบายความแตกต่างระหว่าง **Dummy, Stub, Spy, Mock และ Fake**
2. เลือก Test Double ตามหน้าที่ที่ต้องการ ไม่ใช่เรียกทุกอย่างว่า Mock
3. แยก **Direct Input / Output** ออกจาก **Indirect Input / Output**
4. ใช้ Constructor Injection เป็น Seam สำหรับเสียบ Test Double
5. ใช้ Stub เพื่อสร้างสถานการณ์ที่ต้องการทดสอบ
6. ใช้ Spy เพื่อตรวจข้อมูลที่ SUT ส่งไปยัง collaborator
7. ใช้ Mock เมื่อต้องการตรวจ Interaction หรือ Protocol ระหว่าง Object
8. ใช้ Fake เมื่อ collaborator ต้องมี State ที่สอดคล้องกันหลายครั้ง
9. ควบคุมเวลาในการทดสอบ JWT ด้วย Jest Fake Timers
10. หลีกเลี่ยง Mock ที่ละเอียดเกินไปจนทำให้ Test เปราะ

---

## แนวคิดพื้นฐาน

### SUT และ DOC

ใน Lab นี้ SUT หลักคือ Service เช่น:

- `AccountService`
- `ElectionAdminService`
- `JwtTokenService`

ส่วน **DOC (Depended-On Component)** คือสิ่งที่ SUT เรียกใช้ เช่น:

- `UserRepository`
- `DistrictRepository`
- `PartyRepository`
- `CandidateRepository`
- `TokenService`

Production Code ใช้ Constructor Injection เช่น:

```ts
new AccountService(users, districts, tokens);
```

เพราะ Service พึ่งพา Interface เราจึงสามารถเปลี่ยนจาก PostgreSQL หรือ JWT implementation จริง มาใช้ Test Double ใน Unit Test ได้โดยไม่ต้องแก้ Logic ของ Service

---

## Direct และ Indirect Input / Output

มองการทดสอบได้เป็นสองด้าน:

```text
Test  <---->  SUT  <---->  DOC
```

ฝั่ง Test กับ SUT:

- **Direct Input** = argument ที่ Test ส่งให้ SUT
- **Direct Output** = return value หรือ exception ที่ SUT ส่งกลับ

ฝั่ง SUT กับ DOC:

- **Indirect Input** = ข้อมูลที่ DOC ส่งกลับมาให้ SUT
- **Indirect Output** = ข้อมูลหรือคำสั่งที่ SUT ส่งไปยัง DOC

Test Double ทำให้เราควบคุมและสังเกตเส้นทางด้านขวาได้

---

## Test Double ทั้ง 5 แบบ

| Test Double | หน้าที่ | ตัวอย่างใน Lab |
|---|---|---|
| **Dummy** | ส่งให้ Constructor ครบ แต่ Test Case นั้นไม่ควรใช้งาน | `dummyTokens` ตอนทดสอบ `register()` |
| **Stub** | ป้อน Indirect Input ที่กำหนดไว้ให้ SUT | `stubDistricts(false)` ให้เขตเลือกตั้งไม่มีอยู่ |
| **Spy** | บันทึก Indirect Output แล้ว Test ตรวจภายหลัง | `jest.spyOn(users, 'create')` ตรวจข้อมูลก่อนบันทึก User |
| **Mock** | ตรวจ Expectation ว่า Interaction ต้องเกิดหรือไม่เกิดอย่างไร | ตรวจ `tokens.issue(...)` ตอน Login |
| **Fake** | Implementation แบบง่ายที่ทำงานจริงและมี State แต่ไม่มี I/O ภายนอก | `InMemoryUserRepository`, `InMemoryPartyRepository` |

สิ่งสำคัญคือ `jest.fn()` ไม่ได้แปลว่าเป็น Mock เสมอไป ชนิดของ Double ขึ้นอยู่กับ **เจตนาในการใช้งาน**

ตัวอย่าง:

```ts
jest.fn().mockResolvedValue(null)
```

ถ้าใช้เพื่อป้อนค่า `null` ให้ SUT ถือเป็น **Stub**

แต่:

```ts
expect(tokens.issue).toHaveBeenCalledWith(...)
```

เป็นการตรวจ Interaction จึงทำหน้าที่เป็น **Mock**

---

# Part A — AccountService และ Test Doubles

ไฟล์:

```text
app/test/unit/accountService.test.ts
```

## 1. Dummy

```ts
const dummyTokens: TokenService = {
  issue: () => {
    throw new Error('dummy TokenService should not be used');
  },
  verify: () => {
    throw new Error('dummy TokenService should not be used');
  },
};
```

`AccountService` ต้องรับ `TokenService` ผ่าน Constructor แต่ `register()` ไม่ควรใช้ Token Service

ดังนั้น Test ส่ง Dummy เข้าไปเพียงเพื่อให้ Constructor ครบ หาก Production Code เปลี่ยนแล้ว `register()` เริ่มเรียก Token Service โดยไม่ตั้งใจ Dummy จะ Fail ทันที ทำให้พบการเปลี่ยน Behavior ได้ง่ายกว่าใช้ `null as any`

---

## 2. Stub

ตัวช่วย:

```ts
stubDistricts(true)
stubDistricts(false)
```

ใช้กำหนดสถานการณ์ว่าเขตเลือกตั้งมีอยู่หรือไม่

ตัวอย่าง Failure Path:

```text
DistrictRepository.findById('CM-1')
            ↓
          null
            ↓
AccountService.register()
            ↓
ValidationError('unknown district')
```

Test ไม่ได้สนใจว่า Stub ถูกเรียกกี่ครั้ง แต่สนใจผลลัพธ์ของ SUT จึงเป็น State/Result Verification ไม่ใช่ Interaction Verification

---

## 3. Spy

Test:

```text
stores a password hash instead of plain text and trims user fields
```

ใช้:

```ts
const create = jest.spyOn(users, 'create');
```

`users` ยังคงเป็น `InMemoryUserRepository` จริงและ `create()` ยังทำงานตามปกติ แต่ Spy จะบันทึก Argument ที่ SUT ส่งเข้าไป

หลัง Act สามารถตรวจ:

- Password ถูก Hash ก่อนบันทึก
- Plain-text Password ไม่ถูกเก็บ
- Hash สามารถ Verify กลับด้วย Password เดิม
- `firstName`, `lastName`, `address` ถูก Trim แล้ว

กรณีนี้เหมาะกับ Spy เพราะ `passwordHash` มี Random Salt จึงไม่ควรเทียบกับ Exact Value

---

## 4. Mock

ใน `login()` การออก Token เป็นพฤติกรรมที่สำคัญของ Service จึงตรวจ Interaction:

```ts
expect(tokens.issue).toHaveBeenCalledWith({
  userId: voter.id,
  role: 'VOTER',
  districtId: 'CM-1',
});
```

และใน Failure Path:

```ts
expect(tokens.issue).not.toHaveBeenCalled();
```

ความหมายคือ:

- Login สำเร็จ → ต้องออก Token ให้ Principal ที่ถูกต้อง
- Password ผิด → ต้องไม่ออก Token

ในตัวอย่างเดียวกัน `mockReturnValue('token-123')` ทำหน้าที่เป็น Stub ด้วย เพราะป้อน Return Value กลับเข้าสู่ SUT ขณะที่ Assertion เรื่องการเรียกทำหน้าที่เป็น Mock

Object หนึ่งตัวจึงสามารถมีหลายบทบาทได้

---

# Part B — Fake Repository

ไฟล์:

```text
app/test/support/inMemoryRepositories.ts
app/test/unit/electionAdminService.test.ts
```

สร้าง Fake Repository 3 ตัว:

```text
InMemoryUserRepository
InMemoryPartyRepository
InMemoryCandidateRepository
```

Fake แตกต่างจาก Stub ตรงที่ Fake มี Logic และ State แบบง่ายของตัวเอง

ตัวอย่าง:

```text
create party
   ↓
เก็บใน Array
   ↓
findByName()
   ↓
ได้ Party เดิมกลับมา
```

จึงเหมาะกับกรณีที่ SUT ต้องเรียก Repository หลายครั้งและข้อมูลต้องสัมพันธ์กัน

## Test ที่ใช้ Fake

### Success — Create Party

ตรวจว่า:

- ชื่อพรรคถูก Trim
- Policy ถูก Trim
- Party ถูกสร้างสำเร็จ
- สามารถค้น Party เดิมจาก Fake Repository ได้

### Success — Add Candidate

ตรวจว่า Candidate ที่สร้าง:

- อยู่ใน District ที่ถูกต้อง
- เชื่อมกับ Party ที่ถูกต้อง
- ได้ `partyName` จาก Repository
- ชื่อและนามสกุลถูก Trim
- ถูกเก็บใน Candidate Fake จริง

### Alternative / Failure — Candidate Number ซ้ำ

Arrange Candidate หมายเลข 1 ไว้ก่อน จากนั้นพยายามเพิ่ม Candidate อีกคนด้วยหมายเลขเดียวกันใน District เดิม

Expected Result:

```text
ConflictError(
  'candidate number already used in this district'
)
```

กรณีนี้แสดงข้อดีของ Fake เพราะ State จากการสร้าง Candidate ครั้งแรกยังคงอยู่และถูกใช้ในการตรวจครั้งที่สอง

---

# Part C — เวลาเป็น Dependency และ Fake Timers

ไฟล์:

```text
app/test/unit/jwtTokenService.test.ts
```

`JwtTokenService` ใช้ Library `jsonwebtoken` ซึ่งอ่านเวลาจากระบบเอง เราไม่ได้ Inject Clock เข้า Library โดยตรง ดังนั้นใช้ Jest Fake Timers เพื่อควบคุม `Date.now()`

ตัวอย่าง:

```ts
jest.useFakeTimers({
  now: new Date('2026-10-03T09:00:00+07:00'),
});
```

สร้าง Token อายุ 60 วินาที แล้วขยับเวลาเป็น:

```text
09:01:01
```

จากนั้นตรวจว่า:

```ts
tokens.verify(token)
```

คืนค่า `null`

ทุก Test คืน Timer กลับเป็นของจริงด้วย:

```ts
afterEach(() => {
  jest.useRealTimers();
});
```

เพื่อไม่ให้ Fake Time รั่วไปกระทบ Test อื่น

---

# ทำไมไม่ Mock PostgreSQL โดยตรง

ใน Unit Test นี้ไม่ได้ Mock `pg.Pool.query`

เหตุผลคือการ Mock SQL โดยตรงจะทำให้ Unit Test ผูกติดกับรายละเอียด Implementation เช่น SQL String, จำนวน Query หรือ Order ของ Query มากเกินไป

หากมีการ Refactor SQL โดย Behavior ของ Repository ยังเหมือนเดิม Test อาจ Fail ทั้งที่ระบบไม่ได้เสีย

แนวทางที่ใช้จึงเป็น:

```text
Service Unit Test
      ↓
Mock / Stub / Fake
      ↓
Repository Interface ของเรา
```

ส่วน Repository จริงควรนำไปทดสอบกับ PostgreSQL จริงใน Integration Test

---

# Fragile Test และการใช้ Mock เท่าที่จำเป็น

Mock มีประโยชน์เมื่อ **Interaction คือ Behavior**

ตัวอย่างที่เหมาะ:

```text
Login สำเร็จ → TokenService.issue() ต้องถูกเรียก
Login ไม่สำเร็จ → TokenService.issue() ต้องไม่ถูกเรียก
```

แต่ไม่ควรตรวจรายละเอียดทุก Method Call โดยไม่มีเหตุผล เพราะ Test จะผูกกับโครงสร้างภายในมากเกินไป

หลักที่ใช้ใน Lab นี้คือ:

1. ตรวจ Return Value / Error / State ก่อน
2. ใช้ Interaction Verification เมื่อการเรียกนั้นมีความหมายทาง Business หรือ Security
3. Mock Interface ที่เราเป็นเจ้าของ
4. ใช้ของจริงที่ไม่มี I/O เมื่อทำได้

แนวคิดนี้ใกล้กับแนวทาง **Classical Testing** คือใช้ Collaborator จริงเมื่อมีต้นทุนต่ำ และใช้ Test Double เฉพาะ Boundary ที่ต้องควบคุม

---

# ไฟล์ที่เพิ่มใน Lab 03

```text
app/test/
├── support/
│   └── inMemoryRepositories.ts
└── unit/
    ├── accountService.test.ts
    ├── electionAdminService.test.ts
    └── jwtTokenService.test.ts

labs/
└── lab_03/
    └── README.md
```

Lab 02 Tests ยังคงอยู่และสามารถรันร่วมกันได้

---

# วิธีรัน

จาก Repository Root:

```bash
git switch jest/lab/03-test-doubles
cd app
npm install
npm run test:unit
```

ดูชื่อ Test แบบละเอียด:

```bash
npx jest --selectProjects unit --verbose
```

รันเฉพาะ AccountService:

```bash
npx jest test/unit/accountService.test.ts
```

รันเฉพาะ ElectionAdminService:

```bash
npx jest test/unit/electionAdminService.test.ts
```

รันเฉพาะ JWT:

```bash
npx jest test/unit/jwtTokenService.test.ts
```

---

# สิ่งที่ควรสังเกตจากผล Test

Output ควรอ่านแล้วสื่อ Behavior ได้ เช่น:

```text
AccountService.register
  ✓ rejects registration when the district does not exist
  ✓ stores a password hash instead of plain text and trims user fields

AccountService.login
  ✓ issues a token with the registered voter principal
  ✓ rejects a wrong password without issuing a token

ElectionAdminService
  ✓ creates a party using the in-memory repository fake
  ✓ adds a candidate and keeps repository state consistent
  ✓ rejects a duplicate candidate number in the same district

JwtTokenService
  ✓ returns the principal while the token is still valid
  ✓ returns null after the token has expired
```

---

# สรุป Test Doubles ที่ใช้จริงใน Branch

| Double | อยู่ตรงไหน | เหตุผล |
|---|---|---|
| Dummy | `dummyTokens` | Constructor ต้องการ แต่ `register()` ไม่ควรใช้ |
| Stub | `stubDistricts()` | กำหนดว่ามี/ไม่มี District |
| Spy | `jest.spyOn(users, 'create')` | ตรวจข้อมูลที่ SUT ส่งไปบันทึก |
| Mock | `tokens.issue` | ตรวจ Protocol ของการออก Token |
| Fake | In-memory repositories | ต้องการ State ที่สอดคล้องโดยไม่ใช้ Database |
| Fake Timer | `jest.useFakeTimers()` | ควบคุมเวลาของ JWT อย่าง deterministic |

---

# สิ่งที่ได้เรียนรู้

Test Double ไม่ได้มีเป้าหมายเพื่อ Mock ทุกอย่าง แต่ใช้เพื่อควบคุม Boundary ที่ทำให้ Unit Test ทดสอบยากหรือไม่ deterministic

การแยก Dummy, Stub, Spy, Mock และ Fake ตามหน้าที่ช่วยให้ Test ชัดขึ้นว่าแต่ละ Dependency ถูกแทนที่เพื่ออะไร การใช้ Constructor Injection ทำให้สามารถเลือก Collaborator ที่เหมาะกับ Test ได้โดย Production Code ไม่ต้องรู้ว่ากำลังถูกทดสอบ

Stub เหมาะกับการกำหนดสถานการณ์, Spy เหมาะกับการตรวจข้อมูลที่ SUT ส่งออก, Mock เหมาะเมื่อ Interaction เป็นส่วนหนึ่งของ Requirement และ Fake เหมาะเมื่อจำเป็นต้องรักษา State หลายขั้นตอน

แนวทางนี้ทำให้ Unit Test เร็ว ควบคุมได้ และสามารถจำลองทั้ง Success Path และ Failure Path ได้โดยไม่ต้องพึ่ง Database หรือ Service ภายนอก
