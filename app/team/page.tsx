import { AppShell } from "@/components/AppShell";
import { teamMembers } from "@/data/mockData";

export default function TeamPage() {
  return (
    <AppShell title="Team" subtitle="Shared workload and collaboration">
      <div className="stats-grid team-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eaf4ff" }}>✓</div>
          <div>
            <p>Active contributors</p>
            <h3>12</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#edf8f2" }}>↗</div>
          <div>
            <p>Productivity</p>
            <h3>84%</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff3d9" }}>◎</div>
          <div>
            <p>Responses today</p>
            <h3>48</h3>
          </div>
        </div>
      </div>

      <div className="panel-box full-width">
        <div className="section-header">
          <h3>Team members</h3>
          <span>4 members</span>
        </div>

        <div className="team-list">
          {teamMembers.map((member) => (
            <div className="team-card" key={member.name}>
              <div className="avatar large" style={{ background: member.color }}>{member.name[0]}</div>
              <div>
                <strong>{member.name}</strong>
                <p>{member.role}</p>
              </div>
              <div className="team-metrics">
                <span>Tasks: 9</span>
                <span>Focus: 76%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
