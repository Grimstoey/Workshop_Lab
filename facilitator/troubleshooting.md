# Troubleshooting

ปัญหาที่น่าจะเจอในห้อง เรียงตามช่วงของ workshop · คำสั่งทั้งหมดรันใน `app/`

**กฎทั่วไปเมื่อ database ทำตัวแปลกหลังสลับ branch:**

```bash
npm run db:reset:test     # สร้าง db-test ใหม่ (tmpfs → ว่างเปล่า)
npm run test:integration  # migrate ใหม่ + รัน test
```

---

## Git — สลับ branch ไม่ได้

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `Your local changes ... would be overwritten by checkout` | มีไฟล์ที่แก้ไว้ | `git stash -u` แล้ว `git switch ...` |
| `untracked working tree files would be overwritten` | สร้างไฟล์ใหม่ (เช่น `test/support/builders.ts`) ที่ branch ปลายทางก็มี | `git stash -u` — **ต้องมี `-u`** เพราะไฟล์ใหม่ยังไม่ถูก track |
| อยากดูเฉลยแค่ไฟล์เดียว | | `git show jest/solution/04-test-data:app/test/support/builders.ts` |
| อยากได้งานตัวเองคืน | | `git switch <branch เดิม>` แล้ว `git stash pop` |

> `labs/README.md` บน lab branch เขียนว่า `git stash` (แก้บน `main` แล้ว) — ให้บอกห้องว่าใช้ `git stash -u`

---

## Docker & ports

| อาการ | แก้ |
|---|---|
| `Cannot connect to the Docker daemon` | เปิด Docker Desktop / OrbStack / `colima start` |
| `port is already allocated` (5432, 5433, 5434, 3000) | `docker ps` หา container ที่ใช้ port นั้น (มักเป็น Postgres จากวิชา backend) → `docker stop <id>` · Postgres ที่ติดตั้งในเครื่อง: `lsof -i :5433` |
| port 3000 ชนตอน `test:e2e` | ปิด `npm run dev` ที่เปิดค้างไว้ |
| Disk เต็ม | `docker system prune` (ลบ container/image ที่ไม่ได้ใช้ — ถามเจ้าของเครื่องก่อน) |
| Windows: ช้ามาก / path แปลก | ให้ย้าย repo เข้าไปใน WSL (`~/` ของ Ubuntu) ไม่ใช่ `/mnt/c/...` |

---

## Liquibase

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `Validation Failed: 1 changesets check sum` | แก้ changeset ที่รันไปแล้ว (Lab 04 A2 — ตั้งใจ) | `git checkout -- db/` แล้ว `npm run db:reset:test && npm run db:migrate:test` |
| แก้ changelog แล้ว Liquibase ไม่เห็น | changelog ถูก `COPY` เข้า image — `docker compose run` ที่ไม่มี `--build` ใช้ image เก่า | ใส่ `--build`: `docker compose run --rm --build liquibase ...` (script `db:migrate:test` มีให้แล้ว) |
| `rollback` แล้วไม่มีอะไรเกิดขึ้น | tag ไม่มีอยู่ หรือ tag หลัง changeset ที่อยากถอย | `docker compose run --rm liquibase history` ดูลำดับ |
| `Cannot find database driver: org.postgresql.Driver` | Dockerfile ของตัวเอง (Lab 08) ไม่มีบรรทัด `lpm` | Liquibase 5 ไม่มี JDBC driver ในตัว → `RUN lpm add postgresql --global` (มีใน template) |
| `update-testing-rollback` fail (Lab 05 C2) | `--rollback` ของ changeset ใด changeset หนึ่งผิด | อ่าน error ว่า changeset ไหน → แก้ `--rollback` |

---

## Jest

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:5433` | db-test ไม่ได้เปิด | ใช้ `npm run test:integration` (เปิด DB + migrate ให้) ไม่ใช่ `npx jest` ตรง ๆ · หรือ `npm run db:up:test` |
| `relation "users" does not exist` | ยังไม่ได้ migrate | `npm run db:migrate:test` |
| `column "closed_at" does not exist` | อยู่ Lab 06+ แต่ DB ยังเป็น schema เก่า | `npm run db:migrate:test` |
| integration test ผ่านทีละไฟล์ แต่รวมกันแล้วแดง | รันโดยไม่มี `--runInBand` → หลายไฟล์ truncate DB เดียวกันพร้อมกัน | ใช้ `npm run test:integration` หรือใส่ `--runInBand` |
| แดงเฉพาะตอนรันต่อจาก test อื่น | ข้อมูลรั่ว — ลืม `truncateAll` ใน `beforeEach` หรือไม่ได้รีเซ็ต `districts.closed_at` (Lab 06) | ดู `test/integration/support/database.ts` ในเฉลย |
| `Jest did not exit one second after the test run has completed` | **ปกติใน Lab 04–07** — legacy `voteRoutes.ts` ใช้ `pool` global ที่ไม่มีใครปิด | หายไปเองหลัง Lab 07 Part B · ในโปรเจกต์ตัวเอง: `afterAll(() => pool.end())` · หาต้นเหตุด้วย `npx jest --detectOpenHandles` |
| test แดงด้วย `TS2345` / `TS2339` | ts-jest ตรวจ type ทุกไฟล์ test — **ตั้งใจ** | อ่าน error และแก้ type เหมือนแก้ compile error |
| `SyntaxError: Cannot use import statement outside a module` จาก `@faker-js/faker` | ติดตั้ง faker v10 (ESM-only) | `npm i -D @faker-js/faker@9` |
| test ที่มี `rejects.toThrow` ผ่านเสมอแม้โค้ดผิด | ลืม `await` หน้า `expect(...).rejects` | ใส่ `await` |
| integration test ค้างเมื่อใช้ `jest.useFakeTimers()` | fake timers หยุด timer ที่ `pg` / supertest ใช้ | ใช้ fake timers เฉพาะใน unit test · integration ใช้ `Clock` ที่ inject |
| coverage gate fail (Lab 05) | ตัวเลขต่ำกว่า `coverageThreshold` | ดู `coverage/lcov-report/index.html` ว่าบรรทัดไหนไม่ถูกรัน |

---

## <a id="e2e"></a>Playwright / e2e

acceptance test ใน Lab 06 Step 1 ต้อง **แดงที่ 404** ตอน `POST /districts/CM-3/close` — แดงแบบอื่นแปลว่า setup ผิด:

| อาการ | สาเหตุ | แก้ |
|---|---|---|
| `401` ตอน `api.login(COMMISSIONER)` | db-e2e ไม่มีบัญชี bootstrap (context `e2e`) | รันผ่าน `npm run test:e2e` ทั้งก้อน (สร้าง db-e2e ใหม่ + migrate context `e2e`) |
| `409 election is not open` ตอนลงคะแนน | ไม่มีแถวใน `election` | เหมือนข้อบน — `901-e2e-seed.sql` ต้องถูกรัน |
| `ECONNREFUSED ::1:3000` / timeout | app container ไม่ขึ้น | `docker compose --profile e2e logs app` · port 3000 ถูกใช้อยู่ |
| แก้โค้ดแล้ว e2e ยังเห็นพฤติกรรมเดิม | รัน `npx playwright test` เดี่ยว ๆ → ยิงไปที่ container เก่า | ใช้ `npm run test:e2e` (build image ใหม่ทุกครั้ง) |
| `test:e2e` ครั้งแรกช้ามาก / npm error ใน Docker build | build image ต้อง `npm ci` ผ่านอินเทอร์เน็ต | ให้ทำเป็นการบ้านคืน Day 1 — ดู "การบ้านคืน Day 1" ใน [run-sheet](run-sheet.md) |
| `Executable doesn't exist ... chromium` | รัน browser demo โดยยังไม่ได้ติดตั้ง browser | `npx playwright install chromium` (API test ไม่ต้องใช้) |
| e2e แดงเพราะเลขบัตรซ้ำ (409) | db-e2e ไม่ได้ถูกสร้างใหม่ | `npm run test:e2e` ใช้ `--force-recreate` อยู่แล้ว — อย่ารัน `playwright test` ซ้ำโดยไม่ recreate |

---

## Testcontainers (demo)

| อาการ | แก้ |
|---|---|
| `Could not find a working container runtime strategy` | OrbStack / Colima ไม่มี `/var/run/docker.sock` — `globalSetup.js` ในเดโมอ่าน `docker context` ให้แล้ว ถ้ายังไม่ได้: `export DOCKER_HOST=$(docker context inspect --format '{{.Endpoints.docker.Host}}')` |
| Colima: ryuk container start ไม่ได้ | `export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock` |
| teardown พัง / connection terminated | pool ที่ไม่ได้ปิด (legacy pool) — เดโมปิด `legacyPool` ใน `elections.test.ts` แล้ว |

---

## CI (Lab 05)

| CI | อาการ | แก้ |
|---|---|---|
| GitLab | `Cannot connect to the Docker daemon at tcp://docker:2375` | runner ต้องตั้ง `privileged = true` ใน `config.toml` |
| GitLab | integration test `ECONNREFUSED` | ใน dind port อยู่ที่ host `docker` — `DATABASE_URL` ใน `.gitlab-ci.yml` ชี้ไป `docker:5433` แล้ว อย่าเปลี่ยนเป็น `localhost` |
| Jenkins | `permission denied ... docker.sock` | เพิ่ม user `jenkins` เข้า group `docker` แล้ว restart agent |
| Jenkins | `Tool type "nodejs" does not have an install of "node-24"` | ตั้งชื่อ NodeJS installation เป็น `node-24` ใน Manage Jenkins → Tools |
| Jenkins | build ที่สองพังเพราะ port | `disableConcurrentBuilds()` อยู่ใน `Jenkinsfile` แล้ว — ตรวจว่า build เก่าจบและ `post { always }` ได้รัน |
| ทุกตัว | ผ่านในเครื่องแต่แดงใน CI | ดูว่า CI รัน script เดียวกันไหม · ลอง `docker compose down -v` แล้วรันในเครื่องใหม่ทั้งหมด |

> `Jenkinsfile` ยังไม่เคยถูกรันบน Jenkins จริง — ถ้าใครจะใช้ในห้อง ให้ลองก่อนวัน workshop
