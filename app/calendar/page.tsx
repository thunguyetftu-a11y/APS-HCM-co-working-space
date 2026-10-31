"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type CalendarTask = { id:string; title:string; start_date:string|null; due_date:string|null; project_id:string; projects?:{name:string}|null };
type CalendarMode = "Month"|"Week"|"Agenda";

function dateKey(date: Date) { return date.toISOString().slice(0,10); }
function dateLabel(value: string) { return new Date(value+"T00:00:00").toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); }

export default function CalendarPage() {
  const [tasks,setTasks] = useState<CalendarTask[]>([]);
  const [mode,setMode] = useState<CalendarMode>("Month");
  const [anchor,setAnchor] = useState(()=>new Date());
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(()=>{
    async function load() {
      try {
        const supabase=createClient();
        const {data:{user}}=await supabase.auth.getUser();
        if(!user){setError("Sign in to see your project tasks on the calendar.");return;}
        const {data,error:queryError}=await supabase.from("tasks").select("id,title,start_date,due_date,project_id,projects(name)").order("due_date");
        if(queryError) throw queryError;
        setTasks((data??[]) as unknown as CalendarTask[]);
      } catch(e) { setError(e instanceof Error?e.message:"Could not load calendar tasks."); }
      finally { setLoading(false); }
    }
    void load();
  },[]);

  const events=useMemo(()=>{
    const list:{date:string;task:CalendarTask;kind:string}[]=[];
    tasks.forEach(task=>{
      if(task.start_date) list.push({date:task.start_date,task,kind:"Start"});
      if(task.due_date && task.due_date!==task.start_date) list.push({date:task.due_date,task,kind:"Due"});
    });
    return list.sort((a,b)=>a.date.localeCompare(b.date));
  },[tasks]);

  const monthStart=new Date(anchor.getFullYear(),anchor.getMonth(),1);
  const monthEnd=new Date(anchor.getFullYear(),anchor.getMonth()+1,0);
  const weekStart=new Date(anchor); weekStart.setDate(anchor.getDate()-((anchor.getDay()+6)%7));
  const visibleStart=mode==="Month"?new Date(monthStart.getFullYear(),monthStart.getMonth(),1-((monthStart.getDay()+6)%7)):weekStart;
  const visibleDays=mode==="Month"?42:7;
  const days=Array.from({length:visibleDays},(_,i)=>{const d=new Date(visibleStart);d.setDate(visibleStart.getDate()+i);return d;});
  const heading=mode==="Month"?anchor.toLocaleDateString(undefined,{month:"long",year:"numeric"}):mode==="Week"?`Week of ${dateLabel(dateKey(weekStart))}`:"Task agenda";

  function move(step:number) {
    const next=new Date(anchor);
    if(mode==="Month") next.setMonth(next.getMonth()+step);
    else next.setDate(next.getDate()+step*(mode==="Week"?7:30));
    setAnchor(next);
  }

  return <AppShell title="Calendar" subtitle="Project task schedule">
    <section className="panel-box" style={{padding:20}}>
      <div className="section-header" style={{flexWrap:"wrap",gap:12}}>
        <div className="header-actions"><button className="secondary-button" onClick={()=>move(-1)}>Previous</button><button className="secondary-button" onClick={()=>setAnchor(new Date())}>Today</button><button className="secondary-button" onClick={()=>move(1)}>Next</button></div>
        <h3>{heading}</h3>
        <div className="calendar-toggle">{(["Month","Week","Agenda"] as CalendarMode[]).map(item=><button key={item} className={mode===item?"active":""} onClick={()=>setMode(item)}>{item}</button>)}</div>
      </div>
      {error && <p className="auth-status error">{error}</p>}
      {loading ? <p className="muted">Loading tasks…</p> : mode==="Agenda" ? <div>{events.filter(e=>e.date>=dateKey(new Date())).map((event,i)=><div className="event-item" key={event.task.id+event.kind+i}><span className="event-time">{dateLabel(event.date)}</span><div><strong>{event.task.title}</strong><p>{event.kind} date · {event.task.projects?.name||"Project"}</p><Link className="text-button" href={`/projects/${event.task.project_id}`}>Open project</Link></div></div>)}{events.filter(e=>e.date>=dateKey(new Date())).length===0&&<p className="muted">No upcoming task dates.</p>}</div> :
      <><div className="calendar-week-grid" style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:8}}>
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=><strong key={day} className="muted">{day}</strong>)}
        {days.map(day=>{const key=dateKey(day);const dayEvents=events.filter(e=>e.date===key);return <div key={key} className="calendar-day" style={{minHeight:mode==="Month"?112:180,background:day.getMonth()===anchor.getMonth()||mode==="Week"?"#f6f9ff":"#fbfcfe",padding:8,borderRadius:12,overflow:"hidden"}}><div className="calendar-day-header"><strong>{day.getDate()}</strong></div><div className="calendar-events">{dayEvents.map((event,i)=><Link key={event.task.id+event.kind+i} href={`/projects/${event.task.project_id}`} className="mini-event" style={{display:"block",marginTop:5,fontSize:11}}>{event.kind}: {event.task.title}</Link>)}</div></div>;})}
      </div><p className="muted" style={{marginTop:14}}>Tasks appear on their start date and due date. Select a task to open its project.</p></>}
    </section>
  </AppShell>;
}
