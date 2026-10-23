// students.js - student list with search, class filter and subject view
function s_class(id) { return id.split("-")[0]; }
function s_roll(id) { return id.split("-")[1]; }
renderNav("students");
const search = document.getElementById("search");
const division = document.getElementById("division");
const subjectSelect = document.getElementById("subject");
const tbody = document.getElementById("tbody");
fillSubjectSelect(subjectSelect, "Overall (all subjects)", true);
subjectSelect.value = validScope(new URLSearchParams(location.search).get("view"));   // ?view=java keeps the choice when coming back from details

function render() {
  const q = search.value, scope = subjectSelect.value;
  const overall = scope === "all";
  document.getElementById("attHead").textContent = overall ? "Overall attendance" : "Attendance";
  document.getElementById("scopeNote").textContent = overall
    ? "Showing overall attendance: all subjects plus legacy records that have no subject."
    : "Showing attendance for " + scopeLabel(scope) + " only.";
  tbody.innerHTML = "";
  for (const s of students) {
    const matchText = matchesSearch(s, q);
    const matchDiv = division.value === "all" || s.division === division.value;
    if (!matchText || !matchDiv) continue;
    const has = s.hasData(null, scope), p = s.percent(null, scope);
    const tr = document.createElement("tr");
    tr.className = "click";
    tr.dataset.id = s.id;
    tr.innerHTML = "<td>" + rollTag(s) + "</td><td>" + s.name + "</td><td>Class " + s.division + "</td>" +
      (has ? '<td class="' + pctClass(p) + '"><b>' + p + "%</b></td><td>" + bar(p) + "</td>"
           : '<td class="muted">No data</td><td>' + bar(0) + "</td>");
    tbody.appendChild(tr);
  }
  if (tbody.innerHTML === "") tbody.innerHTML = '<tr><td colspan="5">No students found.</td></tr>';
  growBars();
}
tbody.addEventListener("click", function (e) {   // open details when a row is clicked (class + roll identify the student)
  const row = e.target.closest("tr");
  if (row && row.dataset.id) location.href = "student-details.html?class=" + s_class(row.dataset.id) + "&roll=" + s_roll(row.dataset.id) + "&view=" + subjectSelect.value;
});
search.addEventListener("input", render);
division.addEventListener("change", render);
subjectSelect.addEventListener("change", render);
render();
