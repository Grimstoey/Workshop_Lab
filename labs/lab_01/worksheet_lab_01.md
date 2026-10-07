# Worksheet — ระบบเลือกตั้ง (ระบบอ้างอิง)

Boundary: **U** = Unit · **I** = Integration · **C** = Component · **K** = Contract · **E** = End-to-end · **X** = ไม่ใช่ automated functional test

| **#** | **Test case** | **Boundary** | **เหตุผล** |
|---:|---|:---:|---|
| 1 | เลขบัตรประชาชนที่ checksum ผิด ถูกปฏิเสธตอนลงทะเบียน | **U** | เป็นการตรวจสอบกฎ/logic ของการ validate เลขบัตรประชาชน ซึ่งสามารถทดสอบฟังก์ชัน validation แยกจาก database หรือ HTTP ได้ |
| 2 | ลงทะเบียนด้วยเขตเลือกตั้งที่ไม่มีในระบบ ได้ 400 | **C** | ทดสอบพฤติกรรมของ backend ผ่าน API ว่า request ที่อ้างถึงเขตที่ไม่มีอยู่ถูกปฏิเสธด้วย HTTP 400 โดยมองระบบ backend เป็นหนึ่ง component |
| 3 | `PgUserRepository.findByNationalId` คืน user ที่ map column → field ถูกต้อง | **I** | ทดสอบการทำงานร่วมกันระหว่าง repository code กับ PostgreSQL รวมถึงการ map ข้อมูลจาก database column ไปยัง object field |
| 4 | ผู้มีสิทธิเลือกตั้ง (VOTER) เรียก `POST /parties` แล้วได้ 403 | **C** | ทดสอบ authorization ของ API ภายใน backend โดยส่ง request จริงเข้ามาที่ endpoint และตรวจ response 403 |
| 5 | ผู้ใช้ลงทะเบียน → login → ลงคะแนน → เปลี่ยนคะแนน → กกต. ปิดหีบ → ผลแสดงคะแนนถูกต้อง | **E** | ครอบคลุม user flow หลายขั้นตอนและหลายส่วนของระบบตั้งแต่ authentication, voting, closing election จนถึงผลลัพธ์สุดท้าย |
| 6 | รหัสผ่านถูกเก็บแบบ hash ไม่ใช่ plain text | **I** | ต้องตรวจผลลัพธ์ที่ถูกบันทึกจริงใน database หลังผ่าน logic การสมัครสมาชิก จึงเป็นการทดสอบการทำงานร่วมกันระหว่าง application และ persistence layer |
| 7 | หมายเลขผู้สมัครในเขตเดียวกันห้ามซ้ำ | **I** | กฎนี้มักพึ่งพา database constraint หรือการตรวจสอบข้อมูลที่มีอยู่แล้ว จึงต้องทดสอบร่วมกับ persistence/database |
| 8 | Liquibase changelog ทั้งหมด apply บน database เปล่าได้สำเร็จ | **I** | เป็นการตรวจสอบการทำงานร่วมกันระหว่าง Liquibase migration scripts กับ database จริง ไม่ใช่ business function ของผู้ใช้โดยตรง |
| 9 | ก่อนปิดหีบ `GET /districts/:id/results` ไม่แสดงคะแนน | **C** | ทดสอบ business rule ผ่าน results endpoint ของ backend ว่าก่อนปิดหีบ response ต้องไม่เปิดเผยคะแนน |
| 10 | Frontend คาดว่า results API มี field `closed` และ `candidates[].votes` | **K** | เป็นการตรวจสอบสัญญา (contract) ระหว่าง frontend และ backend ว่าโครงสร้าง response มี field ที่ consumer คาดหวัง |
| 11 | JWT ที่หมดอายุแล้ว ใช้ยืนยันตัวตนไม่ได้ | **U** | สามารถทดสอบ authentication/token verification logic ด้วย expired JWT โดยไม่ต้องใช้ database หรือระบบภายนอก |
| 12 | admin เปลี่ยน role ผู้ใช้เป็น กกต. แล้วผู้ใช้นั้นสร้างพรรคได้ | **E** | เป็น workflow ข้ามหลายฟังก์ชัน ตั้งแต่ admin เปลี่ยน role แล้ว login/authorization ใหม่จนผู้ใช้สามารถสร้างพรรคได้สำเร็จ |
| 13 | ระบบรับการลงคะแนนพร้อมกัน 1,000 ครั้งในนาทีแรกหลังเปิดหีบได้ | **X** | เป็น performance/load test ไม่ใช่ automated functional test ตาม boundary ที่กำหนด |
| 14 | ผู้มีสิทธิเห็นเฉพาะผู้สมัครในเขตของตัวเอง | **C** | ทดสอบ business behavior ของ backend/API ว่าข้อมูลที่คืนให้ voter ถูก filter ตามเขตเลือกตั้งของผู้ใช้ |
| 15 | หน้ารายละเอียดพรรคแสดงผลสวยงามบนมือถือ | **X** | คำว่า “สวยงาม” เป็นการประเมินด้าน visual/usability ที่เป็น subjective และไม่ใช่ functional behavior ที่ชัดเจน |
| 16 | หลังปิดหีบแล้ว ผู้มีสิทธิเปลี่ยนคะแนนไม่ได้ | **C** | ทดสอบ business rule ผ่านระบบ/API ว่าหลังสถานะการเลือกตั้งถูกปิดแล้ว operation เปลี่ยนคะแนนต้องถูกปฏิเสธ |

## สรุปแนวคิดในการแยก Boundary

- **U — Unit:** ทดสอบ logic หรือ function ขนาดเล็กแบบแยกส่วน โดยไม่พึ่ง database หรือ service จริง
- **I — Integration:** ทดสอบการทำงานร่วมกันของหลายส่วน เช่น application code กับ database
- **C — Component:** ทดสอบ backend/application เป็น component หนึ่งผ่าน interface เช่น HTTP API โดยไม่จำเป็นต้องครอบคลุมทั้งระบบ
- **K — Contract:** ทดสอบว่าสัญญาระหว่าง provider และ consumer เช่น schema ของ API ยังตรงกัน
- **E — End-to-end:** ทดสอบ workflow ของผู้ใช้ตั้งแต่ต้นจนจบผ่านหลายส่วนของระบบ
- **X — ไม่ใช่ automated functional test:** เช่น performance, load, usability หรือ visual quality
