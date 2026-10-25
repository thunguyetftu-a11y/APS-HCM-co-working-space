import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const mockProject = {
  id: "launch-sprint",
  name: "Product Launch Sprint",
  owner: "Alicia",
  status: "In Progress",
  progress: 74,
  team: ["Alicia", "Harold", "Mila", "Sam"],
  dueDate: "Nov 30",
  objective: "Prepare launch events, final polish, and customer onboarding handoff.",
};

export default function ProjectDetailPage() {
  return (
    <AppShell title={mockProject.name} subtitle="Project details">
      <div className="detail-layout">
        <div className="panel-box">
          <div className="section-header">
            <h3>Overview</h3>
            <span>{mockProject.status}</span>
          </div>

          <p className="detail-copy">{mockProject.objective}</p>

          <div className="project-progress">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${mockProject.progress}%` }} />
            </div>
            <span>{mockProject.progress}%</span>
          </div>

          <div className="detail-grid">
            <div>
              <span className="meta-label">Owner</span>
              <strong>{mockProject.owner}</strong>
            </div>
            <div>
              <span className="meta-label">Due Date</span>
              <strong>{mockProject.dueDate}</strong>
            </div>
          </div>
        </div>

        <div className="panel-box">
          <div className="section-header">
            <h3>Team</h3>
            <span>{mockProject.team.length} members</span>
          </div>

          <div className="member-list-inline">
            {mockProject.team.map((member) => (
              <span className="team-chip" key={member}>{member}</span>
            ))}
          </div>

          <Link href="/projects" className="primary-button inline-button">Back to projects</Link>
        </div>
      </div>
    </AppShell>
  );
}
