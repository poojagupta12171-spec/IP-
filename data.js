// =====================================================
// data.js - shared data + helper functions for all pages
// Topics used: classes, inheritance, polymorphism, loops,
// functions, variables, operators, conditional statements
// =====================================================

// ---------- OOP: class and inheritance ----------
class Person {
  constructor(name) { this.name = name; }
  describe() { return this.name; }              // will be overridden below
}

class Student extends Person {                  // Student "is a" Person
  constructor(roll, name, division, legacyRoll) {
    super(name);
    this.roll = roll;                           // roll number inside the class (starts at 1 in each class)
    this.division = division;                   // class: "A" or "B"
    this.id = division + "-" + roll;            // unique student id, e.g. "A-1" (class + roll)
    this.legacyRoll = legacyRoll;               // old school-wide roll number (101-112), used only for migration + sample data
    this.records = {};                          // LEGACY day-level records (no subject): { "2026-08-03": "P" }
    this.subjectRecords = {};                   // subject-wise records: { "java": { "2026-08-03": "P" }, "oop": {...} }
  }
  // Polymorphism: same method name, different behaviour
  describe() { return "Class " + this.division + ", Roll " + this.roll + " - " + this.name; }

  // "scope" says which records to read:
  //   "all" (default) = overall = legacy day-level records + every subject's records
  //   "legacy"        = only the old day-level records that have no subject
  //   a subject id    = only that subject's records, e.g. "java"
  recordSets(scope) {
    if (scope === "legacy") return [this.records];
    if (scope && scope !== "all") return [this.subjectRecords[scope] || {}];
    const sets = [this.records];
    for (const sub of subjects) sets.push(this.subjectRecords[sub.id] || {});
    return sets;
  }
  // Count P / A / L. If "month" is given (like "2026-08") count only that month
  count(status, month, scope) {
    let n = 0;
    for (const set of this.recordSets(scope)) {
      for (const day in set) {
        if ((!month || day.startsWith(month)) && set[day] === status) n++;
      }
    }
    return n;
  }
  total(month, scope) { return this.count("P", month, scope) + this.count("A", month, scope) + this.count("L", month, scope); }
  hasData(month, scope) { return this.total(month, scope) > 0; }   // false = nothing recorded, so show "No data" instead of 0%
  // Late is counted as attended
  percent(month, scope) {
    const t = this.total(month, scope);
    return t === 0 ? 0 : Math.round((this.count("P", month, scope) + this.count("L", month, scope)) / t * 100);
  }
}

// ---------- Mock data ----------
// "id" is the stable key used in localStorage and URLs (names can change, ids must not)
const subjects = [
  { id: "java", name: "Java Programming" },
  { id: "oop", name: "Object-Oriented Programming" },
  { id: "htmlcss", name: "HTML & CSS" },
  { id: "jsgit", name: "JavaScript & Git" }
];
function findSubject(id) {                      // "java" -> subject (or null)
  for (const sub of subjects) if (sub.id === id) return sub;
  return null;
}
// Normalise a scope coming from a dropdown or URL: "all", "legacy" or a real subject id, otherwise "all"
function validScope(v) { return v === "legacy" || findSubject(v) ? v : "all"; }
function scopeLabel(scope) {
  if (scope === "legacy") return "Legacy records (no subject)";
  const sub = findSubject(scope);
  return sub ? sub.name : "Overall (all subjects)";
}
// Fill a <select> with the subjects. allLabel adds an "overall" option, withLegacy adds the legacy option.
function fillSubjectSelect(sel, allLabel, withLegacy) {
  if (allLabel) sel.add(new Option(allLabel, "all"));
  for (const sub of subjects) sel.add(new Option(sub.name, sub.id));
  if (withLegacy) sel.add(new Option("Legacy records (no subject)", "legacy"));
}
// [old roll, name, class, chance of being absent]  (new roll numbers are assigned per class below)
const rawStudents = [
  [101, "Aarush Kapoor", "A", 0.04], [102, "Priya Patil", "A", 0.06],
  [103, "Rohan Deshmukh", "A", 0.22], [104, "Sneha Iyer", "A", 0.03],
  [105, "Kunal Mehta", "A", 0.14], [106, "Ananya Joshi", "A", 0.05],
  [107, "Vikram Singh", "B", 0.28], [108, "Neha Kulkarni", "B", 0.08],
  [109, "Siddharth Rao", "B", 0.12], [110, "Pooja Nair", "B", 0.04],
  [111, "Aditya Gupta", "B", 0.18], [112, "Ishita Verma", "B", 0.07]
];
const students = [];
const classCount = {};                          // next roll number for each class, each class starts at 1
const legacyIdMap = {};                         // old roll (101-112) -> new id ("A-1")
for (const r of rawStudents) {
  classCount[r[2]] = (classCount[r[2]] || 0) + 1;
  const st = new Student(classCount[r[2]], r[1], r[2], r[0]);
  students.push(st);
  legacyIdMap[r[0]] = st.id;
}
function findStudent(id) {                      // "A-1" -> Student (or null)
  for (const s of students) if (s.id === id) return s;
  return null;
}
function rollTag(s) {                           // small class badge + roll number, used in every table
  return '<span class="clstag" title="Class ' + s.division + ', Roll ' + s.roll + '">' + s.division + "</span>" + s.roll;
}

// ---------- Helper functions ----------
function dateKey(d) {                           // Date object -> "2026-10-02"
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function fmtDate(key) {                         // "2026-10-02" -> "02 Oct 2026"
  const p = key.split("-");
  return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function monthName(m) {                         // "2026-10" -> "October 2026"
  const p = m.split("-");
  return new Date(p[0], p[1] - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// Simple random number maker (same numbers every time, so data never changes)
let seed = 7;
function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

// All weekdays from 3 Aug 2026 till today
const days = [];
const d = new Date(2026, 7, 3);
const now = new Date();
while (d <= now) {
  if (d.getDay() !== 0 && d.getDay() !== 6) days.push(dateKey(d));
  d.setDate(d.getDate() + 1);
}
const TODAY = days[days.length - 1];

// Fill attendance for every student on every day
for (let i = 0; i < students.length; i++) {
  const chance = rawStudents[i][3];
  for (const day of days) {
    const r = rand();
    students[i].records[day] = r < chance ? "A" : r < chance + 0.07 ? "L" : "P";
  }
}

// Attendance saved by the user is kept in localStorage (the browser).
// Subject-wise storage (NEW, separate key, nothing old is touched):
//   key "attendanceSubjectsV1" = { "java": { "A-1": { "2026-10-02": "P" } }, "oop": {...} }
//   = subject id -> student id (class + roll) -> date -> status, so one record is unique per subject + student + date.
// The two keys below hold LEGACY day-level records (they have no subject and are never re-assigned to one).
// Storage v2: key "attendanceSavedV2" = { "A-1": { "2026-10-02": "P" }, "B-1": {...} }  (class + roll)
// Storage v1 (old): key "attendanceSaved" = { "101": {...} } keyed by the old roll number alone.
const SAVE_KEY = "attendanceSavedV2", OLD_KEY = "attendanceSaved", SUBJECT_KEY = "attendanceSubjectsV1";
function readStore(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return {};
  try { const o = JSON.parse(raw); return o && typeof o === "object" ? o : {}; }
  catch (e) { localStorage.setItem(key + "_corrupt_backup", raw); return {}; }   // keep unreadable data, never lose it
}
// One-way, non-destructive migration: copy old records into the new class+roll store.
// The old key is left untouched. Old rolls 101-112 map 1:1 to one student each, so nothing can land on the wrong student.
// Old entries that match no student are NOT discarded: they stay in the old key and are kept under "legacy:<key>".
function migrateOldStore() {
  if (localStorage.getItem(OLD_KEY) === null) return;
  const old = readStore(OLD_KEY), cur = readStore(SAVE_KEY);
  let changed = false;
  for (const k in old) {
    const id = legacyIdMap[k] || (findStudent(k) ? k : "legacy:" + k);
    cur[id] = cur[id] || {};
    for (const day in old[k]) if (!(day in cur[id])) { cur[id][day] = old[k][day]; changed = true; }
  }
  if (changed) localStorage.setItem(SAVE_KEY, JSON.stringify(cur));
}
function loadSaved() {
  migrateOldStore();
  const saved = readStore(SAVE_KEY);
  for (const s of students) {
    const mine = saved[s.id] || {};
    for (const day in mine) s.records[day] = mine[day];
  }
}
function saveStatuses(list, day) {              // list = { "A-1": "P" }
  const saved = readStore(SAVE_KEY);
  for (const id in list) {
    saved[id] = saved[id] || {};
    saved[id][day] = list[id];
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
}
// Subject-wise records: load into each student. Unknown subjects / students / bad values stay in storage but are ignored here.
const VALID_STATUS = { P: 1, A: 1, L: 1 };
function loadSubjectSaved() {
  const saved = readStore(SUBJECT_KEY);
  for (const sub of subjects) {
    const bySubject = saved[sub.id];
    if (!bySubject || typeof bySubject !== "object") continue;
    for (const s of students) {
      const mine = bySubject[s.id];
      if (!mine || typeof mine !== "object") continue;
      const rec = s.subjectRecords[sub.id] = s.subjectRecords[sub.id] || {};
      for (const day in mine) if (VALID_STATUS[mine[day]] && /^\d{4}-\d{2}-\d{2}$/.test(day)) rec[day] = mine[day];
    }
  }
}
// list = { "A-1": "P", "B-1": "A" } for ONE subject and ONE date. Merges into what is stored (never replaces other days/subjects).
// Returns true if saved, false if the browser refused (storage full / blocked).
function saveSubjectStatuses(subjectId, list, day) {
  try {
    const saved = readStore(SUBJECT_KEY);
    saved[subjectId] = saved[subjectId] && typeof saved[subjectId] === "object" ? saved[subjectId] : {};
    for (const id in list) {
      saved[subjectId][id] = saved[subjectId][id] || {};
      saved[subjectId][id][day] = list[id];
    }
    localStorage.setItem(SUBJECT_KEY, JSON.stringify(saved));
  } catch (e) { return false; }
  for (const id in list) {
    const st = findStudent(id);
    if (st) { st.subjectRecords[subjectId] = st.subjectRecords[subjectId] || {}; st.subjectRecords[subjectId][day] = list[id]; }
  }
  return true;
}
loadSaved();
loadSubjectSaved();

function getMonths() {                          // ["2026-08","2026-09","2026-10"]
  const out = [];
  for (const day of days) { const m = day.slice(0, 7); if (!out.includes(m)) out.push(m); }
  return out;
}
function dayStats(day, scope) {                 // totals for one date (scope: "all", "legacy" or a subject id)
  const s = { P: 0, A: 0, L: 0 };
  for (const st of students) for (const set of st.recordSets(scope)) if (VALID_STATUS[set[day]]) s[set[day]]++;
  return s;
}
// Class average = average of each student's own percentage, only over students that have records in this scope.
// Returns null when nobody has any record (so pages can show "No data" instead of a misleading 0%).
function classPercent(scope, month) {
  let sum = 0, n = 0;
  for (const s of students) if (s.hasData(month, scope)) { sum += s.percent(month, scope); n++; }
  return n === 0 ? null : Math.round(sum / n);
}
function pctText(s, month, scope) {             // "82%" or "No data"
  return s.hasData(month, scope) ? s.percent(month, scope) + "%" : "No data";
}

// Search match: name, roll number, class, or combined forms like "A-1", "A1", "class a 2"
function matchesSearch(s, q) {
  q = q.trim().toLowerCase();
  if (!q) return true;
  if (/^class\s*[a-z]$/.test(q)) return s.division.toLowerCase() === q.slice(-1);
  const flat = q.replace(/^class\s*/, "").replace(/[\s\-,]+/g, "");
  return s.name.toLowerCase().includes(q) || String(s.roll).includes(q) ||
    (flat.length > 1 && (s.division.toLowerCase() + s.roll).startsWith(flat));
}
const statusLabel = { P: "Present", A: "Absent", L: "Late" };
function badge(status) { return '<span class="badge ' + status + '">' + statusLabel[status] + "</span>"; }
function pctClass(p) { return p < 75 ? "red" : p < 80 ? "amber" : "green"; }
function bar(p) { return '<div class="bar"><i class="' + pctClass(p) + '" data-w="' + p + '"></i></div>'; }

// Animation helper: make bars grow after the page is drawn
function growBars() {
  setTimeout(function () {
    document.querySelectorAll(".bar i").forEach(function (b) { b.style.width = b.dataset.w + "%"; });
  }, 50);
}
// Animation helper: number counts up from 0
function countUp(el, end, suffix) {
  let n = 0;
  const step = Math.max(1, Math.ceil(end / 25));
  if (el._timer) clearInterval(el._timer);      // switching subject quickly must not let an old animation overwrite the new number
  const timer = el._timer = setInterval(function () {
    n += step;
    if (n >= end) { n = end; clearInterval(timer); }
    el.textContent = n + (suffix || "");
  }, 30);
}
// Builds the sidebar navigation and the shared footer, and highlights the current page
const navIcons = {
  dashboard: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  attendance: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  students: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  reports: '<path d="M18 20V10M12 20V4M6 20v-6"/>'
};
const navLinks = [["dashboard", "index.html", "Dashboard"], ["attendance", "attendance.html", "Mark Attendance"],
  ["students", "students.html", "Students"], ["reports", "reports.html", "Reports"]];
function renderNav(active) {
  let html = '<header class="top"><div class="brand">College Attendance</div><nav aria-label="Main">';
  for (const l of navLinks) {
    html += '<a href="' + l[1] + '"' + (l[0] === active ? ' class="active" aria-current="page"' : "") +
      '><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      navIcons[l[0]] + "</svg><span>" + l[2] + "</span></a>";
  }
  document.getElementById("nav").innerHTML = html + "</nav></header>";
  const f = document.createElement("footer");
  f.className = "foot";
  let fl = "";
  for (const l of navLinks) fl += '<a href="' + l[1] + '">' + l[2] + "</a>";
  f.innerHTML = '<div class="foot-in"><div><div class="brand">College Attendance</div><b>Attendance Management System</b>' +
    "<p>Simplifying college attendance management.</p></div><nav aria-label=\"Footer\">" + fl + "</nav></div>" +
    '<div class="foot-copy">&copy; 2026 College Attendance. All rights reserved.</div>';
  document.body.appendChild(f);
}
