"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { readStoredAccounts, writeStoredAccounts } from "@/lib/plannerStorage";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const pageTitle = useMemo(() => (mode === "signin" ? "Welcome back" : "Create your account"), [mode]);
  const pageText = useMemo(
    () =>
      mode === "signin"
        ? "Sign in to continue planning work and sharing calendars."
        : "Set up a TeamFlow workspace for your team.",
    [mode]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "signup") {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
        setStatus({ type: "error", message: "Please complete all fields before creating an account." });
        return;
      }

      const existingAccounts = readStoredAccounts();
      const alreadyExists = existingAccounts.some(
        (account) => account.email.toLowerCase() === form.email.toLowerCase()
      );

      if (alreadyExists) {
        setStatus({ type: "error", message: "That email address is already in use." });
        return;
      }

      const nextAccounts = [
        ...existingAccounts,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          createdAt: new Date().toISOString(),
        },
      ];

      writeStoredAccounts(nextAccounts);
      setStatus({ type: "success", message: "Account created successfully. You can now sign in." });
      setForm({ name: "", email: "", password: "" });
      setMode("signin");
      return;
    }

    if (!form.email.trim() || !form.password.trim()) {
      setStatus({ type: "error", message: "Enter your email and password to continue." });
      return;
    }

    const accounts = readStoredAccounts();
    const match = accounts.find(
      (account) =>
        account.email.toLowerCase() === form.email.toLowerCase() && account.password === form.password
    );

    if (!match) {
      setStatus({ type: "error", message: "No matching account was found. Create an account first." });
      return;
    }

    setStatus({
      type: "success",
      message: `Welcome back, ${match.name}! Redirecting to your dashboard...`,
    });

    window.setTimeout(() => {
      window.location.href = "/";
    }, 300);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="brand-row auth-brand">
          <div className="brand-mark">T</div>
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>TeamFlow</h2>
          </div>
        </div>

        <h1>{pageTitle}</h1>
        <p className="auth-subtext">{pageText}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Jordan Lee"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <button type="submit" className="primary-button auth-button">
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {status && <p className={`auth-status ${status.type}`}>{status.message}</p>}

        <div className="auth-links">
          <Link href="/">Back to dashboard</Link>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMode((current) => (current === "signin" ? "signup" : "signin"));
              setStatus(null);
            }}
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
