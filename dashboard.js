// dashboard.js - today's numbers, alerts and heatmap (overall or for one subject)
renderNav("dashboard");
document.getElementById("today").textContent = "Attendance for " + fmtDate(TODAY);
const subjectSelect = document.getElementById("subject");
fillSubjectSelect(subjectSelect, "Overall (all subjects)", true);

function render() {
  const scope = subjectSelect.value, label = scopeLabel(scope), overall = scope === "all";
  const t = dayStats(TODAY, scope);
  const marked = t.P + t.A + t.L;                // records that exist for today in this view
  document.getElementById("lblPresent").textContent = "Present today";
  document.getElementById("lblAbsent").textContent = "Absent today";
  document.getElementById("lblLate").textContent = "Late today";
  document.getElementById("lblOverall").textContent = overall ? "Overall attendance (all subjects)" : label + " attendance";
  countUp(document.getElementById("total"), students.length);
  countUp(document.getElementById("present"), t.P);
  countUp(document.getElementById("absent"), t.A);
  countUp(document.getElementById("late"), t.L);
  const avg = classPercent(scope);
  const ov = document.getElementById("overall");
  if (avg === null) { if (ov._timer) clearInterval(ov._timer); ov.textContent = "No data"; }
  else countUp(ov, avg, "%");

  // Small overview bars: share of today's records in this view
  const overview = document.getElementById("overview");
  document.getElementById("overviewHead").textContent = "Today's overview - " + label;
  overview.innerHTML = "";
  for (const c of ["P", "A", "L"]) {
    const p = marked === 0 ? 0 : Math.round(t[c] / marked * 100);
    const cls = c === "P" ? "green" : c === "A" ? "red" : "amber";
    overview.innerHTML += '<div class="barrow"><span>' + statusLabel[c] + '</span><div class="bar"><i class="' + cls + '" data-w="' + p + '"></i></div><span>' + p + "%</span></div>";
  }
  if (marked === 0) overview.innerHTML += '<p class="note">Nothing has been marked today for this view yet.</p>';
  else if (!overall && marked < students.length) overview.innerHTML += '<p class="note">' + marked + " of " + students.length + " students marked today (" + (students.length - marked) + " not marked).</p>";

  // Alert list: below 75% or near (75 - 79). Only students that have records in this view.
  const alertBox = document.getElementById("alerts");
  document.getElementById("alertHead").textContent = "Students near or below 75% - " + (overall ? "overall" : label);
  alertBox.innerHTML = "";
  let count = 0;
  for (const s of students) {
    if (!s.hasData(null, scope)) continue;
    const p = s.percent(null, scope);
    if (p < 80) {
      count++;
      const text = p < 75 ? "Below 75%" : "Near 75%";
      alertBox.innerHTML += '<div class="alert"><span><a href="student-details.html?class=' + s.division + '&roll=' + s.roll + '&view=' + scope + '">' + s.name + '</a> <span class="note" style="margin:0">(Class ' + s.division + ", Roll " + s.roll + ')</span></span><b class="' + pctClass(p) + '">' + p + "% - " + text + "</b></div>";
    }
  }
  if (avg === null) alertBox.innerHTML = "<p>No attendance has been recorded for this view yet.</p>";
  else if (count === 0) alertBox.innerHTML = "<p>No students are near the threshold.</p>";

  // Heatmap: one square per day, darker green = more students present. Grey = nothing recorded that day.
  const heat = document.getElementById("heat");
  document.getElementById("heatHead").textContent = "Attendance calendar - " + label + " (each row is one week, Mon to Fri)";
  heat.innerHTML = "";
  for (const day of days) {
    const s = dayStats(day, scope), n = s.P + s.A + s.L;
    const p = n === 0 ? 0 : (s.P + s.L) / n * 100;
    const level = n === 0 ? 0 : p < 60 ? 1 : p < 75 ? 2 : p < 90 ? 3 : 4;
    const cell = document.createElement("div");
    cell.className = "h" + level;
    cell.title = fmtDate(day) + (n === 0 ? ": no records" : ": " + Math.round(p) + "% attended (" + n + " records)");
    heat.appendChild(cell);
  }
  growBars();
}
subjectSelect.addEventListener("change", render);
render();
