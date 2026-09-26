# Prep Checklist

## Timeline

| วันที่ | ใคร | อะไร | ✓ |
|---|---|---|---|
| ส. 26 ก.ย. | facilitator | lab branches ครบ, slides, facilitator guide | ✅ |
| อา. 27 ก.ย. | ตุ้ย | ส่ง survey (stack ที่ใช้ในโปรเจกต์) + template test case (Given / When / Then) | ☐ |
| จ. 28 ก.ย. | facilitator | host repo: GitHub `boyone/camt-software-testing` (URL ใส่ใน `setup/README.md` และ deck 08 แล้ว) ✅ · ตัดสินใจว่าจะเปิด `solution/*` ตั้งแต่แรกหรือไม่ | ☐ |
| อ. 29 ก.ย. | facilitator | push repo (`git push -u origin --all`) · ตั้ง repo เป็น public หรือเพิ่มผู้เรียนเป็น collaborator · ส่ง setup guide | ☐ |
| พฤ. 1 ต.ค. | ผู้เรียน | ส่ง screenshot `npm run doctor` ✅ + test cases | ☐ |
| พฤ. 1 ต.ค. | facilitator | ไล่ตามคนที่ doctor ยังไม่ผ่าน (ดู [troubleshooting](troubleshooting.md)) · อ่าน survey → เตรียมกลุ่มตาม stack สำหรับ Lab 08 | ☐ |
| ศ. 2 ต.ค. | facilitator | dry run (ด้านล่าง) · เตรียม offline kit | ☐ |
| ส. 3 ต.ค. 08:30 | facilitator | ตั้งห้อง | ☐ |

### ตัดสินใจเรื่อง solution branches

| ทางเลือก | ข้อดี | ข้อเสีย |
|---|---|---|
| push ทุก branch ตั้งแต่แรก | ตามไม่ทันก็ switch ได้เอง, ไม่ต้องพึ่ง facilitator | คนอาจเปิดเฉลยก่อนลองเอง |
| push `solution/NN` หลังจบแต่ละ lab | บังคับให้ลองเองก่อน | facilitator ต้อง push ระหว่างสอน, ต้องมีเน็ต |

แนะนำ: **push ทุก branch** แล้วขอให้เปิดเฉลยหลังจบ lab — ผู้เรียนเป็นนักศึกษา ป.โท การเปิดเฉลยก่อนเสียประโยชน์ตัวเอง

---

## Dry run (2 ต.ค.)

1. **Clone ใหม่** ในเครื่องอื่น (หรือ user อื่น) จาก URL จริง → ทำตาม `setup/README.md` ทุกขั้น → `npm run doctor` ✅
2. **ตรวจทุก branch** (~15 นาที):
   ```bash
   cd app && npm ci && cd ..
   facilitator/verify-branches.sh
   ```
   ผลที่คาด: `tsc=ok` ทุก branch, ไม่มี `failed` · "did not exit" ขึ้นเฉพาะ `solution/04`–`06`, `lab/05`–`07` และ `demo/playwright-browser` (ตั้งใจ — Lab 07)
3. **Demos**: `demo/testcontainers` → `npm run test:integration:tc` · `demo/playwright-browser` → `npx playwright install chromium` แล้ว `npx playwright test e2e/browser --headed`
4. **Slides**: `cd slides && npm install && npm run pdf` → เปิด PDF ทุกไฟล์ดูฟอนต์ไทย · ลอง presenter view (`npm run serve` → กด `P`)
5. **จับเวลา** deck 01 (ควร ≤ 55 นาทีรวมช่วงเปิด) — ถ้าเกิน ตัดสไลด์ Contract test หรือ "…และสิ่งที่มัน *ไม่* ให้" เป็นพูดสั้น ๆ
6. **ลองทำ Lab 06 Step 1–2 เอง** จาก `jest/lab/06-outside-in` โดยไม่ดูเฉลย — lab ที่ยาวที่สุด ต้องรู้ว่าติดตรงไหน

---

## Offline kit (USB)

Wi-Fi ห้องอาจรับ 12 เครื่องโหลดพร้อมกันไม่ไหว

```bash
# repo ทุก branch ในไฟล์เดียว → ผู้เรียน: git clone election-workshop.bundle testing-workshop
git bundle create election-workshop.bundle --all

# Docker images — แยกไฟล์ตาม architecture ของเครื่องผู้เรียน (pull แล้ว save ทีละ arch)
images="postgres:17-alpine liquibase/liquibase:5.0.4 node:24-alpine"
for arch in amd64 arm64; do
  for image in $images; do docker pull --platform linux/$arch $image; done
  docker save $images -o images-$arch.tar
done
# ผู้เรียน: docker load -i images-arm64.tar   (Mac M-series)  หรือ images-amd64.tar (Intel / Windows)
# ตรวจหลัง load: docker image inspect --format '{{.Architecture}}' postgres:17-alpine
```

- installer: Node 24 LTS (macOS pkg, Windows msi), Docker Desktop
- PDF ของทุก deck (`slides/dist/*.pdf`)

⚠️ สิ่งที่ offline kit **ไม่** ช่วย: `lpm add postgresql` ตอน build Liquibase image และ `npm ci` ตอน build app image ยังต้องใช้เน็ต → นี่คือเหตุผลที่ต้องให้ผ่าน doctor และทำการบ้าน `test:e2e` ที่บ้าน

---

## ตั้งห้อง (3 ต.ค. 08:30)

- [ ] projector + สาย (HDMI / USB-C) · ตั้ง font terminal และ VS Code ให้ใหญ่ (zoom ≥ 150%)
- [ ] เปิด `slides/dist/01-why-and-boundaries.html` · เปิด terminal ที่ `app/` บน `main` · `docker compose up` ทุกอย่างพร้อม
- [ ] ปลั๊กพ่วงพอสำหรับ 12 เครื่อง
- [ ] Wi-Fi: ทดสอบ `npm ping` และ `docker pull hello-world`
- [ ] ไวท์บอร์ด (วาด boundaries / double loop) · post-it 2 สี: 🟥 ติดอยู่ · 🟩 เสร็จแล้ว — แปะที่จอ ใช้แทนการยกมือ
- [ ] พิมพ์ `checklist/README.md` คนละ 1 แผ่น (ใช้ทั้ง 2 รอบ)
- [ ] (ไม่บังคับ) พิมพ์ `labs/01-boundaries/worksheet.md` คู่ละ 1 แผ่น
- [ ] เครื่อง facilitator: `npx playwright install chromium` สำหรับ browser demo แล้ว

## ถ้ามีผู้ช่วย (TA / ตุ้ย)

- ช่วง lab: เดินดูคนที่แปะ 🟥 ก่อน · facilitator ดูภาพรวมและจับเวลา
- ช่วงเช้าแต่ละวัน 08:30–09:00: นั่งแก้เครื่องที่ doctor / `test:e2e` ยังไม่ผ่าน
- จดคำถามที่ถูกถามซ้ำ → เพิ่มใน [troubleshooting](troubleshooting.md) หลัง workshop
