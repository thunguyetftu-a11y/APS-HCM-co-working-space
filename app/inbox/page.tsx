"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";

type Notice = { id:string; kind:string; message:string; created_at:string; read_at:string|null; project_id:string|null; task_id:string|null };

export default function InboxPage() {
  const [items,setItems]=useState<Notice[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  async function load() {
    try {
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) { setError("Sign in to view your inbox."); return; }
      const {data,error}=await supabase.from("notifications").select("id,kind,message,created_at,read_at,project_id,task_id").order("created_at",{ascending:false}).limit(100);
      if(error) throw error;
      setItems(data??[]);
    } catch(e) { setError(e instanceof Error?e.message:"Could not load inbox."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[]);
  async function markRead(id:string) {
    const supabase=createClient();
    const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);
    if(error) setError(error.message); else setItems(old=>old.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n));
  }
  async function markAll() {
    const supabase=createClient();
    const {error}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).is("read_at",null);
    if(error) setError(error.message); else setItems(old=>old.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));
  }
  return <AppShell title="Inbox" subtitle="Notifications and project activity">
    <section className="panel-box" style={{padding:20}}>
      <div className="section-header"><h3>Notifications</h3><button className="secondary-button" onClick={()=>void markAll()}>Mark all as read</button></div>
      {error&&<p className="auth-status error">{error}</p>}
      {loading?<p className="muted">Loading inbox…</p>:items.length===0?<p className="muted">You're all caught up. Mentions, project invitations and task updates will appear here.</p>:
        items.map(item=><article key={item.id} className="project-card" style={{marginBottom:10,opacity:item.read_at?.65:1}}>
          <div className="section-header"><strong>{item.kind.replaceAll("_"," ")}</strong><span className="muted">{new Date(item.created_at).toLocaleString()}</span></div>
          <p>{item.message}</p>
          {!item.read_at&&<button className="mini-button" onClick={()=>void markRead(item.id)}>Mark as read</button>}
        </article>)}
    </section>
  </AppShell>;
}
