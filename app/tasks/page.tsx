"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { TaskComposer } from "@/components/TaskComposer";
import { type Task } from "@/data/mockData";
import {
  readSignedInUser,
  readStoredTasks,
  writeStoredTasks,
} from "@/lib/plannerStorage";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const storedTasks = readStoredTasks();
    setTasks(storedTasks);
  }, []);

  useEffect(() => {
    writeStoredTasks(tasks);
  }, [tasks]);

  const currentUser = readSignedInUser();

  function handleCreateTask(task: Task) {
    setTasks((current) => [task, ...current]);
  }

  function handleSaveTask(task: Task) {
    setTasks((current) => {
      const idx = current.findIndex((item) => item.id === task.id);
      if (idx >= 0) {
        return current.map((item) => (item.id === task.id ? task : item));
      }
      return [task, ...current];
    });
  }

  function handleDoneToggle(task: Task) {
    const nextTask: Task = {
  ...task,
  status: task.status === "Done" ? "Open" : "Done",
};

setTasks((current) =>
  current.map((item) =>
    item.id === task.id ? nextTask : item
  )
);
  }

  return (
    <>
      <AppShell title="Tasks" subtitle="All team work items">
        <div className="panel-box full-width">
          <div className="section-header">
            <h3>Task overview</h3>
            <div className="header-actions">
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
                  <th>Start</th>
                  <th>Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.project}</td>
                    <td>
                      <div className="owner-cell">
                        <span className="avatar-mini" style={{ background: task.assigneeColor || "#6aa8ff" }}>
                          {task.assignee ? task.assignee[0] : "?"}
                        </span>
                        {task.assignee || "Unassigned"}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${task.status.toLowerCase().replace(/\s+/g, "-")}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>{task.startDate || "—"}</td>
                    <td>{task.dueDate || "—"}</td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="secondary-button" onClick={() => setSelectedTask(task)}>
                          View
                        </button>
                        <button type="button" className="secondary-button" onClick={() => handleDoneToggle(task)}>
                          {task.status === "Done" ? "Re-open" : "Done"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AppShell>

      {selectedTask && (
        <div className="modal-backdrop">
          <div className="task-detail-panel">
            <div className="task-detail-header">
              <div>
                <h3>{selectedTask.title}</h3>
                <p>{selectedTask.project}</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>

            <div className="task-detail-body">
              <div className="task-detail-main">
                <div className="task-detail-block">
                  <h4>Overview</h4>
                  <p>{selectedTask.description}</p>
                </div>

                <div className="task-detail-block">
                  <h4>Details</h4>
                  <ul>
                    <li>Owner: {selectedTask.assignee || "Unassigned"}</li>
                    <li>Project: {selectedTask.project}</li>
                    <li>Start: {selectedTask.startDate || "Not set"}</li>
                    <li>Due: {selectedTask.dueDate || "Not set"}</li>
                    <li>Status: {selectedTask.status}</li>
                  </ul>
                </div>

                <div className="task-detail-block">
                  <h4>Attachments</h4>
                  <div className="attachment-list">
                    {selectedTask.attachments?.length ? (
                      selectedTask.attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                          <span>{attachment.name}</span>
                          <span className="small-tag">{attachment.type}</span>
                        </div>
                      ))
                    ) : (
                      <span className="muted">No attachments</span>
                    )}
                  </div>
                </div>

                <div className="task-detail-block">
                  <h4>Comments</h4>
                  <div className="task-comments">
                    {selectedTask.comments?.length ? (
                      selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <strong>{comment.author}</strong>
                          <p>{comment.message}</p>
                          <div className="comment-meta">
                            <span>{comment.createdAt}</span>
                            <span>{comment.mentions.length ? `@${comment.mentions.join(", @")}` : ""}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="muted">No comments yet</span>
                    )}
                  </div>

                  <div className="comment-box">
                    <textarea
                      value={""}
                      onChange={() => {}}
                      placeholder="Write a comment and mention someone like @Mila"
                    />
                    <button type="button" className="primary-button">
                      Post comment
                    </button>
                  </div>
                </div>
              </div>

              <div className="task-detail-sidebar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setSelectedTask(null);
                    setEditingTask(selectedTask);
                    setComposerOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleDoneToggle(selectedTask)}
                >
                  {selectedTask.status === "Done" ? "Re-open" : "Done"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TaskComposer
        isOpen={isComposerOpen}
        initialTask={editingTask ?? undefined}
        mode={editingTask ? "edit" : "create"}
        onClose={() => {
          setComposerOpen(false);
          setEditingTask(null);
        }}
        onCreate={(task) => {
          if (editingTask) {
            handleSaveTask(task);
          } else {
            handleCreateTask(task);
          }
          setComposerOpen(false);
          setEditingTask(null);
          setSelectedTask(task);
        }}
      />
    </>
  );
}
