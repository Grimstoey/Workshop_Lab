# Facilitator Guide

Workshop: **Automated Testing in Real Industry** · CMU CAMT · ส.–อา. 3–4 ตุลาคม 2026 · 09:00–16:30
ผู้เรียน: นักศึกษา ป.โท ~9 คน + ป.ตรี 2–3 คน ที่เคยเขียนระบบเลือกตั้งในวิชา backend

| ไฟล์ | ใช้เมื่อไหร่ |
|---|---|
| [prep-checklist.md](prep-checklist.md) | ก่อน workshop: timeline, dry run, offline kit, ตั้งห้อง |
| [run-sheet.md](run-sheet.md) | ระหว่าง workshop: ตารางเวลาทีละ block, branch, checkpoint, สิ่งที่ตัดได้ |
| [troubleshooting.md](troubleshooting.md) | เมื่อเครื่องผู้เรียนมีปัญหา: git, Docker, Liquibase, Jest, e2e, CI |
| [verify-branches.sh](verify-branches.sh) | dry run: ตรวจว่าทุก branch ยังผ่าน test |

เอกสารอื่นที่ต้องใช้คู่กัน

| | |
|---|---|
| [`slides/`](../slides/) | Marp decks 01–08 (speaker notes อยู่ใน presenter view) |
| [`labs/`](../labs/) | โจทย์แต่ละ lab (อยู่บน branch `jest/lab/NN-*`) |
| [`checklist/`](../checklist/) | Readiness Checklist — รอบ 1 เช้า Day 1, รอบ 2 ท้าย Day 2 |
| [`setup/`](../setup/) | สิ่งที่ผู้เรียนต้องทำก่อนมา |
| `labs/demo-testcontainers.md` · `labs/demo-playwright-browser.md` | demo script (อยู่บน branch `demo/*`) |

## หลักในการสอน

1. **พูดน้อย ทำเยอะ** — lecture ~30% ของเวลา · สไลด์เป็นแค่กรอบ ความเข้าใจเกิดใน lab
2. **ตามไม่ทันไม่ใช่ปัญหา** — ทุก lab เริ่มจากเฉลยของ lab ก่อน · `git stash -u` แล้ว switch ได้เสมอ บอกเรื่องนี้ตั้งแต่ชั่วโมงแรก
3. **เห็นแดงก่อนเขียว** — เวลาเฉลยบนจอ ทำให้ test แดงก่อนทุกครั้ง แล้วอ่าน error ด้วยกัน
4. **ใช้คำถามเดียวกันตลอด 2 วัน** — *"ถ้า test นี้แดง เรารู้ได้แม่นแค่ไหนว่าพังเพราะอะไร และต้องจ่ายเท่าไหร่เพื่อจะรู้?"*
5. **ไม่ใช้ AI ใน lab** — ถ้าเห็นใช้ ถามว่า test ที่ได้ smell อะไรบ้าง แล้วเก็บไว้คุยช่วงท้าย Day 2
6. **โยงกลับไปที่โปรเจกต์ของผู้เรียน** — ทุก lab ถามว่า "ในโปรเจกต์คุณ ตรงนี้คืออะไร?"

## Branches

```text
main                          ระบบอ้างอิง + test infra + CI + slides + facilitator guide
jest/lab/NN-name              จุดเริ่มต้นของ lab NN
jest/solution/NN-name         เฉลย lab NN = จุดเริ่มต้นของ lab NN+1
demo/testcontainers           จาก solution/04
demo/playwright-browser       จาก solution/06
vitest/*                      (หลัง workshop)
```

Slides และ facilitator guide อยู่บน `main` เท่านั้น — ไม่อยู่บน lab branch
