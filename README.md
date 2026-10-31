# TeamFlow Planner
A Next.js team project and task workspace with a Supabase backend foundation.

## Supabase setup
1. Create a Supabase project.
2. Run the full `supabase/schema.sql` file in Supabase SQL Editor.
3. Copy the Project URL and publishable (or legacy anon) key from Project Settings → API.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel Preview and Production environment variables.
5. Add the same values to a local `.env.local` file and redeploy.

Never expose a Supabase service-role key in browser code or a `NEXT_PUBLIC_*` variable.

## Schema included
Profiles, projects, project memberships and roles, sections, tasks, assignees, subtasks, task links, comments and mention IDs, attachment metadata, activity history, notifications, row-level security policies, and a private Storage bucket.

Roles: viewer (read), creator (create sections/tasks), editor (create/edit content), admin (manage project and membership).

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Migration status
This feature branch adds the Supabase database schema and authenticated client/session foundation. Existing screens still include localStorage-backed demo flows and must be migrated to Supabase queries and Supabase Auth before real multi-user collaboration is enabled. Test the SQL in a new Supabase project before production use.
