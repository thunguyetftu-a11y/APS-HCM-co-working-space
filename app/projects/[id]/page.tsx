"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; description: string };
type Section = { id: string; name: string; position: number };
type Task = { id: string; section_id: string | null; title: string; description: string; start_date: string | null; due_date: string | null; is_done?: boolean; is_on_going?: boolean; progress?: string };
type Member = { user_id: string; can_view: boolean; can_create: boolean; can_edit: boolean; profiles?: { display_name: string; email: string } | null };
type Profile = { id: string; display_name: string; email: string };

function getProgress(task: Task) {
  if (task.is_done) return "Done";
  if (task.is_on_going) return task.due_date && task.due_date < new Date().toISOString().slice(0,10) ? "Overdue" : "On-going";
  const today = new Date().toISOString().slice(0,10);
  if (task.start_date && task.start_date > today && !task.due_date) return "Open";
  if ((task.start_date && task.start_date < today) || (task.due_date && task.due_date < today)) return "Missed";
  return "Open";
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
  const [memberEmail, setMemberEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  async function load() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotice("Please sign in to access this project."); return; }
      const [p, s, t, m, pr] = await Promise.all([
        supabase.from("projects").select("id,name,description").eq("id", projectId).single(),
        supabase.from("sections").select("id,name,position").eq("project_id", projectId).order("position"),
        supabase.from("tasks").select("id,section_id,title,description,start_date,due_date,is_done,is_on_going").eq("project_id", projectId).order("created_at", { ascending: false }),
        supabase.from("project_members").select("user_id,can_view,can_create,can_edit").eq("project_id", projectId),
        supabase.from("profiles").select("id,display_name,email")
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      if (t.error) throw t.error;
      setProject(p.data); setSections(s.data ?? []); setTasks(t.data ?? []);
      const mine = (m.data ?? []).find((member) => member.user_id === user.id);
      setCanCreate(Boolean(mine?.can_create)); setCanEdit(Boolean(mine?.can_edit));
      setMembers(m.data ?? []); setProfiles((pr.data ?? []) as Profile[]);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load project."); }
  }

  useEffect(() => { if (projectId) void load(); }, [projectId]);

  async function addSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!sectionName.trim()) return;
    setBusy(true); setNotice("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase.from("sections").insert({ project_id: projectId, name: sectionName.trim(), position: sections.length, created_by: user.id });
      if (error) throw error;
      setSectionName(""); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not add section."); }
    finally { setBusy(false); }
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>, sectionId: string) {
    event.preventDefault(); const title = (taskDrafts[sectionId] ?? "").trim(); if (!title) return;
    setBusy(true); setNotice("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase.from("tasks").insert({ project_id: projectId, section_id: sectionId, title, created_by: user.id });
      if (error) throw error;
      setTaskDrafts((current) => ({ ...current, [sectionId]: "" })); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not add task."); }
    finally { setBusy(false); }
  }

  async function setTaskFlag(task: Task, flag: "is_done" | "is_on_going") {
    const supabase = createClient();
    const patch = flag === "is_done" ? { is_done: !task.is_done, is_on_going: false } : { is_on_going: !task.is_on_going, is_done: false };
    const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
    if (error) setNotice(error.message); else await load();
  }

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("To add a member, first ensure their account exists. Entering an email alone cannot securely create an account or grant access. Member invitations will be connected to Supabase Auth in the next step.");
  }

  async function savePermission(member: Member, key: "can_view" | "can_create" | "can_edit", value: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("project_members").update({ [key]: value }).eq("project_id", projectId).eq("user_id", member.user_id);
    if (error) setNotice(error.message); else await load();
  }

  if (!project) return <AppShell title="Project" subtitle="Project details"><div className="panel-box" style={{padding:20}}>{notice || "Loading project…"}<p><Link href="/projects">Back to projects</Link></p></div></AppShell>;

  return <AppShell title={project.name} subtitle="Project workspace">
    <div style={{display:"grid",gap:18}}>
      <section className="panel-box" style={{padding:20}}>
        <div className="section-header"><h3>Overview</h3><Link href="/projects" className="secondary-button">All projects</Link></div>
        <p>{project.description || "Add tasks and organize work into sections below."}</p>
      </section>
      <section className="panel-box" style={{padding:20}}>
        <div className="section-header"><h3>Sections and tasks</h3><span>{tasks.length} tasks</span></div>
        {sections.map((section) => <div key={section.id} className="project-card" style={{marginBottom:14}}>
          <div className="section-header"><h4>{section.name}</h4><span>{tasks.filter(t => t.section_id === section.id).length} tasks</span></div>
          <div className="task-list">{tasks.filter(t => t.section_id === section.id).map(task => <div key={task.id} className="task-card" style={{cursor:"default"}}>
            <div className="task-topline"><strong>{task.title}</strong><span className="status-badge">{getProgress(task)}</span></div>
            {task.description && <p>{task.description}</p>}
            <div className="task-footer"><span>Start: {task.start_date || "—"} · Due: {task.due_date || "—"}</span>
              <div className="task-actions-inline"><button className="mini-button" onClick={() => void setTaskFlag(task,"is_on_going")}>{task.is_on_going ? "Clear on-going" : "On-going"}</button><button className="mini-button done" onClick={() => void setTaskFlag(task,"is_done")}>{task.is_done ? "Re-open" : "Done"}</button></div>
            </div>
          </div>)}</div>
          {canCreate && <form onSubmit={(e) => void addTask(e,section.id)} className="project-form" style={{marginTop:12,marginBottom:0}}><input value={taskDrafts[section.id] ?? ""} onChange={e => setTaskDrafts(c => ({...c,[section.id]:e.target.value}))} placeholder="Add a task to this section" /><button className="primary-button" disabled={busy}>Add task</button></form>}
        </div>)}
        {sections.length === 0 && <p className="muted">No sections yet. Create the first section to start organizing tasks.</p>}
        {canCreate && <form onSubmit={(e) => void addSection(e)} className="project-form"><input value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder="New section name" /><button className="primary-button" disabled={busy}>Add section</button></form>}
      </section>
      <section className="panel-box" style={{padding:20}}>
        <div className="section-header"><h3>Project access</h3><span>Manage view, create and edit rights</span></div>
        <p className="muted">Only project administrators should manage access. Invite-by-email and member selection will be completed with the authentication invitation flow.</p>
        {members.map(member => <div key={member.user_id} className="project-row" style={{padding:"10px 0",borderBottom:"1px solid #edf2fb"}}>
          <code>{member.user_id.slice(0,8)}…</code>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>{(["can_view","can_create","can_edit"] as const).map(key => <label key={key} style={{display:"flex",gap:5,alignItems:"center",fontSize:13}}><input type="checkbox" checked={Boolean(member[key])} disabled={!canEdit} onChange={e => void savePermission(member,key,e.target.checked)} />{key.replace("can_","")}</label>)}</div>
        </div>)}
        {canEdit && <div style={{position:"relative",marginTop:14}}><form onSubmit={(e)=>void inviteMember(e)} className="project-form"><input type="email" value={memberEmail} onFocus={()=>setSuggestionsOpen(true)} onChange={e=>{setMemberEmail(e.target.value);setSuggestionsOpen(true);}} placeholder="Enter email or select an existing user" /><button className="secondary-button" disabled={busy}>{busy?"Adding…":"Add member"}</button></form>{suggestionsOpen && memberEmail && profiles.filter(p=>p.email?.toLowerCase().includes(memberEmail.toLowerCase())).slice(0,6).length>0 && <div className="project-card" style={{position:"absolute",zIndex:10,left:0,right:0,top:"100%",padding:8}}>{profiles.filter(p=>p.email?.toLowerCase().includes(memberEmail.toLowerCase())).slice(0,6).map(p=><button key={p.id} type="button" className="text-button" style={{display:"block",padding:8}} onClick={()=>void inviteMember(undefined,p.email)}>{p.display_name || p.email} · {p.email}</button>)}</div>}<p className="muted">Existing accounts are added immediately. New email addresses receive a Supabase invitation to create an account.</p></div>}
        {notice && <p className="auth-status error">{notice}</p>}
      </section>
    </div>
  </AppShell>;
}
