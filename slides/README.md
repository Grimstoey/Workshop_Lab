# Slides

Marp decks, one per session, in the same order as the labs.

| Deck | Session | Lab |
|---|---|---|
| `decks/01-why-and-boundaries.md` | Day 1 เช้า | 01 |
| `decks/02-aaa-and-smells.md` | Day 1 บ่าย | 02 |
| `decks/03-test-doubles.md` | Day 1 บ่าย | 03 |
| `decks/04-test-data.md` | Day 1 บ่าย (+ demo Testcontainers) | 04 |
| `decks/05-ci.md` | Day 1 ท้ายวัน | 05 |
| `decks/06-outside-in.md` | Day 2 เช้า (+ demo Playwright browser) | 06 |
| `decks/07-legacy.md` | Day 2 บ่าย | 07 |
| `decks/08-own-project-and-wrap-up.md` | Day 2 ท้ายวัน | 08 + Checklist รอบ 2 |

## Build

```bash
cd slides
npm install
npm run serve     # live preview at http://localhost:8080
npm run build     # HTML → dist/
npm run pdf       # PDF → dist/ (needs Chrome, Edge or Chromium)
```

`.marprc.yml` registers the `camt` theme (`theme/camt.css`) and enables inline HTML, which the decks use for SVG diagrams and two-column layouts.

The theme loads IBM Plex Sans Thai and JetBrains Mono from Google Fonts. Build the PDF before the workshop in case the room has no internet.

## Conventions

- Speaker notes are HTML comments (`<!-- ... -->`). Presenter view shows them: open the HTML and press `P`.
- Slide classes: `title`, `divider`, `lab` (green, one per lab), `dense` (smaller text for code-heavy slides).
- Code on slides is copied from the `jest/solution/*` branches. If a solution changes, update its slide too.
