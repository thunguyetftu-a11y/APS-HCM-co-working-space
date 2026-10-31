# TeamFlow Planner

A collaborative team planning app concept built as a responsive web app MVP for shared calendars, task boards, and work progress tracking.

## Features
- Shared workspace dashboard
- Kanban task board
- Project and assignee filters
- Team calendar overview
- Milestones and upcoming events
- Real-time collaboration-ready UI design
- Mobile responsive layout

## Tech stack
- Next.js
- React
- TypeScript
- CSS

## Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Project status
This is a front-end MVP prototype designed to showcase a Microsoft Planner / Asana-style experience for teams working together in real time.


## Interactive workspace update

The workspace now provides project and section creation, task details, status rules, date pickers, multiple assignees, comments, activity history, follow-up task links, attachments, inbox, and a calendar. This version stores workspace data in browser localStorage and attachment data URLs for a single-browser prototype. It is not yet multi-user synchronized: connect a database, authentication provider, and object storage (for example Supabase) before deploying for real team collaboration. Sign-in is a demo flow and does not authenticate credentials.
