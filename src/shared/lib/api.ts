import { supabase } from "./supabase";
import type { Service, Task, Offer, Review, User } from "../types";

// ============================================================
// SERVICES
// ============================================================

type DbService = {
  id: string;
  provider_id: string;
  title: string;
  categories: string[];
  photo_url: string | null;
  price_from: number;
  lat: number | null;
  lng: number | null;
  rating: number;
  jobs_done: number;
  created_at: string;
};

function mapService(row: DbService): Service {
  return {
    id: row.id,
    providerId: row.provider_id,
    title: row.title,
    categories: row.categories ?? [],
    photoUrl: row.photo_url ?? "",
    priceFrom: row.price_from,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    rating: row.rating,
    jobsDone: row.jobs_done,
  };
}

export async function listServices(params?: {
  near?: { lat: number; lng: number };
  category?: string;
}): Promise<Service[]> {
  let query = supabase.from("services").select("*");

  if (params?.category) {
    query = query.contains("categories", [params.category]);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  let services = (data ?? []).map(mapService);

  if (params?.near) {
    const d = (s: Service) =>
      Math.hypot(s.lat - params.near!.lat, s.lng - params.near!.lng);
    services = services.sort((a, b) => d(a) - d(b));
  }

  return services;
}

export async function getService(id: string): Promise<Service | undefined> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;
  return mapService(data);
}

// ============================================================
// TASKS
// ============================================================

type DbTask = {
  id: string;
  creator_id: string;
  helper_id: string | null;
  title: string;
  description: string | null;
  category: string;
  status: string;
  budget: number | null;
  payment_type: string | null;
  photos: string[] | null;
  address: string | null;
  scheduled_at: string | null;
  created_at: string;
  // location_point is geography, we use lat/lng from profiles or direct columns
};

function mapTask(row: DbTask & { lat?: number; lng?: number }): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category,
    budget: row.budget ?? 0,
    photos: row.photos ?? [],
    status: row.status as Task["status"],
    requesterId: row.creator_id,
    helperId: row.helper_id ?? undefined,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    when: row.scheduled_at ?? row.created_at,
    createdAt: row.created_at,
  };
}

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => mapTask(row));
}

export async function listMyTasks(): Promise<Task[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .or(`creator_id.eq.${user.id},helper_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => mapTask(row));
}

export async function getTask(taskId: string): Promise<Task | undefined> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error || !data) return undefined;
  return mapTask(data as any);
}

export async function createTask(input: {
  title: string;
  description: string;
  category: string;
  budget: number;
  payment_type?: string;
  lat: number;
  lng: number;
  address?: string;
  photos?: string[];
  scheduled_at?: string;
}): Promise<Task> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      creator_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      budget: input.budget,
      payment_type: input.payment_type ?? "cash",
      photos: input.photos ?? [],
      address: input.address,
      scheduled_at: input.scheduled_at,
      location_point: `SRID=4326;POINT(${input.lng} ${input.lat})`,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTask({ ...data, lat: input.lat, lng: input.lng } as any);
}

// ============================================================
// OFFERS
// ============================================================

type DbOffer = {
  id: string;
  task_id: string;
  helper_id: string;
  amount: number;
  message: string | null;
  status: string;
  created_at: string;
};

function mapOffer(row: DbOffer): Offer {
  return {
    id: row.id,
    taskId: row.task_id,
    helperId: row.helper_id,
    amount: row.amount,
    message: row.message ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listOffers(taskId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapOffer);
}

export async function createOffer(input: {
  taskId: string;
  amount: number;
  message?: string;
}): Promise<Offer> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("offers")
    .insert({
      task_id: input.taskId,
      helper_id: user.id,
      amount: input.amount,
      message: input.message,
    })
    .select()
    .single();

  if (error) throw error;
  return mapOffer(data);
}

export async function acceptOffer({
  taskId,
  offerId,
}: {
  taskId: string;
  offerId: string;
}): Promise<void> {
  // Get the offer to find the helper
  const { data: offer, error: offerErr } = await supabase
    .from("offers")
    .select("helper_id")
    .eq("id", offerId)
    .single();

  if (offerErr || !offer) throw new Error("Offer not found");

  // Accept the offer
  await supabase
    .from("offers")
    .update({ status: "accepted" })
    .eq("id", offerId);

  // Reject all other offers for this task
  await supabase
    .from("offers")
    .update({ status: "rejected" })
    .eq("task_id", taskId)
    .neq("id", offerId);

  // Update task status and assign helper
  await supabase
    .from("tasks")
    .update({ status: "matched", helper_id: offer.helper_id })
    .eq("id", taskId);
}

export async function completeTask(taskId: string): Promise<void> {
  await supabase
    .from("tasks")
    .update({ status: "completed" })
    .eq("id", taskId);
}

// ============================================================
// HELPERS / PROFILES
// ============================================================

export async function getNearbyHelpers(params: {
  lat: number;
  lng: number;
  category?: string;
}): Promise<User[]> {
  let query = supabase
    .from("profiles")
    .select("*")
    .in("role", ["helper", "both"]);

  if (params.category) {
    query = query.contains("skills", [params.category]);
  }

  const { data, error } = await query.limit(20);
  if (error) throw error;

  return (data ?? [])
    .filter((p: any) => p.lat != null && p.lng != null)
    .map((p: any) => ({
      id: p.id,
      name: p.full_name ?? p.username ?? "Helper",
      photoUrl: p.avatar_url ?? undefined,
      skills: p.skills ?? [],
      rating: p.rating ?? 0,
      jobsDone: p.jobs_done ?? 0,
      lat: p.lat,
      lng: p.lng,
    }))
    .sort(
      (a: User, b: User) =>
        Math.hypot(a.lat - params.lat, a.lng - params.lng) -
        Math.hypot(b.lat - params.lat, b.lng - params.lng),
    )
    .slice(0, 10);
}

// ============================================================
// REVIEWS
// ============================================================

export async function leaveReview(input: {
  taskId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      task_id: input.taskId,
      reviewer_id: user.id,
      reviewee_id: input.revieweeId,
      rating: input.rating,
      comment: input.comment,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    taskId: data.task_id,
    fromUserId: data.reviewer_id,
    toUserId: data.reviewee_id,
    rating: data.rating,
    comment: data.comment ?? undefined,
    createdAt: data.created_at,
  };
}
