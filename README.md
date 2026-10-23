# Attendance Management System (frontend only)
Open `index.html` in a browser. No install needed.

## Where each class topic is used
- Java/OOP concepts -> `js/data.js`: `class Person`, `class Student extends Person` (inheritance), `describe()` overridden (polymorphism), objects in the `students` array
- Variables, operators, conditions, loops -> every file (`if`, `for`, `let/const`, `%`, `&&`)
- Functions -> `countUp()`, `dayStats()`, `render()`, `exportCSV()`
- HTML5 + CSS3 -> the 5 pages and `css/style.css` (box model, grid, transitions, keyframes)
- DOM manipulation -> `innerHTML`, `createElement`, `appendChild`, `textContent`
- Events -> `addEventListener` for click, input, change (search, status buttons, month select, save, export)
- Git/GitHub -> run: `git init`, `git add .`, `git commit -m "Attendance system"`, then push to a GitHub repo

Saved attendance is stored in the browser (localStorage), so it survives a refresh.

## Subject-wise attendance (storage and rules)
- Students are identified by class + roll (`A-1`, `B-1`). Each class numbers its rolls from 1, so roll 1 exists in both classes and never shares records.
- Subjects: Java Programming (`java`), Object-Oriented Programming (`oop`), HTML & CSS (`htmlcss`), JavaScript & Git (`jsgit`) - defined in `js/data.js`.
- New key `attendanceSubjectsV1` = `{ subjectId: { "A-1": { "2026-10-02": "P" } } }` (subject -> student -> date -> P/A/L). One record per subject + student + date.
- Old keys `attendanceSaved` (v1) and `attendanceSavedV2` are **never modified or deleted** by the subject features. Their records have no subject, so they are shown as "Legacy (no subject)" and are not assigned to any subject.
- "Overall" = legacy records + every subject's records. A subject view uses only that subject's records. A subject with no records shows "No data", not 0%.
