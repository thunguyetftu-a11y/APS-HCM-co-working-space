import type { Task } from "@/data/mockData";

export type Account = {
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

export const STORAGE_KEYS = {
  accounts: "teamflow.accounts",
  tasks: "teamflow.tasks",
} as const;

export function readStoredTasks(): Task[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.tasks);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredTasks(tasks: Task[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

export function readStoredAccounts(): Account[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.accounts);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredAccounts(accounts: Account[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}
