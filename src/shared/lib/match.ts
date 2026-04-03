import type { User, Task } from "../types";

export function rankHelpersForTask(task: Task, candidates: User[]): User[] {
  return [...candidates]
    .sort((a, b) => {
      const dA = Math.hypot(a.lat - task.lat, a.lng - task.lng);
      const dB = Math.hypot(b.lat - task.lat, b.lng - task.lng);
      if (dA !== dB) return dA - dB;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return b.jobsDone - a.jobsDone;
    })
    .slice(0, 3);
}
