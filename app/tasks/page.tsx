import { AppShell } from "@/components/AppShell";
import { tasks } from "@/data/mockData";

export default function TasksPage() {
  return (
    <AppShell title="Tasks" subtitle="All team work items">
      <div className="panel-box full-width">
        <div className="section-header">
          <h3>Task overview</h3>
          <span>{tasks.length} items</span>
        </div>

        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Due</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.project}</td>
                  <td>
                    <div className="owner-cell">
                      <span className="avatar-mini" style={{ background: task.assigneeColor }}>{task.assignee[0]}</span>
                      {task.assignee}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${task.status.toLowerCase().replace(/\s+/g, "-")}`}>{task.status}</span>
                  </td>
                  <td>{task.deadline}</td>
                  <td>
                    <div className="compact-progress">
                      <span>{task.progress}%</span>
                      <div className="progress-track small-track">
                        <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
