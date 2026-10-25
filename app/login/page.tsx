import Link from "next/link";

export default function LoginPage() {
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

        <h1>Welcome back</h1>
        <p className="auth-subtext">Sign in to continue planning work and sharing calendars.</p>

        <form className="auth-form">
          <label>
            Email
            <input type="email" placeholder="name@company.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="submit" className="primary-button auth-button">Sign in</button>
        </form>

        <div className="auth-links">
          <Link href="/">Back to dashboard</Link>
          <a href="#">Create account</a>
        </div>
      </div>
    </main>
  );
}
