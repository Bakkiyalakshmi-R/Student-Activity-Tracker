# Student Activity Tracker
Built as part of Front-End Development Hackathon – Level 2 (Interactivity Implementation).
I built this website to track study tasks, deadlines, and progress — everything runs in the browser with no backend required.

Quick start
- Open `index.html` in your browser (double‑click) or use a static server (I use the VS Code Live Server extension).
- Click "Get Started" to open the app and start adding activities.

Core Features (Level-2)
Display activities dynamically using JavaScript
Mark activities as completed
Real-time progress tracking (completed / total / percent)
Instant UI updates without page reload

What I implemented
- Add activities with: name, short description, category, priority (High/Medium/Low) and optional due date.
- Edit and delete activities inline.
- Toggle completion (compact check icon) and see progress (completed / total / percent).
- Filters (All / Pending / Completed) and search by name/description.
- Sort by: manual (drag) / name / due date / priority. Drag & drop to reorder — order is saved.
- Bulk actions: select multiple items → mark complete / delete / assign category.
- Friendly due date labels ("Due today", "Due tomorrow", "Due Apr 10") and overdue styling.
- Undo for destructive actions via a toast notification.
- Accessibility improvements: ARIA attributes, keyboard focus styles, keyboard reordering hints.

Files in this folder
- `index.html` — the app UI (intro + activities pages)
- `style.css` — styling and animations
- `script.js` — app logic and persistence
- `README.md` — this file

Data & persistence
- Everything is stored in LocalStorage under the key `studentActivities_v2`.
- Example activity object:

```json
{
  "id": 1616161616161,
  "name": "Learn HTML Basics",
  "desc": "Tags, elements and semantics",
  "category": "Study",
  "priority": "Medium",
  "due": "2026-04-10",
  "completed": false
}
```

Notes
- To reset data: open DevTools → Application → Local Storage → delete the `studentActivities_v2` key.
- The app is intentionally client‑only so it works offline and without a server.

Want more?
If you want, I can add any of these next:
- Theme switcher (light/dark)
- Calendar sync / .ics export
- Analytics (completion charts, streaks)
- Recurring tasks and reminders (Notification API)

If you'd like me to implement one of these, tell me which and I will add it to this folder.

License
- MIT — use and modify as you like.

— Developed by Bakkiyalakshmi

