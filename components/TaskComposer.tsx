"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { teamMembers, type Task } from "@/data/mockData";

const projectOptions = ["Website Redesign", "Marketing Launch", "Operations"];

const buildEmptyDraft = () => ({
  title: "",
  description: "",
  status: "Backlog" as Task["status"],
  project: "Website Redesign",
  assignee: "Alicia",
  priority: "Medium" as Task["priority"],
  deadline: "Nov 30",
  progress: 0,
});

export function TaskComposer({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
}) {
  const [draft, setDraft] = useState(buildEmptyDraft);

  useEffect(() => {
    if (isOpen) {
      setDraft(buildEmptyDraft());
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const member = teamMembers.find((person) => person.name === draft.assignee) ?? teamMembers[0];
    const task: Task = {
      id: Date.now(),
      title: draft.title.trim(),
      description: draft.description.trim() || "No description provided yet.",
      status: draft.status,
      project: draft.project,
      assignee: draft.assignee,
      assigneeColor: member.color,
      priority: draft.priority,
      deadline: draft.deadline,
      progress: draft.progress,
    };

    if (!task.title) {
      return;
    }

    onCreate(task);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create new task">
      <div className="task-modal">
        <div className="task-modal-header">
          <div>
            <p className="eyebrow">New task</p>
            <h3>Create work item</h3>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label>
              Title
              <input
                required
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Prepare release notes"
              />
            </label>
          </div>

          <div className="field-group">
            <label>
              Description
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Describe the outcome, scope, and notes."
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Project
              <select
                value={draft.project}
                onChange={(event) => setDraft((prev) => ({ ...prev, project: event.target.value }))}
              >
                {projectOptions.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Assignee
              <select
                value={draft.assignee}
                onChange={(event) => setDraft((prev) => ({ ...prev, assignee: event.target.value }))}
              >
                {teamMembers.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Status
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, status: event.target.value as Task["status"] }))
                }
              >
                <option>Backlog</option>
                <option>In Progress</option>
                <option>Review</option>
                <option>Done</option>
              </select>
            </label>

            <label>
              Priority
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, priority: event.target.value as Task["priority"] }))
                }
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Due date
              <input
                value={draft.deadline}
                onChange={(event) => setDraft((prev) => ({ ...prev, deadline: event.target.value }))}
                placeholder="Nov 30"
              />
            </label>

            <label>
              Progress (%)
              <input
                type="number"
                min={0}
                max={100}
                value={draft.progress}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, progress: Number(event.target.value) || 0 }))
                }
              />
            </label>
          </div>

          <div className="task-modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
