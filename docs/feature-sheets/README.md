# Feature Sheets — Moments Studio

Three personas, one workflow (Collect → Select → Deliver → Manage).

## Files
- `01_photographers.csv` — Studio B2B tool (44 rows)
- `02_couples.csv` — client review/album experience (22 rows)
- `03_guests.csv` — consumer find-my-photos app (20 rows)
- `FEATURE_TREE.md` — Obsidian-style expandable tree (open in Obsidian; fold headings + list items)

## CSV columns
`Feature Area | Feature | Sub-Feature / Detail | User Story | Page / Screen | Login / Access | Priority | Done`
- `Done` values: `FALSE` / `TRUE` (Google Sheets renders as checkbox after Format → Insert checkbox).

## Import into one Google Sheet (3 tabs)
1. Create a blank Google Sheet.
2. **File → Import → Upload** `01_photographers.csv` → *Insert new sheet(s)*.
3. Repeat for `02_couples.csv` and `03_guests.csv`.
4. Rename tabs: Photographers / Couples / Guests.
5. Select the `Done` column → **Insert → Checkbox** to turn TRUE/FALSE into checkboxes.

## Auto-authorize path (skipped this session)
Google Drive connector was not authorized, so the Sheet could not be created directly.
Authorize the **claude.ai Google Drive** connector in claude.ai settings to let a future
session create/update the live Sheet automatically.
