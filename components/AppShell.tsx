"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Calendar", href: "/calendar" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }) => {
        const current = data.user;
        setUser(current ? { name: current.user_metadata?.full_name || current.email?.split("@")[0] || "Team member", email: current.email || "" } : null);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        const current = session?.user;
        setUser(current ? { name: current.user_metadata?.full_name || current.email?.split("@")[0] || "Team member", email: current.email || "" } : null);
      });
      return () => listener.subscription.unsubscribe();
    } catch { setUser(null); }
  }, []);

  async function handleLogout() {
    try { await createClient().auth.signOut(); } finally { window.location.href = "/login"; }
  }

  return <div className="page-shell">
    <aside className="sidebar">
      <div className="brand-row"><div className="brand-mark">T</div><div><p className="eyebrow">Workspace</p><h2>TeamFlow</h2></div></div>
      <nav className="nav-menu">{navItems.map(item => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>{item.label}</Link>;
      })}</nav>
      <div className="sidebar-card"><p className="eyebrow">Signed-in member</p><div className="member-stack">{user ? <div className="member-item"><div className="avatar" style={{background:"#6aa8ff"}}>{user.name[0]?.toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div></div> : <span className="muted">Not signed in</span>}</div></div>
    </aside>
    <section className="content-panel">
      <header className="topbar"><div><p className="eyebrow">{subtitle || "Overview"}</p><h1>{title}</h1></div><div className="topbar-actions">{user ? <><span className="user-pill">{user.name}</span><button className="secondary-button" onClick={handleLogout}>Log out</button></> : <Link href="/login" className="primary-button top-link-button">Sign in</Link>}</div></header>
      {children}
    </section>
  </div>;
}
