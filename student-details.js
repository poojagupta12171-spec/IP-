// student-details.js - one student's full attendance (overall, per subject, or legacy)
renderNav("students");
// URL: student-details.html?class=A&roll=1&view=java. Old links (?roll=101) still work through the legacy map.
const params = new URLSearchParams(location.search);
let student = null;
if (params.get("class")) student = findStudent(params.get("class").toUpperCase() + "-" + Number(params.get("roll")));
else if (legacyIdMap[params.get("roll")]) student = findStudent(legacyIdMap[params.get("roll")]);

if (!student) {
  document.getElementById("content").hidden = false;
  document.getElementById("content").innerHTML = '<p>Student not found. <a href="students.html">Back to students</a></p>';
} else {
  document.getElementById("content").hidden = false;
  document.getElementById("name").textContent = student.name;
  document.getElementById("info").textContent = student.describe();   // uses the Student class: class + roll + name

  const view = document.getElementById("view");
  fillSubjectSelect(view, "Overall (all subjects)", true);
  view.value = validScope(params.get("view"));
  const filter = document.getElementById("filter");
  filter.add(new Option("All months", "all"));
  for (const m of getMonths()) filter.add(new Option(monthName(m), m));
  const history = document.getElementById("history");

  // Subject-wise breakdown: always shows every subject (real records only), independent of the "Showing" selector
  const subj = document.getElementById("subjects");
  function subjectRow(label, scope) {
    const has = student.hasData(null, scope), sp = student.percent(null, scope);
    const detail = has ? "P " + student.count("P", null, scope) + " &middot; A " + student.count("A", null, scope) + " &middot; L " + student.count("L", null, scope)
                       : "No records yet";
    return '<div class="barrow" style="grid-template-columns:200px 1fr 40px"><span>' + label +
      '<br><span class="note" style="margin:0;font-weight:400;text-align:left">' + detail + "</span></span>" +
      bar(has ? sp : 0) + '<span class="' + (has ? pctClass(sp) : "muted") + '">' + (has ? sp + "%" : "&ndash;") + "</span></div>";
  }
  let html = "";
  for (const sub of subjects) html += subjectRow(sub.name, sub.id);
  if (student.hasData(null, "legacy")) html += subjectRow("Legacy (no subject)", "legacy");
  subj.innerHTML = html;
  document.getElementById("subjectNote").textContent =
    "Each subject uses only its own records. Legacy records were saved before subjects existed, so they are not assigned to any subject.";

  function showView() {
    const scope = view.value, m0 = filter.value;
    const label = scopeLabel(scope);
    const p = student.percent(null, scope), has = student.hasData(null, scope);
    // Summary tiles
    document.getElementById("overallLabel").textContent = scope === "all" ? "Overall attendance (all subjects)" : label + " attendance";
    const overall = document.getElementById("overall");
    if (has) { countUp(overall, p, "%"); overall.className = pctClass(p); }
    else { if (overall._timer) clearInterval(overall._timer); overall.textContent = "No data"; overall.className = "muted"; }
    countUp(document.getElementById("pc"), student.count("P", null, scope));
    countUp(document.getElementById("ac"), student.count("A", null, scope));
    countUp(document.getElementById("lc"), student.count("L", null, scope));
    const warn = document.getElementById("warn");
    if (!has) warn.textContent = "No attendance has been recorded for " + label + " yet.";
    else if (p < 75) warn.textContent = label + ": attendance is below the 75% requirement.";
    else if (p < 80) warn.textContent = label + ": attendance is close to the 75% limit.";
    else warn.textContent = "";

    // Monthly attendance for this view
    document.getElementById("monthlyCap").textContent = "Monthly attendance - " + label;
    let rows = "";
    for (const m of getMonths()) {
      const mh = student.hasData(m, scope), mp = student.percent(m, scope);
      rows += "<tr><td>" + monthName(m) + "</td><td>" + student.count("P", m, scope) + "</td><td>" + student.count("A", m, scope) +
        "</td><td>" + student.count("L", m, scope) + "</td>" +
        (mh ? '<td class="' + pctClass(mp) + '"><b>' + mp + "%</b></td><td>" + bar(mp) + "</td>" : '<td class="muted">No data</td><td>' + bar(0) + "</td>") + "</tr>";
    }
    document.getElementById("monthly").innerHTML = rows;

    // History: one row per saved record (a date can have several rows in the overall view, one per subject)
    document.getElementById("historyHead").textContent = "Attendance history - " + label;
    const list = [];
    function add(set, subjectLabel, order) {
      for (const day in set) if (VALID_STATUS[set[day]] && (m0 === "all" || day.startsWith(m0))) list.push({ day: day, label: subjectLabel, order: order, st: set[day] });
    }
    if (scope === "all" || scope === "legacy") add(student.records, "Legacy (no subject)", 99);
    subjects.forEach(function (sub, i) { if (scope === "all" || scope === sub.id) add(student.subjectRecords[sub.id] || {}, sub.name, i); });
    list.sort(function (a, b) { return a.day < b.day ? 1 : a.day > b.day ? -1 : a.order - b.order; });   // newest first
    let h = "";
    for (const r of list) {
      const weekday = new Date(r.day).toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" });
      h += "<tr><td>" + fmtDate(r.day) + "</td><td>" + weekday + "</td><td>" + r.label + "</td><td>" + badge(r.st) + "</td></tr>";
    }
    history.innerHTML = h || '<tr><td colspan="4">No attendance records for this view.</td></tr>';

    // keep the choice in the address bar (refresh / sharing) and in the back link
    params.set("view", scope);
    history_replace();
    document.getElementById("back").href = "students.html?view=" + scope;
    growBars();
  }
  function history_replace() { try { window.history.replaceState(null, "", "?" + params.toString()); } catch (e) {} }
  view.addEventListener("change", showView);
  filter.addEventListener("change", showView);
  showView();
}
