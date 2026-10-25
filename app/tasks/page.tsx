"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TaskComposer } from "@/components/TaskComposer";
import { initialTasks, type Task } from "@/data/mockData";
import { readStoredTasks, writeStoredTasks } from "@/lib/plannerStorage";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isComposerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    const storedTasks = readStoredTasks();
    if (storedTasks.length > 0) {
      setTasks(storedTasks);
    }
  }, []);

  useEffect(() => {
    writeStoredTasks(tasks);
  }, [tasks]);

  function handleCreateTask(task: Task) {
    setTasks((current) => [task, ...current]);
  }

  return (
    <>
      <AppShell title="Tasks" subtitle="All team work items">
        <div className="panel-box full-width">
          <div className="section-header">
            <h3>Task overview</h3>
            <div className="header-actions">
              <span>{tasks.length} items</span>
              <button type="button" className="primary-button" onClick={() => setComposerOpen(true)}>
                Create task
              </button>
            </div>
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
                        <span className="avatar-mini" style={{ background: task.assigneeColor }}>
                          {task.assignee[0]}
                        </span>
                        {task.assignee}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${task.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {task.status}
                      </span>
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

      <TaskComposer
        isOpen={isComposerOpen}
        onClose={() => setComposerOpen(false)}
        onCreate={handleCreateTask}
      />
    </>
  );
}
