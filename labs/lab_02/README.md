# Lab 02 — AAA & Test Smells

Branch: `jest/lab/02-aaa-unit`

Branch นี้เป็นการทำ Lab เรื่อง **Arrange / Act / Assert (AAA)** และ **Test Smells** จาก Workshop วันที่ 3–4 ตุลาคม 2026 ใหม่อีกครั้ง โดยเป้าหมายไม่ใช่เพียงแค่ทำให้ Unit Test ผ่านเท่านั้น แต่ต้องทำให้ Test อ่านแล้วเข้าใจพฤติกรรมที่ระบบควรทำได้เหมือนเป็นเอกสาร Specification ที่รันได้จริง

## วัตถุประสงค์การเรียนรู้

หลังจากทำ Lab นี้แล้ว ควรสามารถ:

1. จัดโครงสร้าง Unit Test ด้วยรูปแบบ **Arrange → Act → Assert**
2. ทำให้ **1 Test มุ่งตรวจสอบ 1 พฤติกรรม**
3. ตั้งชื่อ Test ให้สื่อถึงพฤติกรรมที่ระบบควรทำ
4. หลีกเลี่ยง Conditional Logic เช่น `for`, `if`, และ `try` ภายใน Test
5. ใช้ `it.each` เมื่อต้องทดสอบพฤติกรรมเดียวกันกับข้อมูลหลายชุด
6. ระบุ Test Smells ที่พบบ่อยได้
7. ใช้แนวคิด **Seam** เพื่อทำให้โค้ดทดสอบได้ง่ายขึ้นโดยไม่ต้องแก้ Global State

## แนวคิดและทฤษฎีที่ใช้ใน Lab นี้

### AAA / Four-Phase Test

แนวคิด Four-Phase Test ของ xUnit มีโครงสร้างใกล้เคียงกับ AAA ดังนี้

| Four-Phase Test | AAA | ความหมาย |
|---|---|---|
| Setup | Arrange | เตรียม SUT และข้อมูลที่ใช้ในการทดสอบ |
| Exercise | Act | เรียกพฤติกรรมหรือฟังก์ชันที่ต้องการทดสอบ |
| Verify | Assert | ตรวจสอบผลลัพธ์ที่เกิดจาก Act |
| Teardown | — | คืนค่าหรือทำความสะอาด State หลังการทดสอบ หากจำเป็น |

**SUT (System Under Test)** คือ Unit หรือพฤติกรรมที่ Test นั้นตั้งใจตรวจสอบโดยตรง

### หลักที่นำมาใช้

- **1 Test = 1 Behavior**
- ในแต่ละ Test ควรมี Act ที่ชัดเจน
- ไม่ควรมี Control Flow เช่น `for`, `if`, หรือ `try` ใน Test โดยไม่จำเป็น
- เมื่อ Test Fail ควรดูจากชื่อ Test และ Error แล้วเข้าใจได้ทันทีว่าพฤติกรรมใดผิด
- Test ควรอ่านแล้วเหมือน Specification ของระบบ ไม่ใช่คำอธิบายรายละเอียดการทำงานภายในของ Implementation

## Part A — วิเคราะห์ Test Smells

ตัวอย่าง Test ที่ตั้งใจเขียนให้ไม่ดีใน Workshop แสดงให้เห็น Test Smells หลายประเภทดังนี้

| Test Smell | ปัญหาที่เกิดขึ้น | วิธีปรับปรุง |
|---|---|---|
| **Obscure Test** | ชื่อ Test เช่น `works` หรือ `hash` ไม่บอกว่ากำลังตรวจสอบอะไร | ตั้งชื่อ Test ให้บอกพฤติกรรมที่คาดหวังอย่างชัดเจน |
| **Eager Test** | Test เดียวตรวจหลายพฤติกรรมที่ไม่เกี่ยวข้องกัน | แยกแต่ละพฤติกรรมออกเป็นคนละ Test |
| **Assertion Roulette** | มีหลาย Assertion ที่ไม่สัมพันธ์กัน ทำให้เวลาพังระบุสาเหตุได้ยาก | จำกัด Test ให้ตรวจพฤติกรรมเดียวและใช้ Assertion ที่ชัดเจน |
| **Conditional Test Logic** | ใช้ `for` หรือ `if` ใน Test ทำให้ Test เองมีโอกาสเกิด Bug หรือบาง Case ไม่ถูกตรวจ | ใช้ `it.each` และ Assertion แบบตรงไปตรงมา |
| **No assertion** | Test เรียกโค้ดแต่ไม่ตรวจผล ทำให้ผ่านได้เสมอ | ทุก Test ต้องตรวจ Observable Behavior ด้วย Assertion |

สิ่งสำคัญที่ได้จากส่วนนี้คือ **Test ที่ผ่านไม่ได้หมายความว่าเป็น Test ที่ดีเสมอไป** เพราะ Test อาจผ่านแต่ยังอ่านยาก วินิจฉัยปัญหายาก หรือไม่สามารถตรวจจับ Defect ได้จริง

## Part B — Refactor Unit Tests

### 1. การตรวจสอบเลขบัตรประชาชนไทย

ไฟล์:

`app/test/unit/thaiNationalId.test.ts`

พฤติกรรมที่ทดสอบ:

- ยอมรับเลขบัตรประชาชนที่มี Checksum ถูกต้อง
- ปฏิเสธเลขบัตรประชาชนที่มี Checksum ผิด
- ปฏิเสธข้อมูลที่มีรูปแบบไม่ถูกต้อง เช่น ค่าว่าง จำนวนหลักไม่ครบ หรือมีตัวอักษร

กรณีข้อมูลผิดรูปแบบหลายชุดใช้ `it.each` แทนการใช้ Loop เพื่อให้แต่ละ Dataset แสดงเป็น Test Case แยกกันใน Jest Output และทำให้ทราบได้ทันทีว่า Case ใด Fail

### 2. การ Hash และ Verify Password

ไฟล์:

`app/test/unit/passwords.test.ts`

พฤติกรรมที่ทดสอบ:

- `hashPassword` ต้องไม่คืนค่า Plain-text Password
- การ Hash Password เดิมสองครั้งต้องได้ค่าต่างกัน เนื่องจากใช้ Random Salt
- `verifyPassword` ต้องยอมรับ Password ที่ถูกต้อง
- `verifyPassword` ต้องปฏิเสธ Password ที่ไม่ตรงกัน
- Stored Hash ที่มีรูปแบบไม่ถูกต้องต้องถูกปฏิเสธโดยไม่ Throw Error

กรณีนี้ไม่ควรตรวจสอบ Hash ด้วยค่าคงที่ เพราะ Random Salt ทำให้ Hash ของ Password เดิมเปลี่ยนไปได้ทุกครั้ง ดังนั้น Test จึงเน้นตรวจสอบ **Behavior** ของระบบแทนการตรวจ Exact Value

### 3. การทดสอบ Configuration

ไฟล์:

`app/test/unit/config.test.ts`

พฤติกรรมที่ทดสอบ:

- อ่านค่า `PORT` จาก Environment Object ที่ส่งเข้าไป
- ใช้ Port `3000` เป็น Default เมื่อไม่ได้กำหนดค่า
- อ่านค่า `DATABASE_URL`
- อ่านค่า `JWT_SECRET`
- ใช้ Development Defaults เมื่อไม่ได้กำหนดค่าต่าง ๆ

Production Code รองรับการรับ Environment Object ผ่าน Parameter อยู่แล้ว:

```ts
loadConfig(env = process.env)
```

จุดนี้ถือเป็น **Seam** เพราะ Test สามารถ Inject Environment Object ขนาดเล็กเข้าไปได้โดยไม่ต้องแก้ `process.env` จริง จึงไม่ต้องคอย Restore Global State หลังแต่ละ Test และลดความเสี่ยงที่ Test หนึ่งจะรบกวนอีก Test หนึ่ง

## Part C — Stretch Exercise

ไฟล์:

`app/test/unit/toPublicUser.test.ts`

Test นี้ตรวจสอบว่า `toPublicUser` ต้องไม่เปิดเผย `passwordHash` ออกไปในข้อมูล User ที่ใช้ภายนอกระบบ

ใช้ Nested `describe` เพื่อช่วยสื่อบริบทของ Test:

```text
toPublicUser
  when an internal user contains a password hash
    does not expose passwordHash in the public user
```

แนวทางนี้ช่วยให้ Jest Output อ่านแล้วเข้าใจพฤติกรรมของระบบได้ทันที โดยไม่จำเป็นต้องเปิด Source Code ก่อน

## ไฟล์ที่สร้างหรือปรับปรุงใน Branch นี้

```text
app/test/unit/
├── thaiNationalId.test.ts
├── passwords.test.ts
├── config.test.ts
└── toPublicUser.test.ts
```

Test ทั้งหมดใน Lab นี้ไม่ต้องใช้ Database, HTTP Server, Docker Container หรือ External Service จึงจัดอยู่ใน **Unit Test Boundary**

## วิธีรัน Lab

เริ่มจาก Repository Root:

```bash
git switch jest/lab/02-aaa-unit
cd app
npm install
npm run test:unit
```

หากต้องการดูชื่อ Test แบบละเอียดเพื่อให้เห็นว่า Test อ่านเป็น Specification ได้หรือไม่:

```bash
npx jest --selectProjects unit --verbose
```

รันเฉพาะไฟล์:

```bash
npx jest test/unit/passwords.test.ts
```

รันเฉพาะ Test ที่ชื่อมี Keyword ที่กำหนด:

```bash
npx jest -t "checksum"
```

## สิ่งที่ควรตรวจสอบหลังรัน Test

เมื่อรัน:

```bash
npx jest --selectProjects unit --verbose
```

ชื่อ Test ควรทำให้เข้าใจพฤติกรรมของระบบได้โดยไม่ต้องเปิด Implementation ตัวอย่างเช่น:

```text
hashPassword
  ✓ never returns the plain-text password
  ✓ gives a different hash each time for the same password (random salt)

verifyPassword
  ✓ accepts the password that was hashed
  ✓ rejects a different password
```


## สรุปสิ่งที่ทำใน Branch นี้

Branch นี้ประกอบด้วยงานหลักของ Lab 02 ดังนี้

| ส่วน | สิ่งที่ทำ |
|---|---|
| AAA Structure | จัดโครงสร้าง Test ให้เห็น Arrange → Act → Assert ชัดเจน |
| Thai National ID | แยกพฤติกรรม Valid Checksum, Wrong Checksum และ Malformed Input |
| Passwords | ทดสอบ Password Hashing, Random Salt และ Password Verification |
| Configuration | ทดสอบการอ่าน Environment ผ่าน Seam โดยไม่แก้ Global State |
| Test Smells | ลด Obscure Test, Eager Test, Assertion Roulette, Conditional Test Logic และ No Assertion |
| Stretch Exercise | ตรวจว่า `toPublicUser` ไม่เปิดเผย `passwordHash` |

## สิ่งที่ได้เรียนรู้

สิ่งสำคัญจาก Lab นี้คือ คุณภาพของ Test ไม่ควรวัดจากเพียงว่า Test ผ่านหรือไม่เท่านั้น Test ที่ดีควรช่วยให้ผู้พัฒนารู้ได้อย่างรวดเร็วว่าพฤติกรรมใดผิดเมื่อเกิด Failure และควรอธิบายพฤติกรรมที่ระบบคาดว่าจะทำได้อย่างชัดเจน

การใช้ AAA ทำให้ Test มีโครงสร้างที่อ่านง่าย การตั้งชื่อ Test ตาม Behavior ช่วยให้ Test ทำหน้าที่เป็น Documentation ได้ ขณะที่การแยก 1 Test ต่อ 1 Behavior การใช้ `it.each` แทน Loop และการลด Conditional Logic ใน Test ช่วยลด Test Smells และทำให้ Unit Test ดูแลรักษาได้ง่ายขึ้น
