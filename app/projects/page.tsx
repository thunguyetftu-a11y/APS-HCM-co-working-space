"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; description: string; created_at: string };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  async function loadProjects() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!user) { setProjects([]); setMessage("Sign in to view and create shared projects."); return; }
      const { data, error } = await supabase.from("projects").select("id,name,description,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      setProjects(data ?? []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load projects. Check your Supabase setup.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadProjects(); }, []);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !userId) return;
    setSaving(true); setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").insert({ name: name.trim(), description: description.trim(), created_by: userId }).select("id,name,description,created_at").single();
      if (error) throw error;
      setProjects((current) => [data, ...current]);
      setName(""); setDescription("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project could not be created.");
    } finally { setSaving(false); }
  }

  return <AppShell title="Projects" subtitle="Shared team workspace">
    <section className="panel-box" style={{ padding: 20 }}>
      <div className="section-header"><h3>Your projects</h3><span>{projects.length} projects</span></div>
      {userId && <form onSubmit={createProject} className="task-form" style={{ marginBottom: 24 }}>
        <div className="form-grid">
          <label>Project name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website redesign" required /></label>
          <label>Short description<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" /></label>
        </div>
        <div><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create project"}</button></div>
      </form>}
      {message && <p className="auth-status error">{message}</p>}
      {loading ? <p className="muted">Loading projects…</p> : projects.length === 0 ? <p className="muted">No projects to show yet.</p> :
        <div className="project-grid">{projects.map((project) => <article className="project-card" key={project.id}>
          <div className="project-row"><div><h4>{project.name}</h4><p className="muted">{project.description || "No description yet"}</p></div>
            <Link className="secondary-button" href={`/projects/${project.id}`}>Open</Link></div>
        </article>)}</div>}
    </section>
  </AppShell>;
}
