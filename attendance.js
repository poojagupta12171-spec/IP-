// attendance.js - mark attendance for one SUBJECT on one date
renderNav("attendance");
const dateInput = document.getElementById("date");
const subjectSelect = document.getElementById("subject");
const classFilter = document.getElementById("classFilter");
const search = document.getElementById("search");
const tbody = document.getElementById("tbody");
const msg = document.getElementById("msg");
dateInput.min = days[0];                        // first working day in the system (earlier dates would never show in reports)
dateInput.max = TODAY;
dateInput.value = TODAY;
fillSubjectSelect(subjectSelect);               // the four subjects, no "overall" option: attendance is always marked for ONE subject

let draft = {};                                 // { "A-1": "P" | "A" | "L" | "" } for the chosen subject + date, not saved yet
let dirty = false;                              // true when the draft has changes that are not saved
let shownSubject = subjectSelect.value, shownDate = dateInput.value;   // what the draft was loaded for

function loadDraft() {                          // read ONLY the chosen subject's saved records (never the legacy ones)
  draft = {};
  dirty = false;
  shownSubject = subjectSelect.value;
  shownDate = dateInput.value;
  for (const s of students) draft[s.id] = (s.subjectRecords[shownSubject] || {})[shownDate] || "";
}
function isWeekend() {
  const day = new Date(dateInput.value).getUTCDay();
  return day === 0 || day === 6;
}
function inClass(s) { return classFilter.value === "all" || s.division === classFilter.value; }
function updateCounts() {
  const c = { P: 0, A: 0, L: 0, "": 0 };
  for (const s of students) if (inClass(s)) c[draft[s.id]]++;
  const where = classFilter.value === "all" ? "All classes" : "Class " + classFilter.value;
  document.getElementById("counts").innerHTML =
    "<span>" + scopeLabel(shownSubject) + " &middot; " + where + " &middot; " + fmtDate(shownDate) + "</span>" +
    '<span class="green">Present: ' + c.P + '</span><span class="red">Absent: ' + c.A +
    '</span><span class="amber">Late: ' + c.L + "</span><span>Not marked: " + c[""] + "</span>" +
    (dirty ? '<span class="amber">Unsaved changes</span>' : "");
}
function render() {
  const q = search.value;
  tbody.innerHTML = "";
  for (const s of students) {
    if (!inClass(s) || !matchesSearch(s, q)) continue;
    let buttons = "";
    for (const c of ["P", "A", "L"]) {
      const on = draft[s.id] === c ? " on" : "";
      buttons += '<button class="status-btn ' + c + on + '" data-id="' + s.id + '" data-s="' + c + '">' + statusLabel[c] + "</button>";
    }
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + rollTag(s) + "</td><td>" + s.name + "</td><td>" + s.division + "</td><td>" + buttons + "</td>";
    tbody.appendChild(tr);
  }
  if (tbody.innerHTML === "") tbody.innerHTML = '<tr><td colspan="4">No student matches your search.</td></tr>';
  updateCounts();
}
// Switching subject or date reloads the draft. If there are unsaved changes, ask first (so nothing is lost silently).
function reloadFor(select, previous) {
  if (dirty && !confirm("You have unsaved changes for " + scopeLabel(shownSubject) + " on " + fmtDate(shownDate) + ". Discard them?")) {
    select.value = previous;
    return;
  }
  loadDraft();
  msg.textContent = isWeekend() ? "Weekend - no classes on this date." : "";
  msg.className = "amber";
  render();
}

// ---------- Event listeners ----------
tbody.addEventListener("click", function (e) {   // one listener for all status buttons
  const b = e.target.closest("button");
  if (!b) return;
  draft[b.dataset.id] = b.dataset.s;
  dirty = true;
  render();
});
search.addEventListener("input", render);
classFilter.addEventListener("change", render);  // class is only a view: the draft keeps every student, so nothing is lost when switching class
subjectSelect.addEventListener("change", function () { reloadFor(subjectSelect, shownSubject); });
dateInput.addEventListener("change", function () {
  if (!dateInput.value || dateInput.value > TODAY || dateInput.value < days[0]) dateInput.value = shownDate;
  if (dateInput.value === shownDate) return;
  reloadFor(dateInput, shownDate);
});
document.getElementById("allPresent").addEventListener("click", function () {
  for (const s of students) if (inClass(s)) draft[s.id] = "P";   // only the selected class (everyone if "All classes")
  dirty = true;
  msg.textContent = "";
  render();
});
document.getElementById("save").addEventListener("click", function () {
  if (isWeekend()) { msg.textContent = "Cannot save: weekend."; msg.className = "red"; return; }
  const toSave = {};
  let unmarked = 0, marked = 0;
  for (const s of students) {                    // saves every class, not only the one on screen
    if (draft[s.id] === "") { unmarked++; continue; }
    toSave[s.id] = draft[s.id];
    marked++;
  }
  if (marked === 0) { msg.textContent = "Nothing to save: mark at least one student."; msg.className = "red"; return; }
  if (!saveSubjectStatuses(shownSubject, toSave, shownDate)) {
    msg.textContent = "Could not save: the browser blocked or filled its storage."; msg.className = "red"; return;
  }
  dirty = false;
  msg.textContent = unmarked
    ? scopeLabel(shownSubject) + " saved. " + unmarked + " student(s) still not marked."
    : scopeLabel(shownSubject) + " attendance saved for " + fmtDate(shownDate) + ".";
  msg.className = "green";
  updateCounts();
});

loadDraft();
render();
