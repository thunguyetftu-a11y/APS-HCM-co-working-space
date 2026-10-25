import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { tasks } from "@/data/mockData";

const projectGroups = [
  { name: "Website Redesign", total: 4, completed: 2, due: "Nov 24" },
  { name: "Marketing Launch", total: 3, completed: 1, due: "Nov 26" },
  { name: "Operations", total: 5, completed: 3, due: "Nov 29" },
];

export default function ProjectsPage() {
  return (
    <AppShell title="Projects" subtitle="Portfolio overview">
      <div className="stats-grid">
        {projectGroups.map((project) => (
          <div className="stat-card" key={project.name}>
            <div className="stat-icon" style={{ background: "#edf4ff" }}>▣</div>
            <div>
              <p>{project.name}</p>
              <h3>{project.completed}/{project.total}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-box full-width">
        <div className="section-header">
          <h3>Project pipeline</h3>
          <span>{tasks.length} tasks tracked</span>
        </div>

        <div className="project-list">
          {projectGroups.map((project) => {
            const progress = Math.round((project.completed / project.total) * 100);
            return (
              <div className="project-card" key={project.name}>
                <div className="project-header-row">
                  <strong>{project.name}</strong>
                  <span>Due {project.due}</span>
                </div>

                <div className="project-progress">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}%</span>
                </div>

                <div className="project-metrics">
                  <span>{project.completed} completed</span>
                  <span>{project.total - project.completed} remaining</span>
                </div>

                <Link href="/projects/launch-sprint" className="secondary-link">View details</Link>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
