// reports.js - monthly report (overall or per subject), subject-wise table, CSV export
renderNav("reports");
const monthSelect = document.getElementById("month");
const subjectSelect = document.getElementById("subject");
for (const m of getMonths()) monthSelect.add(new Option(monthName(m), m));
monthSelect.value = getMonths()[getMonths().length - 1];
fillSubjectSelect(subjectSelect, "Overall (all subjects)", true);

function showReport() {
  const m = monthSelect.value, scope = subjectSelect.value, label = scopeLabel(scope);
  let P = 0, A = 0, L = 0, workingDays = 0;
  for (const day of days) if (day.startsWith(m)) workingDays++;
  const dates = {};                              // dates in this month that have at least one record in this view
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";
  for (const s of students) {
    P += s.count("P", m, scope); A += s.count("A", m, scope); L += s.count("L", m, scope);
    for (const set of s.recordSets(scope)) for (const day in set) if (day.startsWith(m) && VALID_STATUS[set[day]]) dates[day] = 1;
    const has = s.hasData(m, scope), p = s.percent(m, scope);
    tbody.innerHTML += "<tr><td>" + rollTag(s) + "</td><td>" + s.name + "</td><td>" + s.division + "</td><td>" + s.count("P", m, scope) +
      "</td><td>" + s.count("A", m, scope) + "</td><td>" + s.count("L", m, scope) + "</td>" +
      (has ? '<td class="' + pctClass(p) + '"><b>' + p + "%</b></td><td>" + bar(p) + "</td>" : '<td class="muted">No data</td><td>' + bar(0) + "</td>") + "</tr>";
  }
  const avg = classPercent(scope, m), nDates = Object.keys(dates).length;
  document.getElementById("studentHead").textContent = "Student-wise attendance - " + label;
  document.getElementById("summary").innerHTML =
    "<b>" + monthName(m) + " - " + label + ":</b> " + workingDays + " working days" +
    (scope === "all" ? "" : ", " + nDates + " with records") + ". Total present " + P + ", absent " + A + ", late " + L +
    (avg === null ? ". <b>No attendance recorded for this view in this month.</b>" : ". Class average <b>" + avg + "%</b>.") +
    (scope === "all" ? ' <span class="muted">Overall = every subject plus legacy records that have no subject.</span>' : "");

  // Subject-wise table for the selected month: real records of each subject (never mixed), then the legacy layer, then overall
  document.getElementById("subjectHead").textContent = "Subject-wise attendance - " + monthName(m);
  const subj = document.getElementById("subjects");
  subj.innerHTML = "";
  const rows = subjects.map(function (sub) { return [sub.name, sub.id]; });
  rows.push(["Legacy (no subject)", "legacy"], ["Overall (all subjects)", "all"]);
  for (const r of rows) {
    let n = 0, p1 = 0, a1 = 0, l1 = 0;
    for (const s of students) if (s.hasData(m, r[1])) { n++; p1 += s.count("P", m, r[1]); a1 += s.count("A", m, r[1]); l1 += s.count("L", m, r[1]); }
    const a = classPercent(r[1], m), name = r[1] === "all" ? "<b>" + r[0] + "</b>" : r[0];
    subj.innerHTML += "<tr><td>" + name + "</td><td>" + n + " of " + students.length + "</td><td>" + p1 + "</td><td>" + a1 + "</td><td>" + l1 + "</td>" +
      (a === null ? '<td class="muted">No data</td><td>' + bar(0) + "</td>" : '<td class="' + pctClass(a) + '"><b>' + a + "%</b></td><td>" + bar(a) + "</td>") + "</tr>";
  }
  growBars();
}

// CSV export: build text, make a Blob, click a hidden download link. Follows the selected month + subject view.
function csvText(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }
function exportCSV() {
  const m = monthSelect.value, scope = subjectSelect.value;
  let csv = "Class,Roll No,Name,Present,Absent,Late,Attendance %,Subject\n";
  for (const s of students) {
    csv += [s.division, s.roll, csvText(s.name), s.count("P", m, scope), s.count("A", m, scope), s.count("L", m, scope),
      s.hasData(m, scope) ? s.percent(m, scope) : "", csvText(scopeLabel(scope))].join(",") + "\n";   // empty % = nothing recorded
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "attendance-report-" + m + "-" + scope + ".csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
monthSelect.addEventListener("change", showReport);
subjectSelect.addEventListener("change", showReport);
document.getElementById("export").addEventListener("click", exportCSV);
showReport();
