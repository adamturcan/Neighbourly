import { helpers, tasks, services } from "./seed";
import type { Task, User, Offer, Review, Service } from "../types";
import { v4 as uuid } from "uuid";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ---------- Services ----------
export async function listServices(params?: {
  near?: { lat: number; lng: number };
  category?: string;
}): Promise<Service[]> {
  await sleep(250);
  let list = services as Service[];

  if (params?.category) {
    list = list.filter((s) => (s.categories ?? []).includes(params.category!));
  }

  if (params?.near) {
    const d = (s: Service) =>
      Math.hypot(s.lat - params.near!.lat, s.lng - params.near!.lng);
    list = [...list].sort((a, b) => d(a) - d(b));
  }

  return list;
}

export async function getService(id: string): Promise<Service | undefined> {
  await sleep(150);
  return (services as Service[]).find((s) => s.id === id);
}

// ---------- Tasks / Offers ----------
const offersByTask = new Map<string, Offer[]>();

if ((tasks as Task[])[0]) {
  const t0 = (tasks as Task[])[0].id;
  offersByTask.set(t0, [
    {
      id: uuid(),
      taskId: t0,
      helperId: (helpers as User[])[0]?.id ?? "u1",
      amount: 38,
      message: "Can do it at 18:30",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      taskId: t0,
      helperId: (helpers as User[])[1]?.id ?? "u2",
      amount: 40,
      message: "Available now",
      createdAt: new Date().toISOString(),
    },
  ]);
}

export const Repo = {
  async listTasks(): Promise<Task[]> {
    await sleep(300);
    return tasks as Task[];
  },

  async getTask(taskId: string): Promise<Task | undefined> {
    await sleep(150);
    return (tasks as Task[]).find((t) => t.id === taskId);
  },

  async createTask(
    input: Omit<Task, "id" | "status" | "createdAt">,
  ): Promise<Task> {
    await sleep(350);
    const t: Task = {
      ...input,
      id: uuid(),
      status: "open" as Task["status"],
      createdAt: new Date().toISOString(),
    };
    (tasks as Task[]).unshift(t);

    const base = Math.max(
      25,
      Math.round(t.budget ? Number(t.budget) * 0.95 : 30),
    );
    offersByTask.set(t.id, [
      {
        id: uuid(),
        taskId: t.id,
        helperId:
          (helpers as User[])[
            Math.floor(Math.random() * (helpers as User[]).length)
          ].id,
        amount: base,
        message: "Can help within 1h",
        createdAt: new Date().toISOString(),
      },
    ]);
    return t;
  },

  async listOffers(taskId: string): Promise<Offer[]> {
    await sleep(250);
    return offersByTask.get(taskId) ?? [];
  },

  async createOffer(input: Omit<Offer, "id" | "createdAt">): Promise<Offer> {
    await sleep(300);
    const offer: Offer = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    const arr = offersByTask.get(input.taskId) ?? [];
    arr.push(offer);
    offersByTask.set(input.taskId, arr);
    return offer;
  },

  async acceptOffer({
    taskId,
    offerId,
  }: {
    taskId: string;
    offerId: string;
  }) {
    await sleep(300);
    const task = (tasks as Task[]).find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");

    const offer = (offersByTask.get(taskId) ?? []).find(
      (o) => o.id === offerId,
    );
    if (!offer) throw new Error("Offer not found");

    task.helperId = offer.helperId;
    task.status = "in_progress";
    return { ok: true };
  },

  async completeTask({ taskId }: { taskId: string }) {
    await sleep(300);
    const task = (tasks as Task[]).find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    task.status = "completed";
    return { ok: true };
  },

  async getNearbyHelpers(params: {
    lat: number;
    lng: number;
    category?: string;
  }): Promise<User[]> {
    await sleep(350);
    const pool = params.category
      ? (helpers as User[]).filter((h) => (h.skills ?? []).includes(params.category!))
      : (helpers as User[]);
    const dist = (u: User) =>
      Math.hypot(u.lat - params.lat, u.lng - params.lng);
    return [...pool].sort((a, b) => dist(a) - dist(b)).slice(0, 10);
  },

  async leaveReview(
    input: Omit<Review, "id" | "createdAt">,
  ): Promise<Review> {
    await sleep(250);
    return { ...input, id: uuid(), createdAt: new Date().toISOString() };
  },
};
