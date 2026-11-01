"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string; description: string; created_by?: string };
type Section = { id: string; name: string; position: number };
type Task = { id: string; section_id: string | null; parent_task_id?: string | null; title: string; description: string; priority?: string; start_date: string | null; due_date: string | null; is_done?: boolean; is_on_going?: boolean; progress?: string };
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
  const [taskAssigneeNames,setTaskAssigneeNames]=useState<Record<string,string[]>>({});
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
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState<string | null>(null);
  const [quickTaskTitle,setQuickTaskTitle]=useState("");
  const [quickTaskSection,setQuickTaskSection]=useState("");
  const [quickAddOpen,setQuickAddOpen]=useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskStart, setTaskStart] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [assigneeIds,setAssigneeIds]=useState<string[]>([]);
  const [comments,setComments]=useState<any[]>([]);
  const [commentDraft,setCommentDraft]=useState("");
  const [attachments,setAttachments]=useState<any[]>([]);
  const [mentionQuery,setMentionQuery]=useState<string|null>(null);
  const [mentionStart,setMentionStart]=useState<number|null>(null);
  const [selectedMentions,setSelectedMentions]=useState<string[]>([]);

  async function load() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotice("Please sign in to access this project."); return; }
      const [p, s, t, m, pr] = await Promise.all([
        supabase.from("projects").select("id,name,description,created_by").eq("id", projectId).single(),
        supabase.from("sections").select("id,name,position").eq("project_id", projectId).order("position"),
        supabase.from("tasks").select("id,section_id,parent_task_id,title,description,priority,start_date,due_date,is_done,is_on_going,progress").eq("project_id", projectId).order("created_at", { ascending: false }),
        supabase.from("project_members").select("user_id,can_view,can_create,can_edit").eq("project_id", projectId),
        supabase.from("profiles").select("id,display_name,email")
      ]);
      if (p.error) throw p.error;
      if (s.error) throw s.error;
      if (t.error) throw t.error;
      setProject(p.data); setSections(s.data ?? []); setTasks(t.data ?? []);
      const ids=(t.data??[]).map(task=>task.id); const {data:assigned}=ids.length?await supabase.from("task_assignees").select("task_id,user_id").in("task_id",ids):{data:[]};
      const mapped:Record<string,string[]>={};(assigned??[]).forEach(row=>{const profile=(pr.data??[]).find(item=>item.id===row.user_id);if(profile)(mapped[row.task_id]||(mapped[row.task_id]=[])).push(profile.display_name||profile.email||"Member");});setTaskAssigneeNames(mapped);
      const mine = (m.data ?? []).find((member) => member.user_id === user.id);
      setCanCreate(Boolean(mine?.can_create)||p.data.created_by===user.id); setCanEdit(Boolean(mine?.can_edit)||p.data.created_by===user.id);
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
      setSectionName(""); setShowSectionForm(false); await load();
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
      setTaskDrafts((current) => ({ ...current, [sectionId]: "" })); setShowTaskForm(null); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not add task."); }
    finally { setBusy(false); }
  }

  async function addQuickTask(e:React.FormEvent<HTMLFormElement>) { e.preventDefault(); if(!quickTaskTitle.trim())return; setBusy(true);setNotice(""); try { const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error("Please sign in first.");const {error}=await db.from("tasks").insert({project_id:projectId,section_id:quickTaskSection||null,title:quickTaskTitle.trim(),created_by:user.id});if(error)throw error;setQuickTaskTitle("");setQuickAddOpen(false);await load(); } catch(error){setNotice(error instanceof Error?error.message:"Could not create task.");} finally{setBusy(false);} }

  async function openTask(task: Task) {
    setActiveTask(task);setTaskTitle(task.title);setTaskDescription(task.description||"");setTaskPriority(task.priority||"medium");setTaskStart(task.start_date||"");setTaskDue(task.due_date||"");setSubtaskTitle("");setCommentDraft("");
    const db=createClient();
    const [a,b,d]=await Promise.all([db.from("task_assignees").select("user_id").eq("task_id",task.id),db.from("task_comments").select("id,body,author_id,created_at").eq("task_id",task.id).order("created_at"),db.from("attachments").select("id,file_name,bucket_path").eq("task_id",task.id).order("created_at")]);
    setAssigneeIds((a.data||[]).map(x=>x.user_id));setComments(b.data||[]);setAttachments(d.data||[]);
  }
  async function updateAssignees(ids:string[]) {
    if(!activeTask)return;
    const db=createClient(); const previous=assigneeIds;
    setAssigneeIds(ids); setNotice("");
    const additions=ids.filter(id=>!previous.includes(id));
    const removals=previous.filter(id=>!ids.includes(id));
    if(additions.length){const {error}=await db.from("task_assignees").upsert(additions.map(user_id=>({task_id:activeTask.id,user_id})),{onConflict:"task_id,user_id"});if(error){setAssigneeIds(previous);setNotice("Could not assign member: "+error.message);return;}}
    if(removals.length){const {error}=await db.from("task_assignees").delete().eq("task_id",activeTask.id).in("user_id",removals);if(error){setNotice("Could not remove member: "+error.message);return;}}
  }
  function handleCommentChange(value:string, cursor:number) {
    setCommentDraft(value);
    setSelectedMentions(ids=>ids.filter(id=>{const p=profiles.find(x=>x.id===id);return !!p && value.includes("@"+(p.display_name||p.email));}));
    const before=value.slice(0,cursor); const match=before.match(/(?:^|\s)@([^@\s]*)$/);
    if(match){setMentionQuery(match[1]);setMentionStart(cursor-match[1].length-1);}else{setMentionQuery(null);setMentionStart(null);}
  }
  function insertMention(profile:Profile) {
    if(mentionStart===null)return;
    const input=document.getElementById("task-comment-draft") as HTMLTextAreaElement|null;
    const start=mentionStart; const end=input?.selectionStart??commentDraft.length;
    const token="@"+(profile.display_name||profile.email);
    const next=commentDraft.slice(0,start)+token+" "+commentDraft.slice(end);
    setCommentDraft(next);setSelectedMentions(ids=>ids.includes(profile.id)?ids:[...ids,profile.id]);setMentionQuery(null);setMentionStart(null);
    requestAnimationFrame(()=>{input?.focus();const pos=start+token.length+1;input?.setSelectionRange(pos,pos);});
  }
  async function postComment(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!activeTask||!commentDraft.trim())return;const {data:{user}}=await createClient().auth.getUser();if(!user)return;
    const mentions=selectedMentions.filter(id=>commentDraft.includes("@"+(profiles.find(p=>p.id===id)?.display_name||profiles.find(p=>p.id===id)?.email||"")));
    const {error}=await createClient().from("task_comments").insert({task_id:activeTask.id,author_id:user.id,body:commentDraft.trim(),mentions});
    if(error)setNotice(error.message);else{setCommentDraft("");setSelectedMentions([]);setMentionQuery(null);await openTask(activeTask);}
  }
  async function uploadTaskAttachment(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0];if(!file||!activeTask)return;const {data:{user}}=await createClient().auth.getUser();if(!user)return;
    const db=createClient();const path=projectId+"/"+activeTask.id+"/"+Date.now()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const {error:upError}=await db.storage.from("task-attachments").upload(path,file);if(upError){setNotice(upError.message);return;}
    const {error}=await db.from("attachments").insert({project_id:projectId,task_id:activeTask.id,uploaded_by:user.id,bucket_path:path,file_name:file.name,mime_type:file.type||"application/octet-stream",size_bytes:file.size});
    if(error)setNotice(error.message);else await openTask(activeTask);e.target.value="";
  }
  async function openTaskAttachment(path:string) {
    const {data,error}=await createClient().storage.from("task-attachments").createSignedUrl(path,300);if(error)setNotice(error.message);else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }
  function wrapDescription(before:string,after="") {
    const el=document.getElementById("task-description") as HTMLTextAreaElement|null;if(!el)return;const a=el.selectionStart,b=el.selectionEnd,selected=taskDescription.slice(a,b)||"text";
    setTaskDescription(taskDescription.slice(0,a)+before+selected+after+taskDescription.slice(b));requestAnimationFrame(()=>{el.focus();el.setSelectionRange(a+before.length,a+before.length+selected.length);});
  }

  async function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!activeTask || !taskTitle.trim()) return;
    if (taskStart && taskDue && taskDue < taskStart) { setNotice("Due date must be on or after start date."); return; }
    setBusy(true);
    try { const supabase=createClient(); const {error}=await supabase.from("tasks").update({title:taskTitle.trim(),description:taskDescription,priority:taskPriority,start_date:taskStart||null,due_date:taskDue||null}).eq("id",activeTask.id); if(error) throw error; setActiveTask(null); await load(); }
    catch(error){setNotice(error instanceof Error?error.message:"Could not save task.");} finally{setBusy(false);}
  }

  async function addSubtask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!activeTask || !subtaskTitle.trim()) return;
    const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
    const {error}=await supabase.from("tasks").insert({project_id:projectId,section_id:activeTask.section_id,parent_task_id:activeTask.id,title:subtaskTitle.trim(),created_by:user.id});
    if(error)setNotice(error.message); else {setSubtaskTitle(""); await load();}
  }

  async function setTaskFlag(task: Task, flag: "is_done" | "is_on_going") {
    const supabase = createClient();
    const patch = flag === "is_done" ? { is_done: !task.is_done, is_on_going: false } : { is_on_going: !task.is_on_going, is_done: false };
    const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
    if (error) setNotice(error.message); else await load();
  }

  async function inviteMember(event?: React.FormEvent<HTMLFormElement>, selectedEmail?: string) {
    event?.preventDefault();
    const email = (selectedEmail ?? memberEmail).trim().toLowerCase();
    if (!email) { setNotice("Enter an email address."); return; }
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add member.");
      setMemberEmail("");
      setSuggestionsOpen(false);
      setNotice(result.invited ? "Invitation sent to "+email+". Ask the user to check their inbox." : "Member added: "+email);
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not add member.");
    } finally {
      setBusy(false);
    }
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
        <div className="section-header"><div><h3>Tasks</h3><span className="muted">{tasks.filter(t=>!t.parent_task_id).length} tasks · {sections.length} sections</span></div>{canCreate && <div className="project-add-actions"><button type="button" className="secondary-button" onClick={()=>setShowSectionForm(v=>!v)}>＋ Section</button><button type="button" className="primary-button" onClick={()=>setQuickAddOpen(v=>!v)}>＋ Task</button></div>}</div>
        {canCreate&&quickAddOpen&&<form className="quick-task-create" onSubmit={e=>void addQuickTask(e)}><input autoFocus value={quickTaskTitle} onChange={e=>setQuickTaskTitle(e.target.value)} placeholder="Task name…" required/><select value={quickTaskSection} onChange={e=>setQuickTaskSection(e.target.value)}><option value="">No section</option>{sections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="primary-button" disabled={busy}>Create task</button><button type="button" className="row-cancel" onClick={()=>setQuickAddOpen(false)}>Cancel</button></form>
        {canCreate && showSectionForm && <form onSubmit={(e)=>void addSection(e)} className="inline-add-row"><input autoFocus value={sectionName} onChange={e=>setSectionName(e.target.value)} placeholder="New section name" onKeyDown={e=>{if(e.key==="Escape")setShowSectionForm(false);}}/><button type="submit" disabled={busy}>Add section</button><button type="button" className="row-cancel" onClick={()=>setShowSectionForm(false)}>Cancel</button></form>}
        {sections.map(section => <div key={section.id} className="asana-section">
          <div className="asana-section-heading"><span>⌄</span><strong>{section.name}</strong><span className="section-count">{tasks.filter(t=>t.section_id===section.id && !t.parent_task_id).length}</span><button type="button" className="row-plus" title="Add task" onClick={()=>setShowTaskForm(showTaskForm===section.id?null:section.id)}>+</button></div>
          <div className="asana-task-table"><div className="asana-task-header"><span>Task name</span><span>Assignee</span><span>Start date</span><span>Due date</span><span>Priority</span><span>Attachment</span><span>Status</span></div>
            {tasks.filter(t=>t.section_id===section.id && !t.parent_task_id).map(task=><div key={task.id} className="asana-task-row">
              <button type="button" className="task-name-cell" onClick={()=>openTask(task)}><span className={task.is_done?"task-check checked":"task-check"}>{task.is_done?"✓":""}</span>{task.title}</button>
              <span className="task-row-meta">{(taskAssigneeNames[task.id]||[]).join(", ")||"Unassigned"}</span><span className="task-row-meta">{task.start_date||"—"}</span><span className="task-row-meta">{task.due_date||"—"}</span><span className={"priority priority-"+(task.priority||"medium")}>{task.priority||"medium"}</span><span className="task-row-meta">—</span>
              <span className="task-row-status"><button type="button" className="mini-button" onClick={()=>void setTaskFlag(task,"is_on_going")}>On-going</button><button type="button" className="mini-button done" onClick={()=>void setTaskFlag(task,"is_done")}>Done</button></span>
            </div>)}
            {canCreate && showTaskForm===section.id && <form className="asana-inline-task" onSubmit={e=>void addTask(e,section.id)}><span className="task-check"></span><input autoFocus value={taskDrafts[section.id]??""} onChange={e=>setTaskDrafts(v=>({...v,[section.id]:e.target.value}))} placeholder="Type task name and press Enter"/><button type="submit" disabled={busy}>Add</button><button type="button" className="row-cancel" onClick={()=>setShowTaskForm(null)}>×</button></form>}
          </div></div>) }
        {sections.length===0 && <p className="muted">No sections yet. Create the first section to start organizing tasks.</p>}
      </section>

      {activeTask && <div className="task-drawer-backdrop" onClick={()=>setActiveTask(null)}><section className="task-drawer" onClick={e=>e.stopPropagation()}>
        <div className="section-header"><h3>Task details</h3><button type="button" className="secondary-button" onClick={()=>setActiveTask(null)}>Close</button></div>
        <form onSubmit={e=>void saveTask(e)} className="task-form">
          <label>Task name<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required/></label>
          <label>Description<div><div className="text-format-toolbar"><button type="button" onClick={()=>wrapDescription("**","**")}><b>B</b></button><button type="button" onClick={()=>wrapDescription("*","*")}><i>I</i></button><button type="button" onClick={()=>wrapDescription("\n- ")}>• List</button><button type="button" onClick={()=>wrapDescription("\n## ")}>Heading</button></div><textarea id="task-description" value={taskDescription} onChange={e=>setTaskDescription(e.target.value)} rows={5} placeholder="Task details and expected result"/></div></label>
          <div className="form-grid">
            <label>Priority<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label>Start date<input type="date" value={taskStart} onChange={e=>setTaskStart(e.target.value)}/></label>
            <label>Due date<input type="date" min={taskStart||undefined} value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label>
          </div>
          <button className="primary-button" disabled={busy}>{busy?"Saving…":"Save task"}</button>
        </form>
<div className="task-extra-grid">
          <section className="task-extra-block"><h4>Assignees</h4>{(canEdit||canCreate)?<div className="assignee-options">{profiles.filter(p=>members.some(m=>m.user_id===p.id)).map(p=><label key={p.id}><input type="checkbox" checked={assigneeIds.includes(p.id)} onChange={e=>void updateAssignees(e.target.checked?[...assigneeIds,p.id]:assigneeIds.filter(id=>id!==p.id))}/>{p.display_name||p.email||"Team member"}</label>)}</div>:<p className="muted">{assigneeIds.length?assigneeIds.length+" assigned":"Not assigned"}</p>}</section>
          <section className="task-extra-block"><h4>Attachments</h4><div className="attachment-list">{attachments.map(file=><button type="button" className="attachment-item" key={file.id} onClick={()=>void openTaskAttachment(file.bucket_path)}>{file.file_name}</button>)}</div><label className="file-upload">＋ Attach file<input type="file" onChange={e=>void uploadTaskAttachment(e)}/></label></section>
          <section className="task-extra-block"><h4>Comments &amp; @mentions</h4><div className="task-comments">{comments.map(comment=><article className="comment-item" key={comment.id}><div className="comment-meta"><strong>{profiles.find(p=>p.id===comment.author_id)?.display_name||"Team member"}</strong><span>{new Date(comment.created_at).toLocaleString()}</span></div><p>{comment.body}</p></article>)}</div><form className="comment-box" onSubmit={e=>void postComment(e)}><div className="mention-composer"><textarea id="task-comment-draft" value={commentDraft} onChange={e=>handleCommentChange(e.target.value,e.target.selectionStart)} onClick={e=>handleCommentChange(commentDraft,e.currentTarget.selectionStart)} onKeyUp={e=>handleCommentChange(commentDraft,e.currentTarget.selectionStart)} placeholder="Write a comment… Type @ to mention a teammate"/>{mentionQuery!==null&&<div className="mention-suggestions">{profiles.filter(p=>members.some(m=>m.user_id===p.id)&&((p.display_name||p.email||"").toLowerCase().includes(mentionQuery.toLowerCase())||p.email?.toLowerCase().includes(mentionQuery.toLowerCase()))).slice(0,7).map(p=><button type="button" key={p.id} onMouseDown={e=>e.preventDefault()} onClick={()=>insertMention(p)}><strong>{p.display_name||p.email}</strong><small>{p.email}</small></button>)}</div>}</div><button className="primary-button" disabled={!commentDraft.trim()}>Comment</button></form></section>
        </div>        <div style={{marginTop:18}}><h4>Subtasks</h4>{tasks.filter(t=>t.parent_task_id===activeTask.id).map(t=><p key={t.id} className="muted">{t.title} · {getProgress(t)}</p>)}
          {canCreate && <form onSubmit={e=>void addSubtask(e)} className="project-form"><input value={subtaskTitle} onChange={e=>setSubtaskTitle(e.target.value)} placeholder="New subtask"/><button className="secondary-button">Add subtask</button></form>}
        </div>
      </section></div>}
      <section className="panel-box" style={{padding:20}}>
        <div className="section-header"><h3>Project access</h3><span>Manage view, create and edit rights</span></div>
        <p className="muted">Add an existing account by email or send an invitation to a new user. Set view, create and edit permissions for each member.</p>
        {members.map(member => <div key={member.user_id} className="project-row" style={{padding:"10px 0",borderBottom:"1px solid #edf2fb"}}>
          <div className="project-member-identity"><strong>{profiles.find(p=>p.id===member.user_id)?.display_name||profiles.find(p=>p.id===member.user_id)?.email||"Project member"}</strong><small>{profiles.find(p=>p.id===member.user_id)?.email||member.user_id.slice(0,8)+"…"}</small></div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>{(["can_view","can_create","can_edit"] as const).map(key => <label key={key} style={{display:"flex",gap:5,alignItems:"center",fontSize:13}}><input type="checkbox" checked={Boolean(member[key])} disabled={!canEdit} onChange={e => void savePermission(member,key,e.target.checked)} />{key.replace("can_","")}</label>)}</div>
        </div>)}
        {canEdit && <div style={{position:"relative",marginTop:14}}><form onSubmit={(e)=>void inviteMember(e)} className="project-form"><input type="email" value={memberEmail} onFocus={()=>setSuggestionsOpen(true)} onChange={e=>{setMemberEmail(e.target.value);setSuggestionsOpen(true);}} placeholder="Enter email or select an existing user" /><button className="secondary-button" disabled={busy}>{busy?"Adding…":"Add member"}</button></form>{suggestionsOpen && memberEmail && profiles.filter(p=>p.email?.toLowerCase().includes(memberEmail.toLowerCase())).slice(0,6).length>0 && <div className="project-card" style={{position:"absolute",zIndex:10,left:0,right:0,top:"100%",padding:8}}>{profiles.filter(p=>p.email?.toLowerCase().includes(memberEmail.toLowerCase())).slice(0,6).map(p=><button key={p.id} type="button" className="text-button" style={{display:"block",padding:8}} onClick={()=>void inviteMember(undefined,p.email)}>{p.display_name || p.email} · {p.email}</button>)}</div>}<p className="muted">Existing accounts are added immediately. New email addresses receive a Supabase invitation to create an account.</p></div>}
        {notice && <p className="auth-status error">{notice}</p>}
      </section>
    </div>
  </AppShell>;
}
