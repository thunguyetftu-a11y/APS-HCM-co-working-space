"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskComposer } from "@/components/TaskComposer";
import { calendarEvents, milestones, quickStats, type Task } from "@/data/mockData";
import {
  getTeamMembers,
  readSignedInUser,
  readStoredProjects,
  readStoredTasks,
  writeStoredProjects,
  writeStoredTasks,
} from "@/lib/plannerStorage";

type Status = "Open" | "In Progress" | "Review" | "Done";

const columns: Status[] = ["Open", "In Progress", "Review", "Done"];

export default function HomePage() {
  const [selectedProject, setSelectedProject] = useState<string>("All Projects");
  const [selectedUser, setSelectedUser] = useState<string>("All Team");
  const [calendarMode, setCalendarMode] = useState<"calendar" | "list">("calendar");
  const [projects, setProjects] = useState<string[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");

  const signedInUser = readSignedInUser();

  useEffect(() => {
    const savedProjects = readStoredProjects();
    const savedTasks = readStoredTasks();

    setProjects(savedProjects.map((project) => project.name));
    setTaskList(savedTasks.length ? savedTasks : []);
  }, []);

  useEffect(() => {
    writeStoredTasks(taskList);
  }, [taskList]);

  useEffect(() => {
    if (projects.length) {
      writeStoredProjects(projects.map((name, index) => ({ id: String(index), name })));
    }
  }, [projects]);

  function handleCreateTask(task: Task) {
    setTaskList((current) => [task, ...current]);
  }

  function handleSaveTask(task: Task) {
    setTaskList((current) => {
      const idx = current.findIndex((item) => item.id === task.id);
      if (idx >= 0) {
        return current.map((item) => (item.id === task.id ? task : item));
      }
      return [task, ...current];
    });
  }

  function handleCommentSubmit(taskId: number) {
    const text = commentText.trim();
    if (!text) return;

    const nextTaskList = taskList.map((item) => {
      if (item.id !== taskId) return item;

      const mentions = text.match(/@([A-Za-z0-9_.-]+)/g) ?? [];
      const names = mentions.map((mention) => mention.slice(1));
      const currentUser = signedInUser?.name ?? "Guest";

      return {
        ...item,
        comments: [
          ...(item.comments ?? []),
          {
            id: Date.now(),
            author: currentUser,
            message: text,
            createdAt: new Date().toISOString(),
            mentions: names,
          },
        ],
      };
    });

    setTaskList(nextTaskList);
    setCommentText("");
  }

  function openTaskForEdit(task: Task) {
    setSelectedTask(task);
    setEditingTask(task);
    setComposerOpen(true);
  }

  function handleDoneToggle(task: Task) {
    const nextTask = {
      ...task,
      status: task.status === "Done" ? "Open" : "Done",
    };
    setTaskList((current) => current.map((item) => item.id === task.id ? nextTask : item));
  }

  const filteredTasks = useMemo(() => {
    return taskList.filter((task) => {
      const projectMatch = selectedProject === "All Projects" || task.project === selectedProject;
      const userMatch = selectedUser === "All Team" || task.assignee === selectedUser;
      return projectMatch && userMatch;
    });
  }, [selectedProject, selectedUser, taskList]);

  const board = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column] = filteredTasks.filter((task) => task.status === column);
        return acc;
      },
      {} as Record<Status, Task[]>
    );
  }, [filteredTasks]);

  const teamNames = useMemo(() => getTeamMembers(), []);

  return (
    <>
      <main className="page-shell">
        <aside className="sidebar">
          <div className="brand-row">
            <div className="brand-mark">T</div>
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>TeamFlow</h2>
            </div>
          </div>

          <nav className="nav-menu">
            <a className="nav-item active" href="/">Overview</a>
            <a className="nav-item" href="/projects">Projects</a>
            <a className="nav-item" href="/calendar">Calendar</a>
            <a className="nav-item" href="/tasks">Tasks</a>
            <a className="nav-item" href="/reports">Reports</a>
            <a className="nav-item" href="/settings">Settings</a>
          </nav>

          <div className="sidebar-card">
            <p className="eyebrow">Team members</p>
            <div className="member-stack">
              {teamNames.length ? (
                teamNames.map((member) => (
                  <div className="member-item" key={member}>
                    <div className="avatar" style={{ background: "#6aa8ff" }}>{member[0]}</div>
                    <div>
                      <strong>{member}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="member-item">
                  <div className="avatar" style={{ background: "#6aa8ff" }}>?</div>
                  <div>
                    <strong>No team members yet</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="content-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Monday, 18 Nov 2026</p>
              <h1>Product Launch Sprint</h1>
            </div>
            <div className="topbar-actions">
              <button className="secondary-button" type="button">Share</button>
              <button
                className="primary-button"
                type="button"
                onClick={() => setComposerOpen(true)}
              >
                New Task
              </button>
            </div>
          </header>

          <div className="filters-row">
            <select
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
            >
              <option>All Projects</option>
              {projects.length ? (
                projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))
              ) : null}
            </select>

            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
            >
              <option>All Team</option>
              {teamNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="stats-grid">
            {quickStats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <div className="stat-icon" style={{ background: stat.tint }}>{stat.icon}</div>
                <div>
                  <p>{stat.label}</p>
                  <h3>{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="main-grid">
            <div className="board-panel">
              <div className="section-header">
                <h3>Team Board</h3>
                <span>{filteredTasks.length} tasks</span>
              </div>

              <div className="board-columns">
                {columns.map((column) => (
                  <div className="board-column" key={column}>
                    <div className="column-header">
                      <span>{column}</span>
                      <span className="count-pill">{board[column].length}</span>
                    </div>

                    <div className="task-list">
                      {board[column].map((task) => (
                        <article
                          key={task.id}
                          className="task-card"
                          onClick={() => openTaskForEdit(task)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              openTaskForEdit(task);
                            }
                          }}
                        >
                          <div className="task-topline">
                            <span className={`priority priority-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                            <span className="task-project">{task.project}</span>
                          </div>

                          <h4>{task.title}</h4>
                          <p>{task.description}</p>

                          <div className="meta-row">
                            <span>{task.startDate || "No start date"}</span>
                            <span>{task.dueDate || "No due date"}</span>
                          </div>

                          <div className="task-footer">
                            <div
                              className="avatar-mini"
                              style={{ background: task.assigneeColor || "#6aa8ff" }}
                            >
                              {task.assignee ? task.assignee[0] : "?"}
                            </div>
                            <span>{task.assignee || "Unassigned"}</span>
                          </div>

                          <div className="task-actions-inline">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDoneToggle(task);
                              }}
                              className={`mini-button ${task.status === "Done" ? "done" : ""}`}
                            >
                              {task.status === "Done" ? "Re-open" : "Done"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="side-stack">
              <div className="panel-box">
                <div className="section-header">
                  <h3>Calendar</h3>
                  <div className="calendar-toggle">
                    <button
                      type="button"
                      className={calendarMode === "calendar" ? "active" : ""}
                      onClick={() => setCalendarMode("calendar")}
                    >
                      Calendar
                    </button>
                    <button
                      type="button"
                      className={calendarMode === "list" ? "active" : ""}
                      onClick={() => setCalendarMode("list")}
                    >
                      List
                    </button>
                  </div>
                </div>

                {calendarMode === "calendar" ? (
                  <div className="calendar-grid">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div className="day-cell" key={index}>
                        <small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small>
                        <strong>{index + 14}</strong>
                        {index === 1 && <span className="calendar-dot active" />}
                        {index === 4 && <span className="calendar-dot" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="calendar-list">
                    {calendarEvents.map((event) => (
                      <div className="event-item" key={event.title}>
                        <div className="event-time">{event.time}</div>
                        <div>
                          <strong>{event.title}</strong>
                          <p>{event.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel-box">
                <div className="section-header">
                  <h3>Upcoming</h3>
                  <span>Next 4</span>
                </div>

                {calendarEvents.map((event) => (
                  <div className="event-item" key={event.title}>
                    <div className="event-time">{event.time}</div>
                    <div>
                      <strong>{event.title}</strong>
                      <p>{event.type}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel-box">
                <div className="section-header">
                  <h3>Milestones</h3>
                  <span>Focused</span>
                </div>

                {milestones.map((milestone) => (
                  <div className="milestone-item" key={milestone.name}>
                    <div className="milestone-bullet" />
                    <div>
                      <strong>{milestone.name}</strong>
                      <p>{milestone.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>

      {selectedTask && (
        <div className="modal-backdrop">
          <div className="task-detail-panel">
            <div className="task-detail-header">
              <div>
                <h3>{selectedTask.title}</h3>
                <p>{selectedTask.project}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setSelectedTask(null)}
              >
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
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Write a comment and mention someone like @Mila"
                    />
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleCommentSubmit(selectedTask.id)}
                    >
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
          setSelectedTask(task);
          setComposerOpen(false);
          setEditingTask(null);
        }}
      />
    </>
  );
}
