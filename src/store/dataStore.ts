import { create } from "zustand";
import type { Email, Task, EmailFolder } from "@/types";
import { mockEmails, mockTasks } from "@/utils/mockData";

interface DataStore {
  emails: Email[];
  tasks: Task[];
  addEmail: (email: Email) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  removeEmail: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  importTasksFromCSV: (tasks: Task[]) => void;
  importEmailsFromCSV: (emails: Email[]) => void;
  importEmailsFromEML: (emails: Email[]) => void;
  importEmailsFromMBOX: (emails: Email[]) => void;
  setEmails: (emails: Email[]) => void;
  setTasks: (tasks: Task[]) => void;
  getEmailsByFolder: (folder: EmailFolder) => Email[];
  reset: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  emails: [...mockEmails],
  tasks: [...mockTasks],
  addEmail: (email) => {
    set((state) => ({
      emails: [...state.emails, { ...email, folder: email.folder || "inbox" }],
    }));
  },
  updateEmail: (id, updates) => {
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, ...updates } : email
      ),
    }));
  },
  removeEmail: (id) => {
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id),
    }));
  },
  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }));
  },
  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },
  importTasksFromCSV: (newTasks) => {
    set((state) => {
      const existingIds = new Set(state.tasks.map((t) => t.id));
      const uniqueNewTasks = newTasks.filter((t) => !existingIds.has(t.id));
      return {
        tasks: [...state.tasks, ...uniqueNewTasks],
      };
    });
  },
  importEmailsFromCSV: (newEmails) => {
    set((state) => {
      const existingIds = new Set(state.emails.map((e) => e.id));
      const uniqueNewEmails = newEmails.filter((e) => !existingIds.has(e.id));
      return {
        emails: [...state.emails, ...uniqueNewEmails],
      };
    });
  },
  importEmailsFromEML: (newEmails) => {
    set((state) => {
      const existingIds = new Set(state.emails.map((e) => e.id));
      const uniqueNewEmails = newEmails.filter((e) => !existingIds.has(e.id));
      return {
        emails: [...state.emails, ...uniqueNewEmails],
      };
    });
  },
  importEmailsFromMBOX: (newEmails) => {
    set((state) => {
      const existingIds = new Set(state.emails.map((e) => e.id));
      const uniqueNewEmails = newEmails.filter((e) => !existingIds.has(e.id));
      return {
        emails: [...state.emails, ...uniqueNewEmails],
      };
    });
  },
  setEmails: (emails) => {
    set({ emails });
  },
  setTasks: (tasks) => {
    set({ tasks });
  },
  getEmailsByFolder: (folder): Email[] => {
    return useDataStore
      .getState()
      .emails.filter((email) => (email.folder || "inbox") === folder);
  },
  reset: () => {
    set({
      emails: [...mockEmails],
      tasks: [...mockTasks],
    });
  },
}));
