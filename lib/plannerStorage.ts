import type { Task } from "@/data/mockData";

export type Account = {
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
};

export type SignedInUser = {
  name: string;
  email: string;
};

export const STORAGE_KEYS = {
  accounts: "teamflow.accounts",
  projects: "teamflow.projects",
  tasks: "teamflow.tasks",
  signedInUser: "teamflow.signedInUser",
} as const;

export function readStoredAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.accounts);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredAccounts(accounts: Account[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}

export function readStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.projects);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
}

export function readStoredTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.tasks);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

export function readSignedInUser(): SignedInUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.signedInUser);
    return raw ? (JSON.parse(raw) as SignedInUser) : null;
  } catch {
    return null;
  }
}

export function writeSignedInUser(user: SignedInUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEYS.signedInUser);
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.signedInUser, JSON.stringify(user));
}

export function getTeamMembers(): string[] {
  const accounts = readStoredAccounts();
  return accounts.map((account) => account.name).filter(Boolean);
}
