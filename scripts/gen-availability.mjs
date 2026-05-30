#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const START = "2026-06-01";
const END = "2026-08-23";

const dateToParts = (s) => s.split("-").map(Number);
const partsToDate = ([y, m, d]) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt;
};
const dateToStr = (dt) => {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const addDays = (dt, n) => {
  const out = new Date(dt);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
};

const startDt = partsToDate(dateToParts(START));
const endDt = partsToDate(dateToParts(END));
const dates = [];
for (let d = new Date(startDt); d <= endDt; d = addDays(d, 1)) {
  dates.push(new Date(d));
}

const dow = (dt) => dt.getUTCDay(); // 0 = Sun, 1 = Mon, ...

function buildWindows(dates, pattern) {
  const out = [];
  for (const dt of dates) {
    const d = dow(dt);
    const date = dateToStr(dt);
    const wins = pattern(d, dt);
    for (const w of wins) out.push({ date, ...w });
  }
  return out;
}

function firstMondayOfMonthOnly(dates) {
  const seenMonths = new Set();
  const out = [];
  for (const dt of dates) {
    if (dow(dt) !== 1) continue;
    const key = `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`;
    if (seenMonths.has(key)) continue;
    seenMonths.add(key);
    out.push({ date: dateToStr(dt), start: "14:00", end: "16:00" });
  }
  return out;
}

const meiLinAvailability = {
  resources: [
    {
      id: "trn-daichi",
      type: "trainer",
      name: "Daichi Sato",
      windows: buildWindows(dates, (d) =>
        [1, 3, 5].includes(d) ? [{ start: "06:00", end: "11:00" }] : []
      ),
    },
    {
      id: "diet-anh",
      type: "specialist",
      name: "Anh Trinh",
      windows: buildWindows(dates, (d) =>
        d === 2 ? [{ start: "18:00", end: "20:00" }] : []
      ),
    },
    {
      id: "cardio-tanaka",
      type: "specialist",
      name: "Dr. Kenji Tanaka",
      windows: firstMondayOfMonthOnly(dates),
    },
    {
      id: "acu-lim",
      type: "allied-health",
      name: "Mei Lim",
      windows: buildWindows(dates, (d) =>
        d === 6 ? [{ start: "10:00", end: "14:00" }] : []
      ),
    },
    {
      id: "eq-sauna",
      type: "equipment",
      name: "Infrared sauna",
      windows: buildWindows(dates, (d) => {
        if (d === 0 || d === 6) return [{ start: "08:00", end: "20:00" }];
        return [
          { start: "06:00", end: "09:00" },
          { start: "18:00", end: "21:00" },
        ];
      }),
    },
    {
      id: "eq-gym-home",
      type: "equipment",
      name: "Home gym",
      windows: buildWindows(dates, () => [{ start: "05:00", end: "22:00" }]),
    },
  ],
  travel: [
    { start: "2026-07-13", end: "2026-07-22", location: "Shanghai", remoteOk: true },
  ],
};

const baoAvailability = {
  resources: [
    {
      id: "trn-daichi",
      type: "trainer",
      name: "Daichi Sato",
      windows: buildWindows(dates, (d) =>
        [1, 3, 5].includes(d) ? [{ start: "06:00", end: "11:00" }] : []
      ),
    },
    {
      id: "endo-chen",
      type: "specialist",
      name: "Dr. Wei Chen",
      windows: buildWindows(dates, (d) =>
        d === 3 ? [{ start: "09:00", end: "12:00" }] : []
      ),
    },
    {
      id: "nutri-wong",
      type: "allied-health",
      name: "Lisa Wong",
      windows: buildWindows(dates, (d) =>
        d === 4 ? [{ start: "16:00", end: "19:00" }] : []
      ),
    },
    {
      id: "phys-mai",
      type: "allied-health",
      name: "Mai Le",
      windows: buildWindows(dates, (d) =>
        d === 5 ? [{ start: "15:00", end: "19:00" }] : []
      ),
    },
    {
      id: "eq-sauna",
      type: "equipment",
      name: "Infrared sauna",
      windows: buildWindows(dates, (d) => {
        if (d === 0 || d === 6) return [{ start: "08:00", end: "20:00" }];
        return [
          { start: "06:00", end: "09:00" },
          { start: "18:00", end: "21:00" },
        ];
      }),
    },
    {
      id: "eq-icebath",
      type: "equipment",
      name: "Ice bath",
      windows: buildWindows(dates, (d) => {
        if (d === 0 || d === 6) return [{ start: "08:00", end: "20:00" }];
        return [
          { start: "06:00", end: "09:00" },
          { start: "18:00", end: "21:00" },
        ];
      }),
    },
    {
      id: "eq-gym-home",
      type: "equipment",
      name: "Home gym",
      windows: buildWindows(dates, () => [{ start: "05:00", end: "22:00" }]),
    },
  ],
  travel: [
    { start: "2026-06-22", end: "2026-06-28", location: "Hanoi", remoteOk: false },
  ],
};

const outDir = join(__dirname, "..", "lib", "sample-data");
writeFileSync(
  join(outDir, "mei-lin-chen.availability.json"),
  JSON.stringify(meiLinAvailability, null, 2) + "\n"
);
writeFileSync(
  join(outDir, "bao-nguyen.availability.json"),
  JSON.stringify(baoAvailability, null, 2) + "\n"
);

console.log(
  `Wrote availability JSON. Mei Lin resources: ${meiLinAvailability.resources.length}, Bao resources: ${baoAvailability.resources.length}.`
);
