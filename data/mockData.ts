export type TaskComment = {
  id: number;
  author: string;
  message: string;
  createdAt: string;
  mentions: string[];
};

export type TaskAttachment = {
  id: number;
  name: string;
  type: "photo" | "document";
  url: string;
};

export type TaskStatus = "Open" | "In Progress" | "Review" | "Done";
export type TaskPriority = "High" | "Medium" | "Low";

export type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  project: string;
  assignee: string;
  assigneeColor: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  attachments: TaskAttachment[];
  comments: TaskComment[];
};

export const quickStats = [
  { label: "Active Tasks", value: "32", icon: "✓", tint: "#eaf4ff" },
  { label: "Team Progress", value: "74%", icon: "↗", tint: "#edf8f2" },
  { label: "Meetings", value: "8", icon: "◔", tint: "#fff3d9" },
  { label: "Overdue", value: "3", icon: "!", tint: "#ffe9eb" },
];

export const teamMembers = [
  { name: "Alicia", role: "Product Lead", color: "#4d8cff" },
  { name: "Harold", role: "Design Lead", color: "#26b98a" },
  { name: "Mila", role: "PM", color: "#f28e2b" },
  { name: "Sam", role: "Developer", color: "#9b62ff" },
];

export const defaultProjects = ["General", "Client Work", "Operations"];

export const tasks: Task[] = [
  {
    id: 1,
    title: "Landing page redesign",
    description: "Finalize homepage hero labels and product copy for launch.",
    status: "Open",
    project: "General",
    assignee: "Alicia",
    assigneeColor: "#4d8cff",
    priority: "High",
    startDate: "2026-11-12",
    dueDate: "2026-11-20",
    attachments: [],
    comments: [],
  },
  {
    id: 2,
    title: "Prototype validation",
    description: "Collect testing notes from beta users and update flows.",
    status: "In Progress",
    project: "Client Work",
    assignee: "Harold",
    assigneeColor: "#26b98a",
    priority: "Medium",
    startDate: "2026-11-10",
    dueDate: "2026-11-18",
    attachments: [],
    comments: [],
  },
  {
    id: 3,
    title: "Launch checklist",
    description: "Review approval list across marketing and support teams.",
    status: "Review",
    project: "Operations",
    assignee: "Mila",
    assigneeColor: "#f28e2b",
    priority: "High",
    startDate: "2026-11-14",
    dueDate: "2026-11-22",
    attachments: [],
    comments: [],
  },
];

export const initialTasks = tasks;

export const calendarEvents = [
  { title: "Sprint Review", type: "Meeting", time: "09:00" },
  { title: "Design QA", type: "Checkin", time: "11:30" },
  { title: "Launch Sync", type: "Planning", time: "14:00" },
  { title: "Milestone Check", type: "Status", time: "16:15" },
];

export const milestones = [
  { name: "Beta release", date: "Nov 22" },
  { name: "Campaign launch", date: "Nov 25" },
  { name: "Team planning", date: "Nov 30" },
];
