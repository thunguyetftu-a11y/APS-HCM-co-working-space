"use client";

import { useEffect, useMemo, useState } from "react";

import { TaskComposer } from "@/components/TaskComposer";
import { calendarEvents, initialTasks, milestones, quickStats, tasks as defaultTasks, teamMembers, type Task } from "@/data/mockData";
import { readStoredTasks, writeStoredTasks } from "@/lib/plannerStorage";

type Status = "Backlog" | "In Progress" | "Review" | "Done";

const columns: Status[] = ["Backlog", "In Progress", "Review", "Done"];

export default function HomePage() {
  const [selectedProject, setSelectedProject] = useState<string>("All Projects");
  const [selectedUser, setSelectedUser] = useState<string>("All Team");
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [taskList, setTaskList] = useState<Task[]>(defaultTasks);

  useEffect(() => {
    const storedTasks = readStoredTasks();
    if (storedTasks.length > 0) {
      setTaskList(storedTasks);
    }
  }, []);

  useEffect(() => {
    writeStoredTasks(taskList);
  }, [taskList]);

  function handleCreateTask(task: Task) {
    setTaskList((current) => [task, ...current]);
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
      {} as Record<Status, typeof taskList>
    );
  }, [filteredTasks, taskList]);

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
              {teamMembers.map((member) => (
                <div className="member-item" key={member.name}>
                  <div className="avatar" style={{ background: member.color }}>{member.name[0]}</div>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </div>
                </div>
              ))}
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
              <button className="primary-button" type="button" onClick={() => setComposerOpen(true)}>New Task</button>
            </div>
          </header>

          <div className="filters-row">
            <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
              <option>All Projects</option>
              <option>Website Redesign</option>
              <option>Marketing Launch</option>
              <option>Operations</option>
            </select>

            <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
              <option>All Team</option>
              {teamMembers.map((member) => (
                <option key={member.name} value={member.name}>{member.name}</option>
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
                        <article className="task-card" key={task.id}>
                          <div className="task-topline">
                            <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                            <span className="task-project">{task.project}</span>
                          </div>

                          <h4>{task.title}</h4>
                          <p>{task.description}</p>

                          <div className="meta-row">
                            <span>{task.deadline}</span>
                            <span>{task.progress}%</span>
                          </div>

                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                          </div>

                          <div className="task-footer">
                            <div className="avatar-mini" style={{ background: task.assigneeColor }}>{task.assignee[0]}</div>
                            <span>{task.assignee}</span>
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
                  <span>Week view</span>
                </div>

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

      <TaskComposer isOpen={isComposerOpen} onClose={() => setComposerOpen(false)} onCreate={handleCreateTask} />
    </>
  );
}
