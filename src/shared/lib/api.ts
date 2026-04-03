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

export async function listMyOffers(): Promise<(Offer & { task_title?: string; task_category?: string })[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("offers")
    .select("*, tasks(title, category)")
    .eq("helper_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...mapOffer(row),
    task_title: row.tasks?.title,
    task_category: row.tasks?.category,
  }));
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

export async function fetchReviewsForUser(userId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviewer_id(full_name, avatar_url), task:tasks!task_id(title)")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    fromUserId: row.reviewer_id,
    toUserId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
    reviewerName: row.reviewer?.full_name ?? "User",
    reviewerAvatarUrl: row.reviewer?.avatar_url ?? undefined,
    taskTitle: row.task?.title ?? undefined,
  }));
}

export async function fetchReviewStatus(taskId: string): Promise<{
  myReview: Review | null;
  canReview: boolean;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { myReview: null, canReview: false };

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("task_id", taskId)
    .eq("reviewer_id", user.id);

  const myReview = reviews && reviews.length > 0
    ? {
        id: reviews[0].id,
        taskId: reviews[0].task_id,
        fromUserId: reviews[0].reviewer_id,
        toUserId: reviews[0].reviewee_id,
        rating: reviews[0].rating,
        comment: reviews[0].comment ?? undefined,
        createdAt: reviews[0].created_at,
      }
    : null;

  return { myReview, canReview: !myReview };
}

export async function getPublicProfile(userId: string): Promise<{
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  skills: string[];
  rating: number;
  jobsDone: number;
  createdAt: string;
} | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.full_name ?? data.username ?? "User",
    bio: data.bio,
    avatarUrl: data.avatar_url,
    role: data.role,
    skills: data.skills ?? [],
    rating: data.rating ?? 0,
    jobsDone: data.jobs_done ?? 0,
    createdAt: data.created_at,
  };
}

// ============================================================
// MESSAGES / CHAT
// ============================================================

export type Conversation = {
  taskId: string;
  taskTitle: string;
  taskCategory: string;
  taskStatus: string;
  taskBudget: number;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  myLastReadAt: string | null;
};

export type Message = {
  id: string;
  taskId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export async function listConversations(): Promise<Conversation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get tasks where user is creator or helper with relevant statuses
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, category, status, budget, creator_id, helper_id")
    .or(`creator_id.eq.${user.id},helper_id.eq.${user.id}`)
    .in("status", ["matched", "in_progress", "completed"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!tasks || tasks.length === 0) return [];

  // Get the other party's profile for each task
  const otherIds = tasks.map((t: any) =>
    t.creator_id === user.id ? t.helper_id : t.creator_id,
  ).filter(Boolean);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .in("id", otherIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.id, p.full_name ?? p.username ?? "User"]),
  );

  // Get the latest message for each task
  const taskIds = tasks.map((t: any) => t.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("task_id, content, created_at, sender_id")
    .in("task_id", taskIds)
    .order("created_at", { ascending: false });

  const latestMessageMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
  for (const msg of messages ?? []) {
    if (!latestMessageMap.has(msg.task_id)) {
      latestMessageMap.set(msg.task_id, { content: msg.content, created_at: msg.created_at, sender_id: msg.sender_id });
    }
  }

  // Get read receipts for current user
  const { data: receipts } = await supabase
    .from("read_receipts")
    .select("task_id, last_read_at")
    .eq("user_id", user.id)
    .in("task_id", taskIds);

  const readMap = new Map(
    (receipts ?? []).map((r: any) => [r.task_id, r.last_read_at]),
  );

  return tasks.map((t: any) => {
    const otherId = t.creator_id === user.id ? t.helper_id : t.creator_id;
    const latest = latestMessageMap.get(t.id);
    return {
      taskId: t.id,
      taskTitle: t.title,
      taskCategory: t.category,
      taskStatus: t.status,
      taskBudget: t.budget ?? 0,
      otherUserId: otherId ?? "",
      otherUserName: profileMap.get(otherId) ?? "User",
      lastMessage: latest?.content ?? null,
      lastMessageAt: latest?.created_at ?? t.created_at ?? null,
      lastMessageSenderId: latest?.sender_id ?? null,
      myLastReadAt: readMap.get(t.id) ?? null,
    } as Conversation;
  }).sort((a, b) => {
    const aTime = a.lastMessageAt ?? "";
    const bTime = b.lastMessageAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

export async function listMessages(taskId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    taskId: row.task_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function sendMessage(taskId: string, content: string): Promise<Message> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      task_id: taskId,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    taskId: data.task_id,
    senderId: data.sender_id,
    content: data.content,
    createdAt: data.created_at,
  };
}

// ============================================================
// READ RECEIPTS
// ============================================================

export async function markAsRead(taskId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("read_receipts")
    .upsert(
      { task_id: taskId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "task_id,user_id" },
    );
}

// ============================================================
// MESSAGE REACTIONS
// ============================================================

export type MessageReaction = {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
};

export async function getReactionsForMessages(messageIds: string[]): Promise<Map<string, MessageReaction[]>> {
  if (messageIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", messageIds);

  if (error) throw error;

  const map = new Map<string, MessageReaction[]>();
  for (const row of data ?? []) {
    const reaction: MessageReaction = {
      id: row.id,
      messageId: row.message_id,
      userId: row.user_id,
      emoji: row.emoji,
    };
    const existing = map.get(row.message_id) ?? [];
    existing.push(reaction);
    map.set(row.message_id, existing);
  }
  return map;
}

export async function toggleReaction(messageId: string, emoji: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if user already reacted to this message
  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id, emoji")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji — remove reaction
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      // Different emoji — update
      await supabase.from("message_reactions").update({ emoji }).eq("id", existing.id);
    }
  } else {
    // No reaction yet — insert
    await supabase.from("message_reactions").insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    });
  }
}

export async function getOtherReadReceipt(
  taskId: string,
  otherUserId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("read_receipts")
    .select("last_read_at")
    .eq("task_id", taskId)
    .eq("user_id", otherUserId)
    .single();

  return data?.last_read_at ?? null;
}
