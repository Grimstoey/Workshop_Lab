# Readiness Checklist — Software Testing in Real Industry

ประเมินโปรเจกต์ระบบเลือกตั้ง **ของตัวเอง** 2 รอบ: Day 1 เช้า (ก่อนเริ่ม) และ Day 2 ท้ายวัน (หลังจบ)

คะแนน: **0** = ยังไม่มี · **1** = มีบางส่วน / ทำด้วยมือ · **2** = มีครบ และทำงานอัตโนมัติ

| # | หมวด | ข้อ | ตัวอย่างหลักฐาน ("2 คะแนน" หน้าตาเป็นอย่างไร) | รอบ 1 | รอบ 2 |
|---|---|---|---|---|---|
| 1 | Structure | ระบุ test boundary ของระบบชัดเจน | มีเอกสาร/README บอกว่า unit, component, e2e ทดสอบอะไร และอยู่ที่ไหน | | |
| 2 | Structure | แยก test ที่ไม่มี I/O ออกจาก test ที่ต้องใช้ database | `npm run test:unit` รันได้โดยไม่ต้องเปิด Docker | | |
| 3 | Structure | รัน test ทั้งหมดได้ด้วยคำสั่งเดียว | `npm test` จาก clone ใหม่ ไม่ต้องทำขั้นตอนมือ | | |
| 4 | Environment | database สำหรับ test สร้างจาก migration ที่ versioned | changelog/migration อยู่ใน git, test DB สร้างใหม่ได้ทุกครั้ง | | |
| 5 | Environment | ไม่มีขั้นตอน database ที่ต้องทำด้วยมือ | ไม่มี "import dump.sql ก่อนนะ" หรือ "สร้าง table นี้เอง" | | |
| 6 | Environment | test รันได้เหมือนกันทั้งในเครื่องและใน CI | CI เรียก script เดียวกับที่รันในเครื่อง และรันทุก push | | |
| 7 | Data | ข้อมูลใน test สร้างด้วย builder / factory ไม่ใช่ fixture ก้อนเดียวที่ทุก test ใช้ร่วมกัน | `aVoter().inDistrict('CM-1').build()` | | |
| 8 | Data | test แต่ละตัวไม่ขึ้นกับกันและกัน | รันตัวเดียว, สลับลำดับ, หรือรันซ้ำ ก็ได้ผลเหมือนเดิม | | |
| 9 | Data | ควบคุมเวลาและค่าสุ่มได้ | inject `Clock`, fake timers, `faker.seed()` | | |
| 10 | Design | dependency สำคัญ inject ได้ (มี seam) | DB, เวลา, token service ส่งเข้ามาผ่าน constructor/factory | | |
| 11 | Design | ใช้ test double ถูกระดับ | mock/stub เฉพาะ boundary ที่เราเป็นเจ้าของ interface, ไม่ mock ทุกอย่าง | | |
| 12 | Design | ส่วน legacy ที่เสี่ยงที่สุดมี characterization test | ก่อนแก้โค้ดเก่า มี test จับพฤติกรรมปัจจุบันไว้ | | |
| | | | **รวม (เต็ม 24)** | | |

## หลังให้คะแนน

- ข้อไหนได้ 0 ที่ **แก้ได้ภายใน 1 วัน**? → เขียนเป็นงานถัดไปของตัวเอง
- ข้อไหนที่ทีมใน industry มักข้าม แล้วค่อยมาจ่ายทีหลัง? (คุยกันตอนปิด Day 2)
