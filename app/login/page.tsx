"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode,setMode] = useState<"signin"|"signup">("signin");
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState<{type:"success"|"error";text:string}|null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data,error } = await supabase.auth.signUp({ email:email.trim(),password,options:{data:{full_name:name.trim()}} });
        if (error) throw error;
        if (!data.session) {
          setMessage({type:"success",text:"Account created. Check your email to confirm your address, then sign in."});
        } else {
          window.location.href = "/projects";
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({email:email.trim(),password});
        if (error) throw error;
        window.location.href = "/projects";
      }
    } catch(error) {
      setMessage({type:"error",text:error instanceof Error ? error.message : "Authentication failed."});
    } finally { setBusy(false); }
  }

  return <main className="auth-shell"><div className="auth-card">
    <div className="brand-row auth-brand"><div className="brand-mark">T</div><div><p className="eyebrow">Workspace</p><h2>TeamFlow</h2></div></div>
    <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
    <p className="auth-subtext">{mode === "signin" ? "Sign in to access your team's shared projects." : "Create an account to start collaborating in TeamFlow."}</p>
    <form className="auth-form" onSubmit={submit}>
      {mode === "signup" && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required /></label>}
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required /></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"} minLength={6} required /></label>
      <button className="primary-button auth-button" disabled={busy}>{busy ? "Please wait…" : mode==="signin" ? "Sign in" : "Create account"}</button>
    </form>
    {message && <p className={`auth-status ${message.type}`}>{message.text}</p>}
    <div className="auth-links"><Link href="/">Back to dashboard</Link><button type="button" className="text-button" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage(null);}}>{mode==="signin"?"Create account":"Sign in"}</button></div>
  </div></main>;
}
