"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { readSignedInUser, writeSignedInUser } from "@/lib/plannerStorage";

const navItems = [
  { label: "Overview", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Calendar", href: "/calendar" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const user = readSignedInUser();

  function handleLogout() {
    writeSignedInUser(null);
    window.location.href = "/";
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">T</div>
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>TeamFlow</h2>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Team members</p>
          <div className="member-stack">
            {user ? (
              <div className="member-item">
                <div className="avatar" style={{ background: "#6aa8ff" }}>{user.name[0]}</div>
                <div>
                  <strong>{user.name}</strong>
                  <span>Owner</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{subtitle || "Overview"}</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            {user ? (
              <>
                <span className="user-pill">{user.name}</span>
                <button type="button" className="secondary-button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <Link href="/login" className="primary-button top-link-button">
                Sign in
              </Link>
            )}
          </div>
        </header>

        {children}
      </section>
    </div>
  );
}
