"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { getTeamMembers } from "@/lib/plannerStorage";
import { type Task, type TaskAttachment } from "@/data/mockData";

const projectOptions = ["General", "Client Work", "Operations"];

const buildEmptyDraft = () => ({
  title: "",
  description: "",
  status: "Open" as Task["status"],
  project: "General",
  assignee: "",
  priority: "Medium" as Task["priority"],
  startDate: "",
  dueDate: "",
  attachments: [] as TaskAttachment[],
  comments: [] as Task["comments"],
});

export function TaskComposer({
  isOpen,
  onClose,
  onCreate,
  initialTask,
  mode = "create",
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  initialTask?: Task;
  mode?: "create" | "edit";
}) {
  const [draft, setDraft] = useState(buildEmptyDraft);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  useEffect(() => {
    const names = getTeamMembers();
    setTeamMembers(names);
    if (isOpen) {
      setDraft(
        initialTask
          ? {
              ...initialTask,
              assignee: initialTask.assignee || "",
              attachments: initialTask.attachments || [],
              comments: initialTask.comments || [],
            }
          : buildEmptyDraft()
      );
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selected = Array.from(files).slice(0, 2).map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type.startsWith("image/") ? "photo" : "document",
        url,
      };
    });

    setDraft((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...selected],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const task: Task = {
      ...draft,
      id: initialTask?.id ?? Date.now(),
      title: draft.title.trim(),
      description: draft.description.trim() || "No description provided yet.",
      assignee: draft.assignee || "Unassigned",
      assigneeColor:
        teamMembers.find((person) => person.name === draft.assignee)?.color ??
        "#6aa8ff",
      priority: draft.priority,
      startDate: draft.startDate,
      dueDate: draft.dueDate,
      attachments: draft.attachments || [],
      comments: draft.comments || [],
    };

    if (!task.title) return;

    onCreate(task);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Create new task">
      <div className="task-modal wider">
        <div className="task-modal-header">
          <div>
            <p className="eyebrow">New task</p>
            <h3>{mode === "edit" ? "Edit task" : "Create work item"}</h3>
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

          <div className="form-grid two-col">
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
                <option value="">Unassigned</option>
                {teamMembers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid two-col">
            <label>
              Status
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, status: event.target.value as Task["status"] }))
                }
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
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

          <div className="form-grid two-col">
            <label>
              Start date
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </label>

            <label>
              Due date
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </label>
          </div>

          <div className="field-group">
            <label>
              Attach photo / document
              <input type="file" multiple onChange={handleFileChange} />
            </label>
          </div>

          <div className="field-group">
            <label>Attached files</label>
            <div className="attachment-list">
              {draft.attachments.length === 0 ? (
                <span className="muted">No files attached</span>
              ) : (
                draft.attachments.map((attachment) => (
                  <div key={attachment.id} className="attachment-item">
                    <span>{attachment.name}</span>
                    <span className="small-tag">{attachment.type}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="task-modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {mode === "edit" ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
