import { supabase } from "./supabase";

type Listener = (taskId: string, userId: string) => void;

let channel: any = null;
const listeners = new Set<Listener>();

function ensureChannel() {
  if (channel) return;
  channel = supabase.channel("typing-global", {
    config: { broadcast: { self: false } },
  });
  channel
    .on("broadcast", { event: "typing" }, ({ payload }: any) => {
      if (payload?.taskId && payload?.userId) {
        listeners.forEach((fn) => fn(payload.taskId, payload.userId));
      }
    })
    .subscribe();
}

export function onTyping(listener: Listener): () => void {
  ensureChannel();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function broadcastTyping(taskId: string, userId: string) {
  ensureChannel();
  channel?.send({
    type: "broadcast",
    event: "typing",
    payload: { taskId, userId },
  });
}
