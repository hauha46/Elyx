# Elyx Resource Allocator

A Next.js implementation of Elyx's HealthSpan AI Resource Allocator. It takes a member's **prioritised health action plan** plus the **3-month availability** of the people and equipment that support them, and produces a personalised, believable weekly calendar — placing each activity at a realistic time, substituting backups when the primary can't fit, sliding appointments to the next available day, and flagging anything that genuinely can't happen.

See [`task.md`](task.md) for the original brief.

## The problem

HealthSpan AI hands the member an ordered list of **activities** — things like "Zone-2 run 3×/week (trainer-led)", "Berberine 500 mg twice daily", "Cardiologist check-in monthly". Each activity carries how often it must happen, who facilitates it, where, whether it can be done remotely, backup substitutes, and what to do if it's skipped.

Those activities compete for **constrained resources**: a trainer who only works Mon/Wed/Fri mornings, a sauna that's free at limited hours, specialists with one clinic day a week, and the member's own time. Members also **travel**, which removes access to on-site resources.

The Resource Allocator's job is to reconcile the two into a concrete calendar — respecting priority, never double-booking a resource or the member, and *adapting to availability* rather than dropping things on the floor.

## What to review (start here)

The scheduler is the heart of the project. It's a **pure function** — `(plan, availability, dateRange) → schedule` — with no I/O, so it's deterministic and fully unit-tested.

| Read this | Why it matters |
|---|---|
| [lib/scheduler/scheduler.ts](lib/scheduler/scheduler.ts) | The main loop: sort by priority, expand each activity, then place → substitute → slide → skip. Travel self-care lives here. |
| [lib/scheduler/slot-finder.ts](lib/scheduler/slot-finder.ts) | Interval math (facilitator ∩ equipment ∩ member) **plus time anchoring** — why events land at believable times instead of dawn. |
| [lib/scheduler/instances.ts](lib/scheduler/instances.ts) | Frequency → concrete dates, and the multi-dose day-part split. |
| [__tests__/](__tests__/) | 44 tests. The integration tests in [sample-data.test.ts](__tests__/integration/sample-data.test.ts) encode the invariants (no double-booking, no member overlap, meals in believable bands). |
| [lib/sample-data/](lib/sample-data/) | Two realistic personas (see [Sample Data](#sample-data)). |

The [Algorithm](#algorithm) section below walks the whole flow with a worked example.

## Features

- Pre-loaded sample plans (Mei Lin Chen, Bao Nguyen) plus drag-and-drop JSON upload for custom data
- In-app schema reference with downloadable sample templates
- Weekly calendar grid + per-day detail sheet
- Right-side sheets surfacing skipped and substituted activities with their adjustments
- Calendar export to `.ics` (compatible with Google Calendar, Apple Calendar, Outlook)
- Deterministic, fully-tested scheduler (44 unit + integration tests)

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (base-ui primitives)
- **Zod 4** for input validation
- **date-fns** for date arithmetic
- **Vitest** + **Testing Library** for tests

## Getting Started

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Project Structure

```
app/
  page.tsx                  Main UI (sample picker, upload, calendar, export)
  actions/schedule.ts       Server action wrapping the scheduler
  layout.tsx                Root layout + TooltipProvider
components/
  ui/                       shadcn primitives (Button, Card, Dialog, Sheet, Tooltip…)
  sample-picker.tsx         Dropdown of pre-loaded personas
  upload-panel.tsx          Two-zone upload dialog
  upload-zone.tsx           Reusable drag-and-drop file zone
  schema-help-dialog.tsx    Schema reference + sample downloads
  weekly-calendar.tsx       CSS-grid week view
  day-detail-sheet.tsx      Side panel listing a day's events
  failures-sheet.tsx        Side panel for skipped / substituted events
  summary-bar.tsx           Clickable count badges
  empty-state.tsx           Pre-generate hero card
lib/
  scheduler/                Pure scheduler: (plan, avail, range) → schedule
    types.ts
    schemas.ts              Zod validation
    instances.ts            Frequency → target dates (+ multi-dose day-parts)
    slot-finder.ts          Find an available, well-timed slot for an activity
    scheduler.ts            Priority-based greedy algorithm
    index.ts                Public barrel
  ics.ts                    Schedule → .ics text
  sample-data/              Pre-loaded Mei Lin Chen + Bao Nguyen JSON
__tests__/                  Unit + integration tests
scripts/
  gen-availability.mjs      Recurring window generator
```

## Algorithm

The scheduler is **priority-based greedy** with four fallbacks. The same input always yields the same output — no randomness.

```
1. Sort activities by priority (1 = highest), so important things claim slots first.
2. For each activity, expand its frequency into concrete target dates across the range.
3. For each (activity, date), in order:
     a. PLACE      — find a well-timed slot today (see "time anchoring" below).
     b. SUBSTITUTE — if it can't fit, try each backupActivityId today, in order.
     c. SLIDE      — if still nothing, look forward a bounded number of days
                     (weekly ≤3, monthly ≤20) for the next day it can happen.
     d. SKIP       — only if a–c all fail; record adjustmentIfSkipped.
4. Summarise: scheduled / substituted / skipped.
```

A resource (and the member, tracked as a `__member__` pseudo-resource) is marked
consumed the moment something is placed, so step a never double-books.

### Worked example: a "3×/week" activity

Take Mei Lin's **Morning run** — `{ times: 3, per: "week" }`, trainer-led, `preferredTimeOfDay: "morning"`, with **Evening walk** as a backup. The range is 12 weeks (2026-06-01 → 2026-08-23, 84 days).

1. **Expand the frequency.** `instances.ts` computes `totalInstances = round(84 / 7 × 3) = 36` and spaces them evenly: `step = 84 / 36 ≈ 2.33` days, so the run is targeted roughly every 2–3 days — about three times per week, not three days in a row. (Multi-dose-per-*day* activities, e.g. a 2×/day pill, instead get tagged morning/evening so they spread across the day.)

2. **Place each instance.** For each target date, `slot-finder.ts` intersects the trainer's free windows with the member's free time, restricts to the morning band, and picks a slot near the **07:30 morning anchor**. If the trainer isn't available that day (Daichi only works Mon/Wed/Fri), placement fails →

3. **Substitute.** Try the backup, **Evening walk** (no trainer needed), the same day. If that also can't fit →

4. **Slide.** Look forward up to 3 days (it's a weekly activity) for a day the run *can* happen. If nothing in that window →

5. **Skip.** Record it with the adjustment ("Add 15 min to next walk"), surfaced in the failures sheet.

### Time anchoring (why the calendar looks human)

A naive scheduler places everything at the earliest free minute, so the day stacks up from 05:00 — three supplements at 05:00/05:15/05:30 and breakfast at 05:45. Instead, each activity targets a believable **anchor** and searches outward from it:

- An explicit `preferredTimeOfDay` anchors mid-band — breakfast ~07:30, lunch ~12:30, dinner ~18:30.
- Otherwise a sensible default by type (medication → morning, therapy → evening; meals/fitness carry their own band in the data; consultations snap to the facilitator's clinic window).
- Placement prefers the earliest slot **at or after** the anchor, falling back to the nearest slot before it — so a full morning pushes the next item to 08:00, never back to dawn.

### Travel

During travel the system asks *what does this activity actually need?*

- **Self-administered** (no facilitator, no equipment — vitamins, meals, bodyweight mobility) → continues, noted "During &lt;location&gt;". You don't stop taking your vitamins because you're in another city.
- **Facility/facilitator-bound but remote-eligible**, on a trip that allows remote → done remotely (video call), placed at a real member slot.
- **Facility-bound and not remote-capable** (the on-site sauna, the trainer-led gym session) → skipped for the trip, with its adjustment.

## Design decisions & limitations

- **Greedy by priority, not global optimisation.** A solver could in theory pack a few more low-priority items into contested days, but greedy-by-priority is simple, fast, deterministic, and — crucially — *explainable*: you can always say why something landed where it did. For a health calendar that a human concierge reviews, that legibility matters more than squeezing the last slot.
- **Pure function, no persistence.** `schedule()` has no I/O. That makes it trivially testable and lets the UI/server action be a thin wrapper.
- **Floating local time in `.ics`.** Exports use no timezone, so events import as local time wherever the member opens them — right for a demo without timezone-aware availability data.
- **Bounded date-sliding.** Sliding adapts to availability but stays near the intended date; it won't move a monthly consult by two months. Anything beyond the window is surfaced as a skip for manual rescheduling.

## Testing

```bash
pnpm test         # unit + integration
pnpm typecheck    # tsc --noEmit
pnpm build        # production build
```

**44 tests** cover frequency expansion and multi-dose splitting, slot finding and time anchoring, scheduler priority/backup/slide/travel logic, the no-double-booking and no-member-overlap invariants, zod schemas, the server action, `.ics` generation, and sample-data realism.

## Sample Data

Two pre-loaded personas (Mei Lin Chen — East Asian, cardio/longevity focus; Bao Nguyen — Southeast Asian, strength/metabolic focus). Together they exceed 100 scheduled instances over 12 weeks (2026-06-01 to 2026-08-23). Each persona has 17 activities and 6–7 resources (trainer / specialist / allied-health / equipment) plus a travel block — Mei Lin's is remote-friendly (Shanghai), Bao's is not (Hanoi). Authored manually in [`lib/sample-data/`](lib/sample-data/); availability windows generated by [`scripts/gen-availability.mjs`](scripts/gen-availability.mjs).
