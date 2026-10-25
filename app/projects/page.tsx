"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  readStoredProjects,
  writeStoredProjects,
} from "@/lib/plannerStorage";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const savedProjects = readStoredProjects();
    setProjects(savedProjects.map((project) => project.name));
  }, []);

  function handleCreateProject() {
    const projectName = draft.trim();
    if (!projectName) return;

    setProjects((current) => {
      const exists = current.includes(projectName);
      if (exists) return current;
      return [...current, projectName];
    });

    setDraft("");
  }

  function handleUpdateProject(projectName: string) {
    const updatedName = draft.trim();
    if (!updatedName) return;

    setProjects((current) =>
      current.map((item) => (item === projectName ? updatedName : item))
    );
    setDraft("");
    setEditingId(null);
  }

  useEffect(() => {
    writeStoredProjects(projects.map((name, index) => ({ id: String(index), name })));
  }, [projects]);

  return (
    <AppShell title="Projects" subtitle="All team projects">
      <div className="panel-box">
        <div className="section-header">
          <h3>Projects</h3>
          <button type="button" className="primary-button" onClick={() => setDraft("")}>
            New project
          </button>
        </div>

        <div className="project-form">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Project name"
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              if (editingId) {
                handleUpdateProject(editingId);
              } else {
                handleCreateProject();
              }
            }}
          >
            {editingId ? "Save project" : "Create project"}
          </button>
        </div>

        <div className="project-grid">
          {projects.length === 0 ? (
            <div className="muted">No projects yet</div>
          ) : (
            projects.map((project) => (
              <div key={project} className="project-card">
                <div className="project-row">
                  <div>
                    <h4>{project}</h4>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setDraft(project);
                      setEditingId(project);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
