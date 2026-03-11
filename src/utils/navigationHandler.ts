/**
 * NavigationHandler Module
 *
 * Handles navigation to email and task detail views.
 * Integrates with RecentItemsTracker to update on navigation.
 *
 * Routes:
 * - Email detail: /emails/[id]
 * - Task detail: /tasks/[id]
 */

import { Email, Task } from "@/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { addItem as addRecentItem } from "./recentItemsTracker";

export interface NavigationHandler {
  navigateToEmail: (emailId: string, router: AppRouterInstance) => void;
  navigateToTask: (taskId: string, router: AppRouterInstance) => void;
}

/**
 * Navigate to an email detail view page
 * @param emailId - The ID of the email to navigate to
 * @param router - Next.js router instance
 */
export function navigateToEmail(
  emailId: string,
  router: AppRouterInstance
): void {
  router.push(`/emails/${emailId}`);
}

/**
 * Navigate to a task detail view page
 * @param taskId - The ID of the task to navigate to
 * @param router - Next.js router instance
 */
export function navigateToTask(
  taskId: string,
  router: AppRouterInstance
): void {
  router.push(`/tasks/${taskId}`);
}

/**
 * Navigate to an email detail view and update recent items
 * @param email - The email object to navigate to
 * @param router - Next.js router instance
 */
export function navigateToEmailWithTracking(
  email: Email,
  router: AppRouterInstance
): void {
  addRecentItem(email, "email");
  navigateToEmail(email.id, router);
}

/**
 * Navigate to a task detail view and update recent items
 * @param task - The task object to navigate to
 * @param router - Next.js router instance
 */
export function navigateToTaskWithTracking(
  task: Task,
  router: AppRouterInstance
): void {
  addRecentItem(task, "task");
  navigateToTask(task.id, router);
}

export const navigationHandler: NavigationHandler = {
  navigateToEmail,
  navigateToTask,
};
