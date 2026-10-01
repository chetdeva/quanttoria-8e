# Teacher availability

Create a single-date availability window, or enable **Repeat every week as
working hours** and select one or more **Every Monday–Sunday** checkboxes.
The same start/end wall-clock times apply to each selected weekday in the
teacher's displayed browser timezone. Weekly windows are stored as native
`teacher_availability` rows; the student booking engine consumes them directly.

The shared student/teacher duration control offers **30 min**, **60 min**, and
**Custom** minutes in 15-minute steps. Teacher availability defaults to **30
minutes** and supports up to 1440 minutes. **Every day** checks all seven weekdays;
clearing it clears all days. Individual weekday changes update its checked state.
Dragging a range preserves its chosen length.
Changing the start or duration recalculates the end; editing the end recalculates
duration. Recurring windows must finish on the same date, so overnight working
hours should be split into separate daily windows.

Selected weekdays publish in one batch insert. Existing working hours remain
unchanged; exact active duplicates from the loaded schedule are skipped. This is
additive scheduling, not replacement of a teacher's entire week. Existing RLS
ownership policies continue to apply. No database migration is needed.
