"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; description: string; created_at: string }; type Section={id:string;name:string;position:number}; type Task={id:string;section_id:string|null;title:string;priority:string;start_date:string|null;due_date:string|null;is_done:boolean;is_on_going:boolean};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded,setExpanded]=useState<string[]>([]);
  const [sectionMap,setSectionMap]=useState<Record<string,Section[]>>({});
  const [taskMap,setTaskMap]=useState<Record<string,Task[]>>({});
  const [assigneeMap,setAssigneeMap]=useState<Record<string,string[]>>({});
  const [attachmentMap,setAttachmentMap]=useState<Record<string,{id:string;file_name:string;bucket_path:string}[]>>({});
  const [loadingProject,setLoadingProject]=useState<string|null>(null);

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
  async function toggleProject(id:string){if(expanded.includes(id)){setExpanded(v=>v.filter(x=>x!==id));return;}setExpanded(v=>[...v,id]);if(sectionMap[id])return;setLoadingProject(id);const db=createClient();const [a,b,pr]=await Promise.all([db.from("sections").select("id,name,position").eq("project_id",id).order("position"),db.from("tasks").select("id,section_id,title,priority,start_date,due_date,is_done,is_on_going").eq("project_id",id).is("parent_task_id",null).order("created_at"),db.from("profiles").select("id,display_name,email")]);if(a.error||b.error){setMessage(a.error?.message||b.error?.message||"Unable to load tasks");return;}const taskIds=(b.data||[]).map(t=>t.id);const [assigneeResult,attachmentResult]=await Promise.all([taskIds.length?db.from("task_assignees").select("task_id,user_id").in("task_id",taskIds):Promise.resolve({data:[]}),taskIds.length?db.from("attachments").select("id,task_id,file_name,bucket_path").in("task_id",taskIds):Promise.resolve({data:[]})]);
  if(assigneeResult.error||attachmentResult.error){setMessage(assigneeResult.error?.message||attachmentResult.error?.message||"Unable to load task details");setLoadingProject(null);return;}const assignees=assigneeResult.data;const filesByTask:Record<string,{id:string;file_name:string;bucket_path:string}[]>={};(attachmentResult.data||[]).forEach(file=>{(filesByTask[file.task_id]||(filesByTask[file.task_id]=[])).push(file);});setAttachmentMap(v=>({...v,...filesByTask}));const names:Record<string,string[]>={};(assignees||[]).forEach(row=>{const profile=(pr.data||[]).find(x=>x.id===row.user_id);if(profile)(names[row.task_id]||(names[row.task_id]=[])).push(profile.display_name||profile.email||"Member");});setAssigneeMap(v=>({...v,...names}));setSectionMap(v=>({...v,[id]:a.data||[]}));setTaskMap(v=>({...v,[id]:b.data||[]}));setLoadingProject(null);}

  async function openQuickAttachment(path:string) { const {data,error}=await createClient().storage.from("task-attachments").createSignedUrl(path,300); if(error)setMessage(error.message); else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer"); }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !userId) return;
    setSaving(true); setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").insert({ name: name.trim(), description: description.trim(), created_by: userId }).select("id,name,description,created_at").single();
      if (error) throw error;
      setProjects((current) => [data, ...current]);
      setName(""); setDescription(""); setShowCreate(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project could not be created.");
    } finally { setSaving(false); }
  }

  return <AppShell title="Projects" subtitle="Shared team workspace">
    <section className="panel-box" style={{ padding: 20 }}>
      <div className="section-header"><div><h3>Your projects</h3><span>{projects.length} projects</span></div>{userId && <button type="button" className="primary-button" onClick={() => setShowCreate(v => !v)} style={{minWidth:42,fontSize:20}}>+</button>}</div>
      {userId && showCreate && <form onSubmit={createProject} className="task-form" style={{ marginBottom: 24 }}>
        <div className="form-grid">
          <label>Project name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website redesign" required /></label>
          <label>Short description<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" /></label>
        </div>
        <div style={{display:"flex",gap:8}}><button className="primary-button" disabled={saving}>{saving ? "Creating…" : "Create project"}</button><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button></div>
      </form>}
      {message && <p className="auth-status error">{message}</p>}
      {loading ? <p className="muted">Loading projects…</p> : projects.length === 0 ? <p className="muted">No projects to show yet.</p> :
        <div className="project-list-table">
          <div className="project-list-head"><span>Project</span><span>Description</span><span>Tasks</span><span>Created</span><span></span></div>
          {projects.map(project => <div className="project-list-entry" key={project.id}>
            <div className="project-list-row">
              <button type="button" className="project-title-toggle" onClick={()=>void toggleProject(project.id)}><span className="project-expand-icon">{expanded.includes(project.id)?"⌄":"›"}</span><strong>{project.name}</strong></button>
              <span className="project-list-description">{project.description||"—"}</span>
              <span className="project-list-count">{taskMap[project.id]?.length ?? "—"}</span>
              <span className="project-list-date">{new Date(project.created_at).toLocaleDateString()}</span>
              <Link className="project-details-link" href={`/projects/${project.id}`}>Open project →</Link>
            </div>
            {expanded.includes(project.id)&&<div className="project-inline-content">
              {loadingProject===project.id?<p className="muted">Loading sections and tasks…</p>:(sectionMap[project.id]||[]).map(section=><div className="project-inline-section" key={section.id}>
                <strong>{section.name}</strong><div className="project-inline-table">
                  <div className="project-inline-head"><span>Task</span><span>Assignee</span><span>Start date</span><span>Due date</span><span>Priority</span><span>Attachment</span><span>Status</span></div>
                  {(taskMap[project.id]||[]).filter(t=>t.section_id===section.id).map(task=><div className="project-inline-task" key={task.id}>
                    <Link href={`/projects/${project.id}`} className="project-task-name">{task.title}</Link><span>{(assigneeMap[task.id]||[]).join(", ")||"Unassigned"}</span><span>{task.start_date||"—"}</span><span>{task.due_date||"—"}</span><span>{task.priority||"medium"}</span>
                    <span>{(attachmentMap[task.id]||[]).length?<button type="button" className="inline-attachment-yes" onClick={()=>void Promise.all((attachmentMap[task.id]||[]).map(file=>openQuickAttachment(file.bucket_path)))}>Yes ({attachmentMap[task.id].length})</button>:"—"}</span><span>{task.is_done?"Done":task.is_on_going?"On-going":"Open"}</span>
                  </div>)}
                </div></div>)}
              {(sectionMap[project.id]||[]).length===0&&!loadingProject&&<p className="muted">No sections yet.</p>}
            </div>}
          </div>)}
        </div>}
    </section>
  </AppShell>;
}
